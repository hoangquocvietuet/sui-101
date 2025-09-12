"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthFactorBarProps {
  healthFactor: number
  className?: string
}

export function HealthFactorBar({ healthFactor, className }: HealthFactorBarProps) {
  // Determine health status and color
  const getHealthStatus = (hf: number) => {
    if (hf >= 1.25) return { status: "healthy", color: "bg-green-500", variant: "default" as const }
    if (hf >= 1.05) return { status: "warning", color: "bg-yellow-500", variant: "secondary" as const }
    return { status: "danger", color: "bg-red-500", variant: "destructive" as const }
  }

  const { status, color, variant } = getHealthStatus(healthFactor)

  // Convert health factor to progress percentage (capped at 100%)
  // HF of 2.0 = 100%, HF of 1.0 = 50%, etc.
  const progressValue = Math.min(100, (healthFactor / 2) * 100)

  const getIcon = () => {
    switch (status) {
      case "healthy":
        return <Shield className="h-4 w-4 text-green-600" />
      case "warning":
        return <TrendingDown className="h-4 w-4 text-yellow-600" />
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "healthy":
        return "Healthy"
      case "warning":
        return "At Risk"
      case "danger":
        return "Liquidation Risk"
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">Health Factor</span>
        </div>
        <Badge variant={variant}>{healthFactor.toFixed(2)}</Badge>
      </div>

      <div className="space-y-2">
        <Progress value={progressValue} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1.0 (Liquidation)</span>
          <span className="font-medium">{getStatusText()}</span>
          <span>2.0+ (Safe)</span>
        </div>
      </div>

      {/* Threshold indicators */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>{"< 1.05"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span>1.05 - 1.25</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>{"> 1.25"}</span>
        </div>
      </div>

      {/* Warning messages */}
      {status === "danger" && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">
            Your position may be liquidated. Consider repaying debt or adding collateral.
          </span>
        </div>
      )}

      {status === "warning" && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <TrendingDown className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">
            Your health factor is low. Monitor your position closely.
          </span>
        </div>
      )}
    </div>
  )
}
