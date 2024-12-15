'use client'

import { useState } from 'react'
import { formatAddress, formatDate } from '@/lib/utils'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useWalletStore } from '@/store/wallet'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    imageUrl: string | null
    createdAt: Date
    author: {
      id: string
      walletAddress: string
    }
    _count?: {
      votes?: number
      comments?: number
    }
    hasVoted?: boolean
  }
  onDelete?: () => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const router = useRouter()
  const { isConnected, userId } = useWalletStore()
  const [voteCount, setVoteCount] = useState(post._count?.votes ?? 0)
  const [isVoted, setIsVoted] = useState(post.hasVoted ?? false)
  const [isVoting, setIsVoting] = useState(false)
  const isAuthor = userId === post.author.id

  const handleVote = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to vote')
      return
    }

    if (isVoting) return

    try {
      setIsVoting(true)
      setIsVoted(prev => !prev)
      setVoteCount(prev => prev + (isVoted ? -1 : 1))

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId,
        }),
      })

      if (!response.ok) {
        setIsVoted(prev => !prev)
        setVoteCount(prev => prev + (isVoted ? 1 : -1))
        const data = await response.json()
        throw new Error(data.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to vote')
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!isConnected || !isAuthor) return

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error('Failed to delete post')

      toast.success('Post deleted successfully')
      onDelete?.()
      router.refresh()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="font-medium">{formatAddress(post.author.walletAddress)}</div>
        <div className="text-gray-500">·</div>
        <div className="text-gray-500 text-sm">
          {formatDate(new Date(post.createdAt))}
        </div>
      </div>

      <Link href={`/posts/${post.id}`}>
        <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">
          {post.title}
        </h2>
      </Link>

      <p className="text-gray-600 mb-4">{post.content}</p>

      {post.imageUrl && (
        <div className="relative w-full h-64 mb-4">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-1',
            isVoted && 'text-red-500'
          )}
          onClick={handleVote}
          disabled={isVoting}
        >
          <Heart className={cn('w-5 h-5', isVoted && 'fill-current')} />
          <span>{voteCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => router.push(`/posts/${post.id}`)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post._count?.comments ?? 0}</span>
        </Button>

        {isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-red-500 ml-auto"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete</span>
          </Button>
        )}
      </div>
    </div>
  )
}