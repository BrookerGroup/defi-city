'use client'

import { useState } from 'react'
import { useDeposit, useWalletBalance } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownToLine, Loader2 } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

interface DepositFormProps {
  smartWalletAddress: `0x${string}` | null
  onSuccess?: () => void
}

export function DepositForm({ smartWalletAddress, onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('')
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { formatted: eoaBalance } = useWalletBalance(eoaAddress)
  const { deposit, isPending, isConfirming } = useDeposit(smartWalletAddress)

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) return
    deposit(amount)
    setAmount('')
    onSuccess?.()
  }

  const handleMax = () => {
    // Leave some gas
    const max = Math.max(0, parseFloat(eoaBalance) - 0.01)
    setAmount(max.toString())
  }

  const isLoading = isPending || isConfirming

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5" />
          Deposit ETH
        </CardTitle>
        <CardDescription>Send ETH to your Smart Wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <button
              onClick={handleMax}
              className="text-primary hover:underline text-xs"
            >
              Max: {parseFloat(eoaBalance).toFixed(4)} ETH
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0"
              disabled={isLoading}
            />
            <span className="flex items-center px-3 bg-muted rounded-md text-sm">
              ETH
            </span>
          </div>
        </div>

        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || !smartWalletAddress}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? 'Confirm in Wallet...' : 'Depositing...'}
            </>
          ) : (
            'Deposit'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
