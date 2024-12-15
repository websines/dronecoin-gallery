import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { posts, users, comments, votes } from '@/src/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { Buffer } from 'buffer'
import path from 'path'
import * as fsPromises from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const walletAddress = formData.get('address') as string
    
    if (!walletAddress) {
      return new Response('Unauthorized - Wallet not connected', { status: 401 })
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const mediaFile = formData.get('media') as File | null
    const imageUrl = formData.get('imageUrl') as string | null
    const mediaType = formData.get('mediaType') as string | null

    if (!title || !content) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Get or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          walletAddress,
        })
        .returning()
    }

    // Create post with media
    const [post] = await db
      .insert(posts)
      .values({
        title,
        content,
        imageUrl,
        mediaType: mediaType as 'image' | 'video' | null,
        authorId: user.id,
        createdAt: new Date(),
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