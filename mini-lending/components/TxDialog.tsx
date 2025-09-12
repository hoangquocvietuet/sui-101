"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Copy } from "lucide-react"
import type { AssetSymbol, ActionType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface TxDialogProps {
  isOpen: boolean
  onClose: () => void
  txHash: string
  action: ActionType
  asset: AssetSymbol
  amount: number
}

export function TxDialog({ isOpen, onClose, txHash, action, asset, amount }: TxDialogProps) {
  const { toast } = useToast()

  if (!isOpen) return null

  const handleCopyHash = () => {
    navigator.clipboard.writeText(txHash)
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    })
  }

  const handleViewExplorer = () => {
    // In real app, would open Sui Explorer
    toast({
      title: "Explorer Link",
      description: "Would open Sui Explorer in real app",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Transaction Successful</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold">
              {action.charAt(0).toUpperCase() + action.slice(1)} {amount} {asset}
            </div>
            <Badge variant="outline" className="text-green-600">
              Confirmed
            </Badge>
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Action:</span>
              <span className="font-medium">{action.charAt(0).toUpperCase() + action.slice(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Asset:</span>
              <span className="font-medium">{asset}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction Hash:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs">
                  {txHash.slice(0, 6)}...{txHash.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopyHash} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewExplorer} className="flex-1 gap-2 bg-transparent">
              <ExternalLink className="h-4 w-4" />
              View on Sui Explorer
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
