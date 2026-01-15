import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { RPC_URL } from './constants'

export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
  },
  ssr: true,
})
