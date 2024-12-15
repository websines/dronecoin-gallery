import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { posts, users, comments, votes } from '@/src/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { title, content, mediaUrl, mediaType, userId } = await request.json()

    if (!title || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create post with media
    const [post] = await db
      .insert(posts)
      .values({
        title,
        content,
        imageUrl: mediaUrl,
        mediaType,
        authorId: userId,
      })
      .returning()

    // Fetch the created post with related data
    const [postWithRelations] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        imageUrl: posts.imageUrl,
        mediaType: posts.mediaType,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.postId} = ${posts.id})`,
          comments: sql`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
        },
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.id, post.id))

    return NextResponse.json(postWithRelations)
  } catch (error) {
    console.error('Error in posts POST:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const currentUserId = searchParams.get('currentUserId')

  try {
    const query = db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        imageUrl: posts.imageUrl,
        mediaType: posts.mediaType,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
        _count: {
          votes: sql`(SELECT COUNT(*) FROM ${votes} WHERE ${votes.postId} = ${posts.id})`,
          comments: sql`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
        },
        hasVoted: currentUserId 
          ? sql`EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.postId} = ${posts.id} AND ${votes.userId} = ${currentUserId})`
          : sql`false`,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .orderBy(desc(posts.createdAt))

    if (userId) {
      query.where(eq(posts.authorId, userId))
    }

    const allPosts = await query

    return NextResponse.json(allPosts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}