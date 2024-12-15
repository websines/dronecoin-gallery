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
import { motion } from 'framer-motion'

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
  const { isConnected, userId, address } = useWalletStore()
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
      const previousVoteState = isVoted
      const previousVoteCount = voteCount
      setIsVoted(!previousVoteState)
      setVoteCount(prev => prev + (!previousVoteState ? 1 : -1))

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId,
          walletAddress: address
        }),
      })

      if (!response.ok) {
        setIsVoted(previousVoteState)
        setVoteCount(previousVoteCount)
        const data = await response.json()
        throw new Error(data.error || 'Failed to vote')
      }

      const data = await response.json()
      setVoteCount(data.voteCount)
      setIsVoted(data.hasVoted)
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

  return (
    <Link href={`/post/${post.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/30 backdrop-blur-sm hover:border-purple-500/30 transition-colors group"
      >
        {post.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden">
            {post.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
              <video
                src={post.imageUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                preload="metadata"
                muted
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
            <span className="px-2 py-1 bg-purple-500/10 rounded-full text-purple-400 text-xs">
              {formatAddress(post.author.walletAddress)}
            </span>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  handleVote()
                }}
                className={cn(
                  'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors',
                  isVoted && 'text-purple-400 bg-purple-500/10'
                )}
                disabled={isVoting}
              >
                <Heart
                  className={cn('mr-1.5 h-5 w-5', isVoted && 'fill-current')}
                />
                <span className="font-medium">{voteCount}</span>
              </Button>
              
              <div className="flex items-center text-gray-400 text-sm">
                <MessageCircle className="mr-1.5 h-4 w-4" />
                {post._count?.comments ?? 0}
              </div>
            </div>
            
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}