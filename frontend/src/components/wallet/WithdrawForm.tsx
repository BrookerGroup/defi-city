'use client'

import { useState, useEffect } from 'react'
import { useWithdrawToken, useWalletBalance, useTokenBalance } from '@/hooks'
import type { DepositTokenSymbol } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpFromLine, Loader2, ChevronDown, Check, AlertCircle, Building2 } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { TOKEN_ADDRESSES, ZERO_ADDRESS } from '@/lib/constants'
import { useGameStore } from '@/store/gameStore'
import { toast } from 'sonner'

// Token configuration with display info
const SUPPORTED_TOKENS: {
  symbol: DepositTokenSymbol
  name: string
  icon: string
}[] = [
  { symbol: 'ETH', name: 'Ethereum', icon: '◇' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  { symbol: 'USDT', name: 'Tether USD', icon: '💲' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿' },
  { symbol: 'WETH', name: 'Wrapped ETH', icon: '◆' },
]

interface WithdrawFormProps {
  smartWalletAddress: `0x${string}` | null
  onSuccess?: () => void
}

export function WithdrawForm({ smartWalletAddress, onSuccess }: WithdrawFormProps) {
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<DepositTokenSymbol>('ETH')
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)

  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined

  // Check if user has Town Hall (SmartWallet)
  const { buildings } = useGameStore()
  const hasTownHall = buildings.some(b => b.type === 'townhall')

  // Get native ETH balance from SmartWallet
  const { formatted: ethBalance } = useWalletBalance(smartWalletAddress ?? undefined)

  // Get ERC-20 token balances from SmartWallet
  const { formatted: usdcBalance } = useTokenBalance(smartWalletAddress ?? undefined, 'USDC')
  const { formatted: usdtBalance } = useTokenBalance(smartWalletAddress ?? undefined, 'USDT')
  const { formatted: wbtcBalance } = useTokenBalance(smartWalletAddress ?? undefined, 'WBTC')
  const { formatted: wethBalance } = useTokenBalance(smartWalletAddress ?? undefined, 'WETH')

  const {
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    step,
    reset,
    isNativeETH
  } = useWithdrawToken(smartWalletAddress, eoaAddress, selectedToken)

  // Get balance for selected token (from SmartWallet)
  const getBalance = (token: DepositTokenSymbol): string => {
    switch (token) {
      case 'ETH': return ethBalance
      case 'USDC': return usdcBalance
      case 'USDT': return usdtBalance
      case 'WBTC': return wbtcBalance
      case 'WETH': return wethBalance
      default: return '0'
    }
  }

  // Check if token is available (has contract address configured)
  const isTokenAvailable = (token: DepositTokenSymbol): boolean => {
    if (token === 'ETH') return true
    const address = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]
    return address !== ZERO_ADDRESS
  }

  // Format balance for display
  const formatBalance = (balance: string, token: DepositTokenSymbol): string => {
    const num = parseFloat(balance)
    if (token === 'WBTC') {
      return num.toFixed(8)
    }
    if (token === 'USDC' || token === 'USDT') {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return num.toFixed(4)
  }

  const currentBalance = getBalance(selectedToken)

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) return

    // Check if withdrawal amount exceeds available balance
    const withdrawalAmount = parseFloat(amount)
    const availableBalance = parseFloat(currentBalance)

    if (withdrawalAmount > availableBalance) {
      toast.error('Insufficient balance', {
        description: `Available: ${formatBalance(currentBalance, selectedToken)} ${selectedToken}`,
      })
      return
    }

    withdraw(amount)
  }

  const handleMax = () => {
    const balance = parseFloat(currentBalance)
    // For ETH, leave some for gas (0.001 ETH)
    if (selectedToken === 'ETH') {
      const max = Math.max(0, balance - 0.001)
      setAmount(max.toString())
    } else {
      setAmount(balance.toString())
    }
  }

  const handleTokenSelect = (token: DepositTokenSymbol) => {
    setSelectedToken(token)
    setIsTokenSelectorOpen(false)
    setAmount('')
    reset()
  }

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      onSuccess?.()
    }
  }, [isSuccess, onSuccess])

  const isLoading = isPending || isConfirming
  const selectedTokenConfig = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken)

  // Get button text based on state
  const getButtonText = () => {
    if (isLoading) {
      if (isPending) return 'Confirm in Wallet...'
      return 'Withdrawing...'
    }
    return `Withdraw ${selectedToken}`
  }

  // If no Town Hall, show message to place one first
  if (!hasTownHall) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>Withdraw assets to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Place Town Hall First</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You need to place a Town Hall to create your Smart Wallet before you can withdraw funds.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the &quot;Build&quot; button below and select an empty tile to place your Town Hall.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowUpFromLine className="h-5 w-5" />
          Withdraw Funds
        </CardTitle>
        <CardDescription>Withdraw assets to your wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selector */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Asset</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTokenSelectorOpen(!isTokenSelectorOpen)}
              className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background hover:bg-muted/50 transition-colors"
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedTokenConfig?.icon}</span>
                <span className="font-medium">{selectedToken}</span>
                <span className="text-muted-foreground text-sm">
                  ({selectedTokenConfig?.name})
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTokenSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isTokenSelectorOpen && (
              <div className="absolute z-10 w-full mt-1 border rounded-md bg-background shadow-lg">
                {SUPPORTED_TOKENS.map((token) => {
                  const available = isTokenAvailable(token.symbol)
                  const balance = getBalance(token.symbol)

                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => available && handleTokenSelect(token.symbol)}
                      disabled={!available}
                      className={`w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 first:rounded-t-md last:rounded-b-md ${
                        !available ? 'opacity-50 cursor-not-allowed' : ''
                      } ${selectedToken === token.symbol ? 'bg-muted/50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{token.icon}</span>
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-muted-foreground text-sm">
                          ({token.name})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {available ? (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {formatBalance(balance, token.symbol)}
                            </span>
                            {selectedToken === token.symbol && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not available</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <button
              onClick={handleMax}
              className="text-primary hover:underline text-xs"
              disabled={isLoading}
            >
              Available: {formatBalance(currentBalance, selectedToken)} {selectedToken}
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step={selectedToken === 'WBTC' ? '0.00000001' : '0.001'}
              min="0"
              disabled={isLoading}
              className="flex-1"
            />
            <span className="flex items-center px-3 bg-muted rounded-md text-sm font-medium min-w-[60px] justify-center">
              {selectedToken}
            </span>
          </div>
        </div>

        {/* Warning about invested funds */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-md text-sm border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-amber-700 dark:text-amber-400 text-xs">
            <span className="font-medium">Note:</span> You can only withdraw funds not invested in buildings.
            To withdraw invested funds, demolish the building first.
          </div>
        </div>

        {/* Gas notice */}
        <p className="text-xs text-muted-foreground">
          You will pay gas fees for this transaction.
        </p>

        <Button
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || !smartWalletAddress}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {getButtonText()}
            </>
          ) : (
            getButtonText()
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
