import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { votes } from '@/src/db/schema'
import { eq, and, sql } from 'drizzle-orm'

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
      // Remove existing vote
      await db
        .delete(votes)
        .where(and(
          eq(votes.postId, postId),
          eq(votes.userId, userId)
        ))
    } else {
      // Create new vote
      await db
        .insert(votes)
        .values({
          postId,
          userId,
          value: 1,
        })
    }

    // Get updated vote count
    const [result] = await db
      .select({
        voteCount: sql<number>`cast(count(*) as integer)`
      })
      .from(votes)
      .where(eq(votes.postId, postId))

    return NextResponse.json({ 
      voteCount: result.voteCount,
      hasVoted: !existingVote.length
    })
  } catch (error) {
    console.error('Error handling vote:', error)
    return NextResponse.json(
      { error: 'Failed to handle vote' },
      { status: 500 }
    )
  }
}