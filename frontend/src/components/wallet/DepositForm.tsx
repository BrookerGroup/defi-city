'use client'

import { useState, useEffect } from 'react'
import { useDepositToken, useWalletBalance, useTokenBalance } from '@/hooks'
import type { DepositTokenSymbol } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownToLine, Loader2, ChevronDown, Check, AlertCircle, Copy, ExternalLink, Building2 } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { TOKEN_ADDRESSES, ZERO_ADDRESS } from '@/lib/constants'
import { useGameStore } from '@/store/gameStore'
import { toast } from 'sonner'

// Token configuration with display info
const SUPPORTED_TOKENS: {
  symbol: DepositTokenSymbol
  name: string
  icon: string
  minDeposit?: number
}[] = [
  { symbol: 'ETH', name: 'Ethereum', icon: '◇' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  { symbol: 'USDT', name: 'Tether USD', icon: '💲' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿' },
  { symbol: 'WETH', name: 'Wrapped ETH', icon: '◆' },
]

interface DepositFormProps {
  smartWalletAddress: `0x${string}` | null
  onSuccess?: () => void
}

export function DepositForm({ smartWalletAddress, onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<DepositTokenSymbol>('ETH')
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)

  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined

  // Check if user has Town Hall (SmartWallet)
  const { buildings } = useGameStore()
  const hasTownHall = buildings.some(b => b.type === 'townhall')

  // Copy address to clipboard
  const copyAddress = () => {
    if (smartWalletAddress) {
      navigator.clipboard.writeText(smartWalletAddress)
      toast.success('Address copied!')
    }
  }

  // Get native ETH balance
  const { formatted: ethBalance } = useWalletBalance(eoaAddress)

  // Get ERC-20 token balances
  const { formatted: usdcBalance } = useTokenBalance(eoaAddress, 'USDC')
  const { formatted: usdtBalance } = useTokenBalance(eoaAddress, 'USDT')
  const { formatted: wbtcBalance } = useTokenBalance(eoaAddress, 'WBTC')
  const { formatted: wethBalance } = useTokenBalance(eoaAddress, 'WETH')

  const {
    deposit,
    isPending,
    isConfirming,
    isSuccess,
    step,
    needsApproval,
    reset,
    isNativeETH
  } = useDepositToken(smartWalletAddress, eoaAddress, selectedToken)

  // Get balance for selected token
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

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) return
    deposit(amount)
  }

  const handleMax = () => {
    const balance = parseFloat(currentBalance)
    // Leave some gas for ETH
    if (selectedToken === 'ETH') {
      const max = Math.max(0, balance - 0.01)
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
  const requiresApproval = needsApproval(amount)
  const selectedTokenConfig = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken)

  // Get button text based on state
  const getButtonText = () => {
    if (isLoading) {
      if (step === 'approving') return 'Approving...'
      if (isPending) return 'Confirm in Wallet...'
      return 'Depositing...'
    }
    if (requiresApproval && !isNativeETH) {
      return `Approve & Deposit ${selectedToken}`
    }
    return `Deposit ${selectedToken}`
  }

  // If no Town Hall, show message to place one first
  if (!hasTownHall) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Deposit Funds
          </CardTitle>
          <CardDescription>Transfer assets to your Smart Wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Place Town Hall First</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You need to place a Town Hall to create your Smart Wallet before you can deposit funds.
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
          <ArrowDownToLine className="h-5 w-5" />
          Deposit Funds
        </CardTitle>
        <CardDescription>Transfer assets to your Smart Wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SmartWallet Address Display */}
        {smartWalletAddress && (
          <div className="p-3 bg-muted/50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Deposit to Smart Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">
                {smartWalletAddress}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={copyAddress}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => window.open(`https://sepolia.basescan.org/address/${smartWalletAddress}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

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
              Max: {formatBalance(currentBalance, selectedToken)} {selectedToken}
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

        {/* Approval notice for ERC-20 tokens */}
        {requiresApproval && !isNativeETH && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Token approval required.</span>{' '}
              You&apos;ll first approve the token, then the deposit will proceed automatically.
            </div>
          </div>
        )}

        {/* Gas notice */}
        <p className="text-xs text-muted-foreground">
          You will pay gas fees for this transaction.
        </p>

        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || !smartWalletAddress}
          className="w-full"
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
