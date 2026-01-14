'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

export function CreateWalletScreen() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { walletAddress, hasWallet, isLoading, isCreating, createWallet } = useSmartWallet(eoaAddress)

  const [progress, setProgress] = useState(0)
  const [steps, setSteps] = useState({
    deploying: false,
    permissions: false,
    finalizing: false,
  })

  useEffect(() => {
    if (isCreating) {
      setSteps((s) => ({ ...s, deploying: true }))
      setProgress(25)

      const timer1 = setTimeout(() => {
        setSteps((s) => ({ ...s, permissions: true }))
        setProgress(50)
      }, 2000)

      const timer2 = setTimeout(() => {
        setSteps((s) => ({ ...s, finalizing: true }))
        setProgress(75)
      }, 4000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [isCreating])

  useEffect(() => {
    if (hasWallet && walletAddress) {
      setProgress(100)
    }
  }, [hasWallet, walletAddress])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking wallet...</span>
        </div>
      </div>
    )
  }

  const StepIcon = ({ done, active }: { done: boolean; active: boolean }) => {
    if (done) return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (active) return <Loader2 className="h-5 w-5 animate-spin text-primary" />
    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl">🏗️</div>
          <CardTitle className="text-2xl">
            {hasWallet ? 'Smart Wallet Ready!' : 'Create Your Smart Wallet'}
          </CardTitle>
          <CardDescription>
            {hasWallet
              ? 'Your city awaits!'
              : 'Set up your wallet to start building your city'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasWallet && !isCreating && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                A Smart Wallet allows you to interact with DeFi protocols directly from the game.
              </p>
              <Button onClick={createWallet} className="w-full h-12">
                Create Smart Wallet
              </Button>
            </div>
          )}

          {(isCreating || hasWallet) && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StepIcon done={steps.deploying && !isCreating} active={steps.deploying && isCreating} />
                  <span className={steps.deploying ? 'text-foreground' : 'text-muted-foreground'}>
                    Deploying wallet contract
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StepIcon done={steps.permissions && !isCreating} active={steps.permissions && isCreating} />
                  <span className={steps.permissions ? 'text-foreground' : 'text-muted-foreground'}>
                    Setting up permissions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StepIcon done={hasWallet} active={steps.finalizing && isCreating} />
                  <span className={steps.finalizing || hasWallet ? 'text-foreground' : 'text-muted-foreground'}>
                    Finalizing
                  </span>
                </div>
              </div>

              {hasWallet && walletAddress && (
                <div className="pt-4 space-y-3">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Your Smart Wallet</p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono">
                        {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(`https://sepolia.etherscan.io/address/${walletAddress}`, '_blank')
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => window.location.reload()}>
                    Enter DeFi City
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
