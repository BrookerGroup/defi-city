'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, Circle, ExternalLink, AlertCircle } from 'lucide-react'
import { useEffect, useRef, useMemo } from 'react'

// Move StepIcon outside of component to avoid re-creating on each render
function StepIcon({ done, active }: { done: boolean; active: boolean }) {
  if (done) return <CheckCircle2 className="h-5 w-5 text-green-500" />
  if (active) return <Loader2 className="h-5 w-5 animate-spin text-primary" />
  return <Circle className="h-5 w-5 text-muted-foreground" />
}

export function CreateWalletScreen() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { walletAddress, hasWallet, isLoading, isCreating, createWallet, createError } = useSmartWallet(eoaAddress)

  // Auto-create wallet on first load
  const hasAttemptedCreate = useRef(false)

  useEffect(() => {
    // Auto-create wallet when:
    // 1. Not loading
    // 2. User has EOA address
    // 3. No wallet exists yet
    // 4. Not currently creating
    // 5. Haven't attempted to create yet
    if (!isLoading && eoaAddress && !hasWallet && !isCreating && !hasAttemptedCreate.current) {
      hasAttemptedCreate.current = true
      createWallet()
    }
  }, [isLoading, eoaAddress, hasWallet, isCreating, createWallet])

  // Derive progress and steps from state instead of using effects
  const { progress, steps } = useMemo(() => {
    if (hasWallet && walletAddress) {
      return {
        progress: 100,
        steps: { deploying: true, permissions: true, finalizing: true },
      }
    }

    if (isCreating) {
      return {
        progress: 50,
        steps: { deploying: true, permissions: true, finalizing: false },
      }
    }

    return {
      progress: 10,
      steps: { deploying: true, permissions: false, finalizing: false },
    }
  }, [isCreating, hasWallet, walletAddress])

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl">🏗️</div>
          <CardTitle className="text-2xl">
            {hasWallet ? 'Smart Wallet Ready!' : 'Creating Your Smart Wallet'}
          </CardTitle>
          <CardDescription>
            {hasWallet
              ? 'Your city awaits!'
              : 'Setting up your wallet to start building your city'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error state */}
          {createError && !isCreating && !hasWallet && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">
                  {createError.message || 'Failed to create wallet. Please try again.'}
                </p>
              </div>
              <Button
                onClick={() => {
                  hasAttemptedCreate.current = false
                  createWallet()
                }}
                className="w-full h-12"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Creating or success state */}
          {(isCreating || hasWallet || (!createError && !hasWallet && !isLoading)) && (
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
