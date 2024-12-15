import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { and, eq } from 'drizzle-orm'
import { comments, votes, users } from '@/src/db/schema'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const { commentId, value, walletAddress } = await request.json()

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
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.commentId, commentId),
        eq(votes.userId, user.id)
      ),
    })

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote if clicking the same button
        await db
          .delete(votes)
          .where(eq(votes.id, existingVote.id))
      } else {
        // Update vote if changing from upvote to downvote or vice versa
        await db
          .update(votes)
          .set({ value })
          .where(eq(votes.id, existingVote.id))
      }
    } else {
      // Create new vote
      await db
        .insert(votes)
        .values({
          id: nanoid(),
          value,
          commentId,
          userId: user.id,
        })
    }

    // Get updated comment with vote count
    const updatedComment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      with: {
        votes: true,
        _count: {
          votes: true,
        },
      },
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error voting on comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
