'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useHasWallet } from '@/hooks/useContracts'
import {
  GameCanvas,
  TopBar,
  BottomBar,
  CreateTownHallModal,
} from '@/components/game'
import { WalletInfo, DepositForm, WithdrawForm } from '@/components/wallet'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function AppPage() {
  const { ready, authenticated, user } = usePrivy()
  const eoaAddress = user?.wallet?.address
  const { hasWallet, loading: walletLoading } = useHasWallet(eoaAddress)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTownHallModal, setShowTownHallModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

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

  // Loading wallet status
  if (walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold">Checking your city...</span>
        </div>
      </div>
    )
  }

  // User needs to create Town Hall
  if (authenticated && !hasWallet) {
    return (
      <>
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
          <TopBar />

          {/* Welcome Message */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center space-y-6 pointer-events-auto max-w-2xl px-8">
              <div className="text-8xl mb-4">🏛️</div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                Welcome to DefiCity!
              </h1>
              <p className="text-xl text-slate-300">
                Start your journey by creating your Town Hall
              </p>
              <button
                onClick={() => setShowTownHallModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-orange-500/30"
              >
                Create Town Hall
              </button>
            </div>
          </div>

          {/* Faded game canvas in background */}
          <div className="opacity-30">
            <GameCanvas />
          </div>

          <BottomBar />
        </main>

        {/* Town Hall Modal */}
        <CreateTownHallModal
          isOpen={showTownHallModal}
          onClose={() => setShowTownHallModal(false)}
          onSuccess={(wallet, buildingId) => {
            setWalletAddress(wallet)
            setShowTownHallModal(false)
            // Refresh page to show game with wallet
            window.location.reload()
          }}
        />
      </>
    )
  }

  // Show game (user has wallet)
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
              <DepositForm smartWalletAddress={(walletAddress as `0x${string}`) || null} />
              <WithdrawForm smartWalletAddress={(walletAddress as `0x${string}`) || null} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
