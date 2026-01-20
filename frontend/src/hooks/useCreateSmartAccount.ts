import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { FACTORY_ADDRESS, SimpleWalletFactoryABI } from '@/lib/contracts'
import { useState } from 'react'

export function useCreateSmartAccount() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const [isDeploying, setIsDeploying] = useState(false)

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const createSmartAccount = async (ownerAddress: string) => {
    setIsDeploying(true)
    try {
      // Default position for town hall (center of map)
      const GRID_SIZE = 12
      const centerX = Math.floor(GRID_SIZE / 2)
      const centerY = Math.floor(GRID_SIZE / 2)

      console.log('[Create Smart Account] Starting deployment...', {
        owner: ownerAddress,
        x: centerX,
        y: centerY,
      })

      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: SimpleWalletFactoryABI,
        functionName: 'createTownHall',
        args: [ownerAddress as `0x${string}`, BigInt(centerX), BigInt(centerY)],
      })

      console.log('[Create Smart Account] Transaction sent:', hash)

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
    isPending: isPending || isConfirming || isDeploying,
    hash,
  }
}
