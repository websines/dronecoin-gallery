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
  }
  onDelete?: () => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const router = useRouter()
  const { isConnected, userId } = useWalletStore()
  const [voteCount, setVoteCount] = useState(post._count?.votes ?? 0)
  const [isVoted, setIsVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const isAuthor = userId === post.author.id

  const handleVote = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to vote')
      return
    }

    if (isVoting || isVoted) return

    try {
      setIsVoting(true)
      setIsVoted(true)
      setVoteCount(prev => prev + 1)

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
        setIsVoted(false)
        setVoteCount(prev => prev - 1)
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

  const handleCommentClick = () => {
    router.push(`/posts/${post.id}`)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/posts/${post.id}`
      )
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800/50 bg-black/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-200">
      {post.imageUrl && (
        <div className="relative aspect-[2/1] w-full overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/profile/${post.author.walletAddress}`}
            className="text-sm text-gray-400 hover:text-purple-400"
          >
            {formatAddress(post.author.walletAddress)}
          </Link>
          <span className="text-sm text-gray-500">
            {formatDate(post.createdAt)}
          </span>
        </div>
        <Link href={`/posts/${post.id}`}>
          <h3 className="text-xl font-semibold text-gray-100 mb-2 hover:text-purple-400">
            {post.title}
          </h3>
          <p className="text-gray-400 mb-6 line-clamp-2">{post.content}</p>
        </Link>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-400 hover:text-purple-400",
              isVoted && "text-purple-400"
            )}
            onClick={handleVote}
            disabled={isVoting || isVoted}
          >
            <Heart
              className={cn(
                "mr-2 h-4 w-4",
                isVoted && "fill-current"
              )}
            />
            {voteCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-purple-400"
            onClick={handleCommentClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {post._count?.comments ?? 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-purple-400 ml-auto"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isAuthor && (
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex items-center gap-1',
              isVoted && 'text-red-500'
            )}
            onClick={handleVote}
            disabled={isVoting || isVoted}
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
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-red-500 ml-auto"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete</span>
          </Button>
        </div>
      )}
    </div>
  )
}