'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Heart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useWalletStore } from '@/store/wallet'
import { formatAddress } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommentData {
  id: string
  content: string
  createdAt: Date
  author: {
    walletAddress: string
  }
  parentId: string | null
  _count: {
    replies: number
    votes: number
  }
  userVote?: {
    value: number
  }
}

interface Post {
  id: string
  title: string
  content: string
  imageUrl?: string
  createdAt: Date
  author: {
    walletAddress: string
  }
  _count: {
    comments: number
    votes: number
  }
  userVote?: {
    value: number
  }
}

export default function PostPage() {
  const params = useParams()
  const { address, isConnected, userId } = useWalletStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/posts/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch post')
        const postData = await response.json()
        
        // Fetch comments separately
        const commentsResponse = await fetch(`/api/posts/${params.id}/comments`)
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments')
        const rawComments = await commentsResponse.json()
        
        setPost({
          ...postData,
          createdAt: new Date(postData.createdAt)
        })
        setComments(rawComments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        })))
      } catch (error) {
        console.error('Error fetching post:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPost()
    }
  }, [params.id])

  const handleComment = async () => {
    if (!isConnected || !newComment.trim()) return

    // Store the comment content before clearing
    const commentContent = newComment
    const tempId = 'temp-' + Date.now()

    try {
      // Create optimistic comment
      const optimisticComment: CommentData = {
        id: tempId,
        content: commentContent,
        createdAt: new Date(),
        author: {
          walletAddress: address!
        },
        parentId: replyTo,
        _count: {
          replies: 0,
          votes: 0
        }
      }

      // Optimistic update
      setComments(prev => [optimisticComment, ...prev])
      setNewComment('')
      setReplyTo(null)

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post?.id,
          content: commentContent,
          parentId: replyTo,
          walletAddress: address
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert on failure
        setComments(prev => prev.filter(comment => comment.id !== tempId))
        setNewComment(commentContent)
        setReplyTo(replyTo)
        throw new Error(data.error || 'Failed to post comment')
      }

      // Replace optimistic comment with real one
      setComments(prev => prev.map(comment => 
        comment.id === tempId ? {
          ...data.comment,
          createdAt: new Date(data.comment.createdAt)
        } : comment
      ))
    } catch (error) {
      console.error('Error posting comment:', error)
      // Revert optimistic update on network error
      setComments(prev => prev.filter(comment => comment.id !== tempId))
      setNewComment(commentContent)
      setReplyTo(replyTo)
    }
  }

  const handleVote = async () => {
    if (!isConnected || !post || isVoting) return

    try {
      setIsVoting(true)
      // Optimistic update
      const previousVoteCount = post._count.votes
      const previousVoteState = post.userVote?.value === 1
      
      setPost(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          votes: prev._count.votes + (previousVoteState ? -1 : 1)
        },
        userVote: previousVoteState ? undefined : { value: 1 }
      } : null)

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          userId,
          walletAddress: address
        }),
      })

      if (!response.ok) {
        // Revert on failure
        setPost(prev => prev ? {
          ...prev,
          _count: { ...prev._count, votes: previousVoteCount },
          userVote: previousVoteState ? { value: 1 } : undefined
        } : null)
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      // Update with server data
      setPost(prev => prev ? {
        ...prev,
        _count: { ...prev._count, votes: data.voteCount },
        userVote: data.hasVoted ? { value: 1 } : undefined
      } : null)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      // Optimistic update
      setComments(prev => prev.filter(c => c.id !== commentId))

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: address,
          userId: userId 
        })
      })

      if (!response.ok) {
        // Revert on failure
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      // Refetch comments to restore state
      const commentsResponse = await fetch(`/api/posts/${params.id}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        })))
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-800/50 rounded-2xl backdrop-blur-sm"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-800/50 rounded-lg w-3/4"></div>
              <div className="h-4 bg-gray-800/50 rounded-lg w-1/4"></div>
              <div className="h-32 bg-gray-800/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">Post not found</h1>
          <p className="text-gray-400">The post you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-gray-800/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm border border-gray-700/30">
          {post.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden">
              {post.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <video
                  src={post.imageUrl}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  controls
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              )}
            </div>
          )}
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 text-sm">
                <span className="px-3 py-1 bg-purple-500/10 rounded-full text-purple-400 font-medium">
                  {formatAddress(post?.author.walletAddress || '')}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{post && formatDistanceToNow(new Date(post.createdAt))} ago</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVote}
                className={cn(
                  'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors',
                  post?.userVote?.value === 1 && 'text-purple-400 bg-purple-500/10'
                )}
                disabled={isVoting || !isConnected}
              >
                <Heart
                  className={cn('mr-1.5 h-5 w-5', post?.userVote?.value === 1 && 'fill-current')}
                />
                <span className="font-medium">{post?._count.votes || 0}</span>
              </Button>
            </div>
            
            <h1 className="mt-4 text-4xl font-bold text-white tracking-tight">{post?.title}</h1>
            <p className="mt-6 text-gray-300 leading-relaxed whitespace-pre-wrap">{post?.content}</p>
            
            <div className="mt-12">
              <div className="flex items-center space-x-2 mb-8">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Comments</h2>
              </div>
              
              {isConnected ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Textarea
                    placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[120px] bg-gray-900/50 border-gray-700/50 focus:border-purple-500/50 rounded-xl resize-none transition-colors text-white placeholder:text-gray-500"
                  />
                  <div className="flex justify-between items-center">
                    {replyTo && (
                      <Button
                        variant="ghost"
                        onClick={() => setReplyTo(null)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        Cancel Reply
                      </Button>
                    )}
                    <Button
                      onClick={handleComment}
                      disabled={!newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6"
                    >
                      {replyTo ? "Post Reply" : "Post Comment"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-purple-500/10 rounded-xl p-6 text-center">
                  <p className="text-purple-300">Connect your wallet to join the conversation</p>
                </div>
              )}
              
              <div className="mt-8 space-y-6">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="px-3 py-1 bg-gray-700/30 rounded-full text-gray-300">
                          {formatAddress(comment.author.walletAddress)}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      {comment.author.walletAddress.toLowerCase() === address?.toLowerCase() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteComment(comment.id)
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="mt-3 text-gray-300">{comment.content}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo(comment.id)}
                          disabled={!isConnected}
                          className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                        >
                          <MessageCircle className="mr-1.5 h-4 w-4" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
