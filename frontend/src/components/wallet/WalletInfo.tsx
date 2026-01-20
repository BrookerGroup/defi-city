'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks/useContracts'
import { useWalletBalance } from '@/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Loader2, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'

export function WalletInfo() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined

  // Step 3: Get Smart Wallet Address from contract (Base Sepolia)
  const { smartWallet, loading: isLoading } = useSmartWallet(eoaAddress)
  const { formatted: eoaBalance } = useWalletBalance(eoaAddress)

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  if (!eoaAddress) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Info
        </CardTitle>
        <CardDescription>Manage your wallets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* EOA Wallet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">EOA Wallet</span>
            <Badge variant="outline">Base Sepolia</Badge>
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
            <span className="text-sm text-muted-foreground">Smart Wallet (AA)</span>
            {smartWallet && <Badge className="bg-green-500/10 text-green-500">Active</Badge>}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading wallet info...
            </div>
          ) : smartWallet ? (
            <>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {smartWallet}
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyAddress(smartWallet)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${smartWallet}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Deployed via Town Hall creation</span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Smart Wallet will be created automatically when you enter the game
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
