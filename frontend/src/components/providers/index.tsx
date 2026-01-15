'use client'

import { PrivyProvider } from './PrivyProvider'
import { WagmiProvider } from './WagmiProvider'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <PrivyProvider>
        <WagmiProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </WagmiProvider>
      </PrivyProvider>
    </ErrorBoundary>
  )
}
