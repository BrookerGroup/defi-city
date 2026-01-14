'use client'

import { useState } from 'react'
import { useWithdraw, useSmartWallet } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpFromLine, Loader2 } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'

interface WithdrawFormProps {
  smartWalletAddress: `0x${string}` | null
  onSuccess?: () => void
}

export function WithdrawForm({ smartWalletAddress, onSuccess }: WithdrawFormProps) {
  const [amount, setAmount] = useState('')
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { balance } = useSmartWallet(eoaAddress)
  const { withdraw, isPending, isConfirming } = useWithdraw(smartWalletAddress)

  const formattedBalance = balance ? formatEther(balance) : '0'

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0 || !eoaAddress) return
    withdraw(amount, eoaAddress)
    setAmount('')
    onSuccess?.()
  }

  const handleMax = () => {
    setAmount(formattedBalance)
  }

  const isLoading = isPending || isConfirming

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowUpFromLine className="h-5 w-5" />
          Withdraw ETH
        </CardTitle>
        <CardDescription>Withdraw ETH to your EOA wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <button
              onClick={handleMax}
              className="text-primary hover:underline text-xs"
            >
              Max: {parseFloat(formattedBalance).toFixed(4)} ETH
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
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || !smartWalletAddress}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? 'Confirm in Wallet...' : 'Withdrawing...'}
            </>
          ) : (
            'Withdraw'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
