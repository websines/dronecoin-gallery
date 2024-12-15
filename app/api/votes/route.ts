import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { votes } from '@/src/db/schema'
import { and, eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { userId, postId, commentId } = await req.json()

    if (!userId || (!postId && !commentId)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if vote already exists
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          commentId ? eq(votes.commentId, commentId) : eq(votes.postId, postId)
        )
      )
      .limit(1)

    if (existingVote.length > 0) {
      // If vote exists, delete it (toggle off)
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.userId, userId),
            commentId ? eq(votes.commentId, commentId) : eq(votes.postId, postId)
          )
        )

      return NextResponse.json({ action: 'removed' })
    }

    // If no existing vote, create a new one
    const [vote] = await db
      .insert(votes)
      .values({
        userId,
        postId: postId || null,
        commentId: commentId || null,
      })
      .returning()

    return NextResponse.json({ action: 'added', vote })
  } catch (error) {
    console.error('Error handling vote:', error)
    return NextResponse.json(
      { error: 'Failed to handle vote' },
      { status: 500 }
    )
  }
}