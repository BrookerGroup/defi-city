'use client'

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth'
import { baseSepolia } from 'viem/chains'
import { PRIVY_APP_ID } from '@/lib/constants'
import { useEffect, useState } from 'react'

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Skip rendering on server or if not mounted
  if (!mounted) {
    return <>{children}</>
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
        },
        loginMethods: ['email', 'wallet', 'google'],
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}
