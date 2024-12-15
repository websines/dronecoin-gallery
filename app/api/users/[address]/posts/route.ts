import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { posts, users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, address))

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's posts
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, user.id))
      .orderBy(posts.createdAt)

    return NextResponse.json(userPosts)
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    )
  }
}
