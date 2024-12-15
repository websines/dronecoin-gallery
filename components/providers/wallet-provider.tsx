'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/store/wallet'

interface KaswareWindow extends Window {
  kasware?: {
    requestAccounts: () => Promise<string[]>
    getBalance: () => Promise<{
      confirmed: number
      unconfirmed: number
      total: number
    }>
  }
}

declare const window: KaswareWindow

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { connect, disconnect, updateBalance } = useWalletStore()

  useEffect(() => {
    const handleAccountsChanged = () => {
      connect()
    }

    const handleDisconnect = () => {
      disconnect()
    }

    const handleNetworkChanged = () => {
      updateBalance()
    }

    window.addEventListener('kasware#accountsChanged', handleAccountsChanged)
    window.addEventListener('kasware#disconnect', handleDisconnect)
    window.addEventListener('kasware#networkChanged', handleNetworkChanged)

    return () => {
      window.removeEventListener('kasware#accountsChanged', handleAccountsChanged)
      window.removeEventListener('kasware#disconnect', handleDisconnect)
      window.removeEventListener('kasware#networkChanged', handleNetworkChanged)
    }
  }, [connect, disconnect, updateBalance])

  return <>{children}</>
}