'use client'

import { PrivyProvider } from './PrivyProvider'
import { WagmiProvider } from './WagmiProvider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider>
      <WagmiProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </WagmiProvider>
    </PrivyProvider>
  )
}
