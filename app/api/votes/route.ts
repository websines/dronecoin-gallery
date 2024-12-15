import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { votes } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { postId, userId } = await req.json()

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if vote already exists
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.postId, postId),
        eq(votes.userId, userId)
      ))
      .limit(1)

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: 'Already voted' },
        { status: 400 }
      )
    }

    // Create new vote
    const [vote] = await db
      .insert(votes)
      .values({
        postId,
        userId,
      })
      .returning()

    return NextResponse.json(vote)
  } catch (error) {
    console.error('Error handling vote:', error)
    return NextResponse.json(
      { error: 'Failed to handle vote' },
      { status: 500 }
    )
  }
}