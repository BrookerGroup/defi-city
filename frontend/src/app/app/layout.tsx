import { PrivyProvider } from '@/components/providers/PrivyProvider'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrivyProvider>
      <WagmiProvider>
        {children}
      </WagmiProvider>
    </PrivyProvider>
  )
}
