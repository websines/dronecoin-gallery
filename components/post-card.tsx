'use client'

import { useState } from 'react'
import { formatAddress, formatDate } from '@/lib/utils'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useWalletStore } from '@/store/wallet'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

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
  const { isConnected, userId } = useWalletStore()
  const { toast } = useToast()
  const [voteCount, setVoteCount] = useState<number>(Number(post._count?.votes ?? 0))
  const [isVoted, setIsVoted] = useState(post.hasVoted ?? false)
  const [isVoting, setIsVoting] = useState(false)
  const isAuthor = userId === post.author.id

  const handleVote = async () => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet to vote"
      })
      return
    }

    if (isVoting) return

    try {
      setIsVoting(true)

      // Store previous state for rollback
      const previousVoteState = isVoted
      const previousVoteCount = Number(voteCount)

      // Optimistically update UI
      setIsVoted(!previousVoteState)
      setVoteCount(previousVoteCount + (previousVoteState ? -1 : 1))

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
        // Rollback on error
        setIsVoted(previousVoteState)
        setVoteCount(previousVoteCount)
        const data = await response.json()
        throw new Error(data.error || 'Failed to vote')
      }

      // Get the updated vote count from the server
      const data = await response.json()
      setVoteCount(Number(data.voteCount))
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to vote on post"
      })
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      toast({
        variant: "default",
        title: "Success",
        description: "Post deleted successfully"
      })
      onDelete?.()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post"
      })
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.href,
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const renderMedia = () => {
    if (!post.imageUrl) return null

    const fileExtension = post.imageUrl.split('.').pop()?.toLowerCase()
    const isVideo = fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'webm'

    if (isVideo) {
      return (
        <div className="relative w-full aspect-video">
          <video
            className="w-full h-full object-cover rounded-lg"
            controls
            playsInline
            preload="metadata"
            onError={(e) => {
              console.error('Video playback error:', e)
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load video"
              })
            }}
          >
            <source src={post.imageUrl} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    return (
      <div className="relative w-full aspect-video">
        <Image
          src={post.imageUrl}
          alt={post.title || 'Post image'}
          fill
          className="object-cover rounded-lg"
          onError={() => toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load image"
          })}
        />
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">
            {post.title}
          </h3>
          <p className="text-gray-400 text-sm">
            Posted by {formatAddress(post.author.walletAddress)} •{' '}
            {formatDate(post.createdAt)}
          </p>
        </div>
        {isAuthor && (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-gray-300 mb-4">{post.content}</p>

      {renderMedia()}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-gray-400 hover:text-gray-300',
            isVoted && 'text-red-500 hover:text-red-400'
          )}
          onClick={handleVote}
          disabled={isVoting}
        >
          <Heart
            className={cn('mr-1.5 h-4 w-4', isVoted && 'fill-current')}
          />
          {voteCount}
        </Button>

        <Link href={`/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300">
            <MessageCircle className="mr-1.5 h-4 w-4" />
            {post._count?.comments ?? 0}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-300"
          onClick={handleShare}
        >
          <Share2 className="mr-1.5 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  )
}