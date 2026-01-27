import { useWriteContract } from 'wagmi'
import { CORE_ADDRESS, DefiCityCoreABI } from '@/lib/contracts'
import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia-rpc.publicnode.com'),
})

export function useCreateSmartAccount() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [isDeploying, setIsDeploying] = useState(false)

  const createSmartAccount = async () => {
    setIsDeploying(true)
    try {
      console.log('[Create Smart Account] Starting deployment...', {
        contract: CORE_ADDRESS,
      })

      // Call DefiCityCore.createTownHall(x, y) - uses msg.sender as owner
      // Town Hall is placed at grid origin (0, 0)
      const hash = await writeContractAsync({
        address: CORE_ADDRESS,
        abi: DefiCityCoreABI,
        functionName: 'createTownHall',
        args: [BigInt(0), BigInt(0)],
      })

      console.log('[Create Smart Account] Transaction sent:', hash)
      console.log('[Create Smart Account] Waiting for confirmation...')

      // Wait for the transaction to be confirmed on-chain
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      console.log('[Create Smart Account] Transaction confirmed:', receipt.status)

      if (receipt.status === 'reverted') {
        return {
          success: false,
          error: 'Transaction reverted',
        }
      }

      return {
        success: true,
        hash,
      }
    } catch (error: any) {
      console.error('[Create Smart Account] Error:', error)

      return {
        success: false,
        error: error.message || 'Failed to create smart account',
      }
    } finally {
      setIsDeploying(false)
    }
  }

  return {
    createSmartAccount,
    isPending: isPending || isDeploying,
  }
}
