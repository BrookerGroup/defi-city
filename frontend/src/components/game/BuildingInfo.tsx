'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, BUILDING_INFO } from '@/types'
import { Trash2, Coins, TrendingUp } from 'lucide-react'

interface BuildingInfoProps {
  building: Building | null
  open: boolean
  onClose: () => void
  onRemove: (id: string) => void
}

export function BuildingInfo({ building, open, onClose, onRemove }: BuildingInfoProps) {
  if (!building) return null

  const info = BUILDING_INFO[building.type]
  const isTownHall = building.type === 'town-hall'

  const handleRemove = () => {
    if (isTownHall) return
    onRemove(building.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            {info.name}
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
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-mono text-green-500">{info.apy}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Position</span>
            <span className="font-mono">
              ({building.position.x}, {building.position.y})
            </span>
          </div>

          {building.deposited && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deposited</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4" />
                <span className="font-mono">{building.deposited} ETH</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Built on</span>
            <span className="text-sm">
              {new Date(building.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isTownHall && (
            <Button variant="destructive" onClick={handleRemove}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
