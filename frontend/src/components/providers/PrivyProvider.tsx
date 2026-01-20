'use client'

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth'
import { baseSepolia } from 'viem/chains'
import { PRIVY_APP_ID } from '@/lib/constants'
import { useSyncExternalStore } from 'react'

// Subscribe to nothing - just for hydration safety
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  // Use useSyncExternalStore for hydration-safe mounted check
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  // Skip rendering on server - return null instead of children to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Check if Privy app ID is configured
  if (!PRIVY_APP_ID || PRIVY_APP_ID === 'your-privy-app-id') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Privy Not Configured</h1>
          <p className="text-slate-400">
            Please set your NEXT_PUBLIC_PRIVY_APP_ID in .env.local
          </p>
          <p className="text-sm text-slate-400">
            Get your App ID from{' '}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline"
            >
              dashboard.privy.io
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#F59E0B',
          logo: '/logo.png',
          showWalletLoginFirst: false,
        },
        loginMethods: ['email', 'google', 'wallet'],
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}
