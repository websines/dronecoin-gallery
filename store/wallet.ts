import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  address: string | null
  isConnected: boolean
  userId: string | null
  balance: {
    confirmed: number
    unconfirmed: number
    total: number
  } | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  updateBalance: () => Promise<void>
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      userId: null,
      balance: null,

      connect: async () => {
        try {
          const accounts = await window.kasware.requestAccounts()
          const balance = await window.kasware.getBalance()
          const walletAddress = accounts[0]

          // Create or get user
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
          })

          if (!response.ok) {
            throw new Error('Failed to create/get user')
          }

          const user = await response.json()
          
          set({ 
            address: walletAddress,
            isConnected: true,
            userId: user.id,
            balance
          })
        } catch (error) {
          console.error('Failed to connect wallet:', error)
          set({ 
            address: null,
            isConnected: false,
            userId: null,
            balance: null
          })
        }
      },

      disconnect: async () => {
        try {
          const origin = window.location.origin
          await window.kasware.disconnect(origin)
          
          set({ 
            address: null,
            isConnected: false,
            userId: null,
            balance: null
          })
        } catch (error) {
          console.error('Failed to disconnect wallet:', error)
        }
      },

      updateBalance: async () => {
        try {
          const balance = await window.kasware.getBalance()
          set({ balance })
        } catch (error) {
          console.error('Failed to update balance:', error)
        }
      }
    }),
    {
      name: 'wallet-storage'
    }
  )
)