'use client'

import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/wallet'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Trash2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const { isConnected, userId, disconnect, address } = useWalletStore()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }
    fetchUserActivity()
  }, [isConnected, userId, router, fetchUserActivity])

  const fetchUserActivity = async () => {
    if (!userId) return
    try {
      setIsLoading(true)
      const [postsRes, commentsRes] = await Promise.all([
        fetch(`/api/posts?authorId=${userId}`),
        fetch(`/api/comments?authorId=${userId}`)
      ])

      if (!postsRes.ok || !commentsRes.ok) {
        throw new Error('Failed to fetch user activity')
      }

      const [postsData, commentsData] = await Promise.all([
        postsRes.json(),
        commentsRes.json()
      ])

      setPosts(postsData)
      setComments(commentsData)
    } catch (error) {
      console.error('Error fetching user activity:', error)
      toast.error('Failed to load your activity')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setComments(comments.filter(comment => comment.id !== commentId))
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Your Profile</h1>
            <p className="text-gray-400">{address}</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading posts...</div>
            ) : posts.length > 0 ? (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No posts yet</div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading comments...</div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-800/50 rounded-lg p-4 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-400 mb-2">
                          On post: {comment.post.title}
                        </p>
                        <p className="text-white">{comment.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No comments yet</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
