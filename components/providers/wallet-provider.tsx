'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/store/wallet'

declare global {
  interface Window {
    kasware: any
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { connect, disconnect, updateBalance } = useWalletStore()

  useEffect(() => {
    if (typeof window.kasware === 'undefined') {
      console.log('Please install KasWare Wallet')
      return
    }

    // Listen for account changes
    window.kasware.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        connect()
      }
    })

    // Listen for network changes
    window.kasware.on('networkChanged', () => {
      updateBalance()
    })

    return () => {
      window.kasware.removeListener('accountsChanged', () => {})
      window.kasware.removeListener('networkChanged', () => {})
    }
  }, [])

  return <>{children}</>
} 