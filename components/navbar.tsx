'use client'

import Link from 'next/link'
import { useWalletStore } from '@/store/wallet'
import { Button } from '@/components/ui/button'
import { PlusCircle, Rocket } from 'lucide-react'
import { formatAddress } from '@/lib/utils'

export function Navbar() {
  const { address, isConnected } = useWalletStore()

  const handleConnect = async () => {
    try {
      if (typeof window.kasware !== 'undefined') {
        await window.kasware.requestAccounts()
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-800/50 backdrop-blur-xl bg-black/30">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link 
          href="/" 
          className="flex items-center space-x-2"
        >
          <Rocket className="h-6 w-6 text-purple-500" />
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            DroneCoin
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {isConnected ? (
            <>
              <Link href="/create">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-800 bg-black/50 text-gray-300 hover:text-white hover:bg-purple-500/10 hover:border-purple-500"
                >
                  {formatAddress(address!)}
                </Button>
              </Link>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 bg-black/50 text-gray-300 hover:text-white hover:bg-purple-500/10 hover:border-purple-500"
              onClick={handleConnect}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
