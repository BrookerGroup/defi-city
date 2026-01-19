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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold">Privy Not Configured</h1>
          <p className="text-muted-foreground">
            Please set your NEXT_PUBLIC_PRIVY_APP_ID in .env.local
          </p>
          <p className="text-sm text-muted-foreground">
            Get your App ID from{' '}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
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
          accentColor: '#676FFF',
          logo: '/logo.png',
          // Prevent showing wallet login first - user must click to see wallet options
          showWalletLoginFirst: false,
        },
        // Include wallet as option but won't auto-detect/prompt
        loginMethods: ['email', 'google', 'wallet'],
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        // MFA/Passkey config for returning users
        mfa: {
          noPromptOnMfaRequired: false,
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}
