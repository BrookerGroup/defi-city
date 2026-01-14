'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BUILDING_INFO, BuildingType } from '@/types'
import { useSmartWallet } from '@/hooks'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'

interface BuildingModalProps {
  open: boolean
  onClose: () => void
  buildingType: BuildingType | null
  onConfirm: (amount?: string) => void
}

export function BuildingModal({
  open,
  onClose,
  buildingType,
  onConfirm,
}: BuildingModalProps) {
  const [amount, setAmount] = useState('')
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { balance } = useSmartWallet(eoaAddress)

  if (!buildingType) return null

  const info = BUILDING_INFO[buildingType]
  const formattedBalance = balance ? formatEther(balance) : '0'

  const handleConfirm = () => {
    onConfirm(amount || undefined)
    setAmount('')
    onClose()
  }

  const handleCancel = () => {
    setAmount('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            Build {info.name}
          </DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Protocol</span>
            <Badge variant="secondary">{info.protocol}</Badge>
          </div>

          {info.apy && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected APY</span>
              <span className="font-mono text-green-500">{info.apy}</span>
            </div>
          )}

          {info.minDeposit && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Min Deposit</span>
              <span className="font-mono">{info.minDeposit}</span>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Deposit Amount (Optional)</span>
              <span className="text-muted-foreground">
                Available: {parseFloat(formattedBalance).toFixed(4)} ETH
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.001"
                min="0"
              />
              <span className="flex items-center px-3 bg-muted rounded-md text-sm">
                ETH
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Build {info.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
