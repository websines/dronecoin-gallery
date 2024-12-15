'use client'

import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/wallet'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Trash2, LogOut, User, MessageSquare, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-800/50 rounded-lg w-1/4" />
        <div className="h-6 bg-gray-800/50 rounded-lg w-1/2" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/30 backdrop-blur-sm"
          >
            <div className="aspect-video bg-gray-700/30 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-700/30 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-700/30 rounded animate-pulse w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
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

    async function fetchUserActivity() {
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

    fetchUserActivity()
  }, [isConnected, userId, router])

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-3">
                  <div className="bg-purple-500/10 rounded-full p-3">
                    <User className="w-8 h-8 text-purple-400" />
                  </div>
                  <h1 className="text-4xl font-bold text-white">Your Profile</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 bg-purple-500/10 rounded-full text-purple-400 font-medium">
                    {address}
                  </span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <main className="container mx-auto px-4 -mt-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm overflow-hidden"
          >
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full border-b border-gray-700/30">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                  <TabsTrigger 
                    value="posts"
                    className="relative h-full flex items-center px-4 data-[state=active]:text-purple-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-purple-400"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Posts ({posts.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments"
                    className="relative h-full flex items-center px-4 data-[state=active]:text-purple-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-purple-400"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comments ({comments.length})
                  </TabsTrigger>
                </div>
              </TabsList>

              <div className="p-6">
                <TabsContent value="posts">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : posts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <PostCard post={post} onDelete={() => setPosts(posts.filter(p => p.id !== post.id))} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center p-12 text-center"
                    >
                      <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-200">No posts yet</h3>
                      <p className="mt-2 text-gray-400">Start sharing your experiences with the community!</p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="comments">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-gray-800/30 rounded-xl p-6 animate-pulse"
                        >
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-700/30 rounded w-1/4" />
                            <div className="h-4 bg-gray-700/30 rounded w-3/4" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment, index) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group bg-gray-800/30 rounded-xl p-6 border border-gray-700/30"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="text-sm text-purple-400">
                                On post: {comment.post.title}
                              </p>
                              <p className="text-gray-300">{comment.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center p-12 text-center"
                    >
                      <MessageSquare className="w-12 h-12 text-purple-400 mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-200">No comments yet</h3>
                      <p className="mt-2 text-gray-400">Join the conversation by commenting on posts!</p>
                    </motion.div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
