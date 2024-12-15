import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { comments } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params)

  if (!id) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    )
  }

  try {
    const { userId } = await req.json()

    // Verify comment ownership
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)

    if (!comment.length || comment[0].authorId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the comment
    await db
      .delete(comments)
      .where(eq(comments.id, id))

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
