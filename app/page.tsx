'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { PostCard } from '@/components/post-card'
import { ConnectWallet } from '@/components/connect-wallet'
import { Button } from '@/components/ui/button'
import { PlusCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useWalletStore } from '@/store/wallet'
import { motion } from 'framer-motion'

interface Post {
  id: string
  title: string
  content: string
  imageUrl: string | null
  mediaType?: 'image' | 'video' | null
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

function Hero() {
  const { isConnected } = useWalletStore()

  return (
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="bg-purple-500/10 rounded-full p-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
        <h1 className="text-5xl font-bold text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">DroneCoin</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Join the community of NJ Alien Drones enthusiasts. Share your experiences, discuss sightings, and connect with fellow observers.
        </p>
        <div className="flex items-center justify-center gap-4">
          <ConnectWallet />
          {isConnected && (
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <PostCard post={post} />
        </motion.div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
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
            <div className="h-3 bg-gray-700/30 rounded animate-pulse w-1/4" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const { userId, isConnected } = useWalletStore()
  const loader = useRef(null)

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts')
      if (!response.ok) throw new Error('Failed to fetch posts')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    if (target.isIntersecting && hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }, [hasMore, loading])

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    }
    const observer = new IntersectionObserver(handleObserver, option)
    if (loader.current) observer.observe(loader.current)
    
    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <Hero />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-white">Latest Posts</h2>
            {isConnected && (
              <Link href="/create">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>

          {loading && page === 1 ? (
            <LoadingSkeleton />
          ) : posts.length > 0 ? (
            <>
              <PostList posts={posts} />
              <div ref={loader} className="h-20 flex items-center justify-center">
                {loading && <div className="text-gray-400">Loading more posts...</div>}
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-800 rounded-2xl bg-black/30 backdrop-blur-sm"
            >
              <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200">No posts yet</h3>
              <p className="mt-2 text-gray-400">Be the first one to create a post!</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
