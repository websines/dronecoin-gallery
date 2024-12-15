import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { comments, users, votes } from '@/src/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params)

  if (!id) {
    return NextResponse.json(
      { error: 'Post ID is required' },
      { status: 400 }
    )
  }

  try {
    const { content, userId } = await req.json()

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create comment
    const [comment] = await db
      .insert(comments)
      .values({
        content,
        authorId: userId,
        postId: id,
      })
      .returning()

    // Fetch the created comment with related data
    const [commentWithRelations] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.commentId} = ${comments.id})`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(eq(comments.id, comment.id))

    return NextResponse.json(commentWithRelations)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params)

  if (!id) {
    return NextResponse.json(
      { error: 'Post ID is required' },
      { status: 400 }
    )
  }

  try {
    const allComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.commentId} = ${comments.id})`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json(allComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
