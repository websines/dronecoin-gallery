import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { comments, users, posts } from '@/src/db/schema'
import { nanoid } from 'nanoid'
import { desc, eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { postId, content, parentId, walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.walletAddress, walletAddress),
    })

    if (!user) {
      user = await db
        .insert(users)
        .values({
          id: nanoid(),
          walletAddress,
        })
        .returning()
        .then(rows => rows[0])
    }

    const comment = await db
      .insert(comments)
      .values({
        id: nanoid(),
        content,
        postId,
        parentId,
        authorId: user?.id,
      })
      .returning()

    const commentWithRelations = await db.query.comments.findFirst({
      where: eq(comments.id, comment[0].id),
      with: {
        author: true,
        votes: true,
        _count: {
          votes: true,
          replies: true,
        },
      },
    })

    return NextResponse.json({ comment: commentWithRelations })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  try {
    const query = db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        post: {
          id: posts.id,
          title: posts.title,
        },
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .leftJoin(posts, eq(posts.id, comments.postId))
      .orderBy(desc(comments.createdAt))

    if (userId) {
      query.where(eq(comments.authorId, userId))
    }

    const userComments = await query

    return NextResponse.json(userComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
