import { http, createConfig } from 'wagmi'
import { baseSepolia, hardhat } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { RPC_URL, WALLETCONNECT_PROJECT_ID } from './constants'

const useLocalhost = process.env.NEXT_PUBLIC_USE_LOCALHOST === 'true'
const chains = useLocalhost ? [hardhat, baseSepolia] : [baseSepolia]

export const config = createConfig({
  chains,
  connectors: [
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Browser Wallet',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      },
    }),
    // WalletConnect for mobile wallets
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
})
