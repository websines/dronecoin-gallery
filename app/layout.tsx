import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"
import { WalletProvider } from "@/components/providers/wallet-provider"
import "./globals.css"
import { Navbar } from '@/components/navbar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'DroneCoin - Community Driven Meme Platform',
  description: 'Share and earn rewards for your meme contributions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <WalletProvider>
          <Toaster />
          <Navbar />
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
