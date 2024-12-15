import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { posts, users, comments, votes } from '@/src/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'

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
    const post = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.postId} = ${posts.id})`,
          comments: sql`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
        },
        hasVoted: userId ? sql`EXISTS (
          SELECT 1 FROM ${votes} 
          WHERE ${votes.postId} = ${posts.id} 
          AND ${votes.userId} = ${userId}
        )` : sql`false`,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.id, id))
      .limit(1)

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post[0])
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    // Get the userId from the request
    const { userId } = await req.json()

    // Verify post ownership
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!post.length || post[0].authorId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the post and all related data (comments and votes will be cascade deleted)
    await db
      .delete(posts)
      .where(eq(posts.id, id))

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
