import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { comments, users, votes } from '@/src/db/schema'
import { desc, eq, and, sql, isNull } from 'drizzle-orm'

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
    const { content, userId, parentId } = await req.json()

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If this is a reply, check parent comment's level
    let level = 0
    if (parentId) {
      const parentComment = await db
        .select({ level: comments.level })
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1)

      if (!parentComment.length) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      if (parentComment[0].level >= 2) {
        return NextResponse.json(
          { error: 'Maximum nesting level reached' },
          { status: 400 }
        )
      }

      level = parentComment[0].level + 1
    }

    // Create comment
    const [comment] = await db
      .insert(comments)
      .values({
        content,
        authorId: userId,
        postId: id,
        parentId: parentId || null,
        level,
      })
      .returning()

    // Fetch the created comment with related data
    const [commentWithRelations] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
        level: comments.level,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.commentId} = ${comments.id})`,
          replies: sql`(SELECT COUNT(*) FROM ${comments} c2 WHERE c2.parentId = ${comments.id})`,
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
  const userId = req.nextUrl.searchParams.get('userId')

  if (!id) {
    return NextResponse.json(
      { error: 'Post ID is required' },
      { status: 400 }
    )
  }

  try {
    // First fetch top-level comments
    const allComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
        level: comments.level,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.commentId} = ${comments.id})`,
          replies: sql`(SELECT COUNT(*) FROM ${comments} c2 WHERE c2.parentId = ${comments.id})`,
        },
        hasVoted: userId ? sql`EXISTS (
          SELECT 1 FROM ${votes} 
          WHERE ${votes.commentId} = ${comments.id} 
          AND ${votes.userId} = ${userId}
        )` : sql`false`,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(and(
        eq(comments.postId, id),
        isNull(comments.parentId)
      ))
      .orderBy(desc(comments.createdAt))

    // For each top-level comment, fetch its replies
    const commentsWithReplies = await Promise.all(
      allComments.map(async (comment) => {
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            parentId: comments.parentId,
            level: comments.level,
            author: {
              id: users.id,
              walletAddress: users.walletAddress,
            },
            _count: {
              votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.commentId} = ${comments.id})`,
              replies: sql`(SELECT COUNT(*) FROM ${comments} c2 WHERE c2.parentId = ${comments.id})`,
            },
            hasVoted: userId ? sql`EXISTS (
              SELECT 1 FROM ${votes} 
              WHERE ${votes.commentId} = ${comments.id} 
              AND ${votes.userId} = ${userId}
            )` : sql`false`,
          })
          .from(comments)
          .leftJoin(users, eq(users.id, comments.authorId))
          .where(eq(comments.parentId, comment.id))
          .orderBy(desc(comments.createdAt))

        return {
          ...comment,
          replies,
        }
      })
    )

    return NextResponse.json(commentsWithReplies)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
