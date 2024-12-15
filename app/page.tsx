import { Suspense } from 'react'
import { PostCard } from '@/components/post-card'
import { ConnectWallet } from '@/components/connect-wallet'
import { useWalletStore } from '@/store/wallet'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

// Client Component for the hero section
function Hero() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            DroneCoin Community
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Join the future of decentralized meme sharing. Create, share, and earn rewards for your contributions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  )
}

// Client Component for displaying posts
function PostList({ posts }: { posts: any[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

export default async function Home() {
  const { userId } = useWalletStore()
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        const url = new URL('/api/posts', window.location.origin)
        if (userId) {
          url.searchParams.set('userId', userId)
        }
        const response = await fetch(url)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950">
        <Hero />
        <div className="container max-w-4xl py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <Hero />
      <Suspense fallback={<div>Loading posts...</div>}>
        <main className="flex min-h-screen flex-col items-center pt-24 px-4">
          <div className="container max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Latest Posts
              </h1>
              <Link href="/create">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-800 rounded-lg bg-black/30 backdrop-blur-sm">
                <h3 className="mt-2 text-xl font-semibold text-gray-200">No posts yet</h3>
                <p className="mt-1 text-gray-400">Be the first one to create a post!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>
      </Suspense>
    </div>
  )
}
