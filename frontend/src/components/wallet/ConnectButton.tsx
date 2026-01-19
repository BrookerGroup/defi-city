'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useCallback } from 'react'

export function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const resetGame = useGameStore((state) => state.reset)

  const handleLogout = useCallback(async () => {
    // Clear game data
    resetGame()
    
    // Clear transaction history and game state from localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('tx-history-') || 
        key === 'defi-city-game-v2' ||
        key.startsWith('privy:') // Clear Privy session data
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Call Privy logout
    await logout()
    
    // Force reload to ensure clean state
    window.location.href = '/'
  }, [logout, resetGame])

  if (!ready) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (authenticated && user) {
    const address = user.wallet?.address
    const displayAddress = address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Connected'

    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="font-mono">
          <Wallet className="mr-2 h-4 w-4" />
          {displayAddress}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={login} size="sm">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
