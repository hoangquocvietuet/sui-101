"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Minus, Plus } from "lucide-react"
import { formatUsd, toTokenAmt } from "@/lib/math"
import { toggleCollateral } from "@/lib/mockApi"
import { useAppStore } from "@/lib/store"
import type { UserPosition, Market } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface PositionCardProps {
  position: UserPosition
  market: Market
  onAction: (action: "supply" | "borrow" | "withdraw" | "repay") => void
}

export function PositionCard({ position, market, onAction }: PositionCardProps) {
  const { walletAddress } = useAppStore()
  const { toast } = useToast()
  const [isToggling, setIsToggling] = useState(false)

  const suppliedUsd = position.supplied * market.priceUsd
  const borrowedUsd = position.borrowed * market.priceUsd

  const handleCollateralToggle = async (enabled: boolean) => {
    if (!walletAddress) return

    setIsToggling(true)
    try {
      await toggleCollateral(walletAddress, position.symbol, enabled)
      toast({
        title: "Collateral Updated",
        description: `${market.symbol} collateral ${enabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      toast({
        title: "Failed to update collateral",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Position</span>
          <Badge variant={position.isCollateral ? "default" : "secondary"}>
            {position.isCollateral ? "Collateral" : "Not Collateral"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supplied Position */}
        {position.supplied > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Supplied</span>
              <div className="text-right">
                <div className="font-medium">
                  {toTokenAmt(position.supplied)} {market.symbol}
                </div>
                <div className="text-sm text-muted-foreground">{formatUsd(suppliedUsd)}</div>
              </div>
            </div>

            {market.risk.collateralFactor > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Use as collateral</span>
                <Switch
                  checked={position.isCollateral}
                  onCheckedChange={handleCollateralToggle}
                  disabled={isToggling}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onAction("supply")} className="flex-1 gap-1">
                <Plus className="h-3 w-3" />
                Supply More
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction("withdraw")} className="flex-1 gap-1">
                <Minus className="h-3 w-3" />
                Withdraw
              </Button>
            </div>
          </div>
        )}

        {/* Borrowed Position */}
        {position.borrowed > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Borrowed</span>
              <div className="text-right">
                <div className="font-medium text-orange-600">
                  {toTokenAmt(position.borrowed)} {market.symbol}
                </div>
                <div className="text-sm text-muted-foreground">{formatUsd(borrowedUsd)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onAction("borrow")} className="flex-1 gap-1">
                <ArrowDownRight className="h-3 w-3" />
                Borrow More
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction("repay")} className="flex-1 gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Repay
              </Button>
            </div>
          </div>
        )}

        {/* No Position */}
        {position.supplied === 0 && position.borrowed === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="mb-4">You don't have any position in this market</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onAction("supply")} className="flex-1 gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Supply
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction("borrow")} className="flex-1 gap-1">
                <ArrowDownRight className="h-3 w-3" />
                Borrow
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
