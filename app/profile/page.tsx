'use client'

import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/wallet'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Post {
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

interface Comment {
  id: string
  content: string
  createdAt: Date
  post: {
    id: string
    title: string
  }
  _count?: {
    votes?: number
  }
}

export default function ProfilePage() {
  const { isConnected, userId } = useWalletStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isConnected || !userId) {
      toast.error('Please connect your wallet')
      return
    }

    const fetchUserActivity = async () => {
      try {
        setIsLoading(true)
        
        // Fetch user's posts
        const postsResponse = await fetch(`/api/posts?userId=${userId}`)
        if (!postsResponse.ok) throw new Error('Failed to fetch posts')
        const postsData = await postsResponse.json()
        setPosts(postsData)

        // Fetch user's comments
        const commentsResponse = await fetch(`/api/comments?userId=${userId}`)
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments')
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      } catch (error) {
        console.error('Error fetching user activity:', error)
        toast.error('Failed to load activity')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserActivity()
  }, [isConnected, userId])

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  const handleCommentDelete = async (commentId: string) => {
    try {
      // Optimistically remove comment
      setComments(prev => prev.filter(comment => comment.id !== commentId))

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        // Revert on error
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete comment')
      }

      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  }

  if (!isConnected) {
    return (
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p>Please connect your wallet to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {isLoading ? (
            <div>Loading posts...</div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => handlePostDelete(post.id)}
                />
              ))}
            </div>
          ) : (
            <p>You haven't created any posts yet.</p>
          )}
        </TabsContent>

        <TabsContent value="comments">
          {isLoading ? (
            <div>Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        On post: {comment.post.title}
                      </div>
                      <p>{comment.content}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleCommentDelete(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>You haven't made any comments yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
