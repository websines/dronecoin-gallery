'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/post-card'
import { ConnectWallet } from '@/components/connect-wallet'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useWalletStore } from '@/store/wallet'

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
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">
        Welcome to DroneCoin
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        NJ Alien Drones
      </p>
      <div className="flex items-center justify-center gap-4">
        <ConnectWallet />
        {isConnected && (
          <Link href="/create">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { userId, isConnected } = useWalletStore()

  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/posts${userId ? `?currentUserId=${userId}` : ''}`
        )
        if (!response.ok) throw new Error('Failed to fetch posts')
        const data = await response.json()
        setPosts(data)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [userId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <Hero />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Latest Posts</h2>
            {isConnected && (
              <Link href="/create">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="text-center text-gray-400">Loading posts...</div>
          ) : posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-800 rounded-lg bg-black/30 backdrop-blur-sm">
              <h3 className="mt-2 text-xl font-semibold text-gray-200">No posts yet</h3>
              <p className="mt-1 text-gray-400">Be the first one to create a post!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
