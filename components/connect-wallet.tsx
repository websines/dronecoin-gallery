'use client'

import { Button } from '@/components/ui/button'
import { useWalletStore } from '@/store/wallet'
import { formatAddress } from '@/lib/utils'

export function ConnectWallet() {
  const { address, isConnected, connect, disconnect } = useWalletStore()

  return (
    <Button 
      onClick={isConnected ? disconnect : connect}
      variant={isConnected ? "outline" : "default"}
    >
      {isConnected ? formatAddress(address!) : "Connect Wallet"}
    </Button>
  )
} 