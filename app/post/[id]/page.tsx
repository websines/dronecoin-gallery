'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useWalletStore } from '@/store/wallet'
import { formatAddress } from '@/lib/utils'

interface Comment {
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
  const { address, isConnected } = useWalletStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
        const commentsData = await commentsResponse.json()
        
        setPost({
          ...postData,
          createdAt: new Date(postData.createdAt)
        })
        setComments(commentsData.map((comment: any) => ({
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

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post?.id,
          content: newComment,
          parentId: replyTo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        setReplyTo(null)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  const handleVote = async (commentId: string, value: number) => {
    if (!isConnected) return

    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          value,
        }),
      })

      if (response.ok) {
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  _count: {
                    ...comment._count,
                    votes: comment._count.votes + (value - (comment.userVote?.value || 0)),
                  },
                  userVote: { value },
                }
              : comment
          )
        )
      }
    } catch (error) {
      console.error('Error voting on comment:', error)
    }
  }

  const renderComment = (comment: Comment, depth = 0) => {
    return (
      <div
        key={comment.id}
        className={`pl-${depth * 4} py-4 border-b border-gray-700/50`}
      >
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>{formatAddress(comment.author.walletAddress)}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
        </div>
        
        <p className="mt-2 text-gray-300">{comment.content}</p>
        
        <div className="mt-2 flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(comment.id, 1)}
              className={comment.userVote?.value === 1 ? 'text-green-500' : 'text-gray-400'}
              disabled={!isConnected}
            >
              <ArrowBigUp className="h-4 w-4" />
            </Button>
            <span className="text-white font-medium">{comment._count.votes}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(comment.id, -1)}
              className={comment.userVote?.value === -1 ? 'text-red-500' : 'text-gray-400'}
              disabled={!isConnected}
            >
              <ArrowBigDown className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyTo(comment.id)}
            disabled={!isConnected}
          >
            Reply
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center text-white">Post not found</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg backdrop-blur-sm border border-gray-700/50">
        {post.imageUrl && (
          <div className="relative h-96 w-full">
            {post.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
              <video
                src={post.imageUrl}
                className="w-full h-full object-cover"
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
                className="object-cover"
              />
            )}
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{formatAddress(post.author.walletAddress)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
          </div>
          
          <h1 className="mt-2 text-3xl font-bold text-white">{post.title}</h1>
          <p className="mt-4 text-gray-300 whitespace-pre-wrap">{post.content}</p>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Comments</h2>
            
            {isConnected ? (
              <div className="space-y-4">
                <Textarea
                  placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between items-center">
                  {replyTo && (
                    <Button
                      variant="ghost"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel Reply
                    </Button>
                  )}
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                  >
                    {replyTo ? "Post Reply" : "Post Comment"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Connect your wallet to comment</p>
            )}
            
            <div className="mt-8 space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
