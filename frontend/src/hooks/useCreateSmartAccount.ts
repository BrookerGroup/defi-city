import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CORE_ADDRESS, DefiCityCoreABI } from '@/lib/contracts'
import { useState } from 'react'

export function useCreateSmartAccount() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const [isDeploying, setIsDeploying] = useState(false)

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const createSmartAccount = async () => {
    setIsDeploying(true)
    try {
      console.log('[Create Smart Account] Starting deployment...', {
        contract: CORE_ADDRESS,
      })

      // Call DefiCityCore.createTownHall() - uses msg.sender as owner
      const hash = await writeContractAsync({
        address: CORE_ADDRESS,
        abi: DefiCityCoreABI,
        functionName: 'createTownHall',
        args: [],
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
