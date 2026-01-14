'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet, useWalletBalance } from '@/hooks'
import { formatEther } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Loader2, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'

export function WalletInfo() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined

  const { walletAddress, balance, hasWallet, isLoading, isCreating, createWallet } = useSmartWallet(eoaAddress)
  const { formatted: eoaBalance } = useWalletBalance(eoaAddress)

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  const formatBalance = (value: bigint | undefined) => {
    if (!value) return '0.0000'
    const formatted = formatEther(value)
    return parseFloat(formatted).toFixed(4)
  }

  if (!eoaAddress) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Info
        </CardTitle>
        <CardDescription>Manage your wallets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* EOA Wallet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">EOA Wallet</span>
            <Badge variant="outline">Sepolia</Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
              {eoaAddress}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyAddress(eoaAddress)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${eoaAddress}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Balance: </span>
            <span className="font-mono">{parseFloat(eoaBalance).toFixed(4)} ETH</span>
          </div>
        </div>

        {/* Smart Wallet */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Smart Wallet</span>
            {hasWallet && <Badge className="bg-green-500/10 text-green-500">Active</Badge>}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading wallet info...
            </div>
          ) : hasWallet && walletAddress ? (
            <>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {walletAddress}
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyAddress(walletAddress)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${walletAddress}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Balance: </span>
                <span className="font-mono">{formatBalance(balance)} ETH</span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Create a Smart Wallet to start building your city!
              </p>
              <Button onClick={createWallet} disabled={isCreating} className="w-full">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  'Create Smart Wallet'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
