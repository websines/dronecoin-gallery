'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useWalletStore } from '@/store/wallet'
import { formatAddress, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    walletAddress: string
  }
  _count?: {
    votes?: number
  }
}

export default function PostPage() {
  const { id } = useParams()
  const { isConnected, userId } = useWalletStore()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoadingPost(true)
        const url = new URL(`/api/posts/${id}`, window.location.origin)
        if (userId) {
          url.searchParams.set('userId', userId)
        }
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch post')
        const data = await response.json()
        setPost(data)
      } catch (error) {
        console.error('Error fetching post:', error)
        setError('Failed to load post')
        toast.error('Failed to load post')
      } finally {
        setIsLoadingPost(false)
      }
    }

    const fetchComments = async () => {
      try {
        setIsLoadingComments(true)
        const response = await fetch(`/api/posts/${id}/comments`)
        if (!response.ok) throw new Error('Failed to fetch comments')
        const data = await response.json()
        setComments(data || [])
      } catch (error) {
        console.error('Error fetching comments:', error)
        toast.error('Failed to load comments')
      } finally {
        setIsLoadingComments(false)
      }
    }

    if (id) {
      fetchPost()
      fetchComments()
    }
  }, [id, userId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Please connect your wallet to comment')
      return
    }

    if (isLoading || !newComment.trim()) return

    try {
      setIsLoading(true)
      
      // Create optimistic comment
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        content: newComment,
        createdAt: new Date(),
        author: {
          id: userId!,
          walletAddress: useWalletStore.getState().walletAddress || '',
        },
        _count: {
          votes: 0
        }
      }

      // Optimistically add the comment
      setComments(prev => [optimisticComment, ...prev])
      setNewComment('')

      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: optimisticComment.content,
          userId,
        }),
      })

      if (!response.ok) {
        // Remove optimistic comment on error
        setComments(prev => prev.filter(comment => comment.id !== optimisticComment.id))
        throw new Error('Failed to post comment')
      }

      const newCommentData = await response.json()
      // Replace optimistic comment with real one
      setComments(prev => 
        prev.map(comment => 
          comment.id === optimisticComment.id ? newCommentData : comment
        )
      )
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommentVote = async (commentId: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to vote')
      return
    }

    try {
      // Optimistically update the vote count
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                _count: {
                  votes: (comment._count?.votes || 0) + 1
                }
              }
            : comment
        )
      )

      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          userId,
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  _count: {
                    votes: (comment._count?.votes || 0) - 1
                  }
                }
              : comment
          )
        )
        throw new Error('Failed to vote on comment')
      }
    } catch (error) {
      console.error('Error voting on comment:', error)
      toast.error('Failed to vote on comment')
    }
  }

  if (isLoadingPost) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-800 rounded-xl" />
          <div className="h-8 w-1/2 bg-gray-800 rounded" />
          <div className="h-4 w-1/4 bg-gray-800 rounded" />
          <div className="h-20 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container max-w-4xl py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          {error || 'Post not found'}
        </h2>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <PostCard post={post} />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Comments</h2>
        
        <div className="mb-6">
          <Textarea
            placeholder={isConnected ? "Write a comment..." : "Connect wallet to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>

        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-gray-800/50 bg-black/30">
                  <div className="h-4 w-1/4 bg-gray-800 rounded mb-2" />
                  <div className="h-12 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-lg border border-gray-800/50 bg-black/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    {formatAddress(comment.author.walletAddress)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
