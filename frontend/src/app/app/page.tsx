'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import {
  GameCanvas,
  TopBar,
  BottomBar,
  CreateWalletScreen,
} from '@/components/game'
import { WalletInfo, DepositForm, WithdrawForm } from '@/components/wallet'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function AppPage() {
  const { ready, authenticated } = usePrivy()
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { hasWallet, walletAddress, isLoading } = useSmartWallet(eoaAddress)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Not ready yet
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold">Loading DefiCity...</span>
        </div>
      </div>
    )
  }

  // Authenticated but no smart wallet - show create wallet screen
  if (authenticated && !isLoading && !hasWallet) {
    return <CreateWalletScreen />
  }

  // Loading wallet status (only if authenticated)
  if (authenticated && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold">Loading your city...</span>
        </div>
      </div>
    )
  }

  // Show game (works with or without authentication)
  return (
    <main className="relative min-h-screen overflow-hidden">
      <TopBar />
      <GameCanvas />
      <BottomBar />

      {/* Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 rounded-l-lg rounded-r-none"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-14 bottom-20 w-80 bg-background/95 backdrop-blur border-l transition-transform z-40 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 space-y-4">
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="wallet" className="mt-4">
              <WalletInfo />
            </TabsContent>
            <TabsContent value="actions" className="mt-4 space-y-4">
              <DepositForm smartWalletAddress={walletAddress} />
              <WithdrawForm smartWalletAddress={walletAddress} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
