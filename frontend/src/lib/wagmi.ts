import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { RPC_URL } from './constants'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  ssr: true,
})
