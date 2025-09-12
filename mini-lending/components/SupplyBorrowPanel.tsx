"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, AlertTriangle, Info, Calculator } from "lucide-react"
import { formatUsd } from "@/lib/math"
import { useAppStore } from "@/lib/store"
import { supply, borrow, withdraw, repay, getUser } from "@/lib/mockApi"
import type { AssetSymbol, ActionType } from "@/lib/types"
import { TxDialog } from "./TxDialog"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface SupplyBorrowPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedAsset: AssetSymbol | null
  initialAction: ActionType
  calculatorSupplyAmount?: number
  calculatorBorrowAmount?: number
}

export function SupplyBorrowPanel({
  isOpen,
  onClose,
  selectedAsset,
  initialAction,
  calculatorSupplyAmount,
  calculatorBorrowAmount,
}: SupplyBorrowPanelProps) {
  const { markets, isConnected, walletAddress, userPortfolio, setUserPortfolio } = useAppStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<ActionType>(initialAction)
  const [amount, setAmount] = useState("")
  const [useAsCollateral, setUseAsCollateral] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [isCalculatorAmount, setIsCalculatorAmount] = useState(false)

  const market = markets.find((m) => m.symbol === selectedAsset)
  const userPosition = userPortfolio?.positions.find((p) => p.symbol === selectedAsset)

  useEffect(() => {
    setActiveTab(initialAction)
  }, [initialAction])

  useEffect(() => {
    if (market && activeTab === "supply") {
      setUseAsCollateral(market.risk.collateralFactor > 0)
    }
  }, [market, activeTab])

  useEffect(() => {
    if (isOpen && (calculatorSupplyAmount || calculatorBorrowAmount)) {
      if (calculatorSupplyAmount && calculatorSupplyAmount > 0 && activeTab === "supply") {
        setAmount(calculatorSupplyAmount.toString())
        setIsCalculatorAmount(true)
      } else if (calculatorBorrowAmount && calculatorBorrowAmount > 0 && activeTab === "borrow") {
        setAmount(calculatorBorrowAmount.toString())
        setIsCalculatorAmount(true)
      }
    }
  }, [isOpen, calculatorSupplyAmount, calculatorBorrowAmount, activeTab])

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setIsCalculatorAmount(false)
  }

  if (!isOpen || !selectedAsset || !market) return null

  const handleMaxClick = () => {
    // Mock balance - in real app would get from wallet
    const mockBalance = 1000

    if (activeTab === "supply") {
      setAmount(mockBalance.toString())
    } else if (activeTab === "withdraw") {
      setAmount((userPosition?.supplied || 0).toString())
    } else if (activeTab === "repay") {
      setAmount((userPosition?.borrowed || 0).toString())
    } else if (activeTab === "borrow") {
      // Calculate max borrow based on collateral
      const maxBorrow = userPortfolio ? userPortfolio.totalSuppliedUsd * 0.8 - userPortfolio.totalBorrowedUsd : 0
      setAmount(Math.max(0, maxBorrow / market.priceUsd).toString())
    }
    setIsCalculatorAmount(false)
  }

  const handleSubmit = async () => {
    if (!walletAddress || !amount || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)
    try {
      let result
      const amountNum = Number.parseFloat(amount)

      switch (activeTab) {
        case "supply":
          result = await supply(walletAddress, selectedAsset, amountNum)
          break
        case "borrow":
          result = await borrow(walletAddress, selectedAsset, amountNum)
          break
        case "withdraw":
          result = await withdraw(walletAddress, selectedAsset, amountNum)
          break
        case "repay":
          result = await repay(walletAddress, selectedAsset, amountNum)
          break
      }

      if (result.status === "success") {
        setTxHash(result.hash)
        setTxDialogOpen(true)

        // Refresh user portfolio
        const updatedPortfolio = await getUser(walletAddress)
        setUserPortfolio(updatedPortfolio)

        // Reset form
        setAmount("")
        setIsCalculatorAmount(false)

        toast({
          title: "Transaction Successful",
          description: `${activeTab} completed successfully`,
        })
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateHealthFactorChange = () => {
    if (!userPortfolio || !amount) return userPortfolio?.healthFactor || 1.0

    // Mock calculation - in real app would be more sophisticated
    const amountNum = Number.parseFloat(amount)
    const usdValue = amountNum * market.priceUsd

    let newHF = userPortfolio.healthFactor

    if (activeTab === "supply" && useAsCollateral) {
      newHF += usdValue * 0.001 // Slight improvement
    } else if (activeTab === "borrow") {
      newHF -= usdValue * 0.002 // Decrease based on borrow
    } else if (activeTab === "withdraw") {
      newHF -= usdValue * 0.001 // Slight decrease
    } else if (activeTab === "repay") {
      newHF += usdValue * 0.002 // Improvement from repaying
    }

    return Math.max(0, newHF)
  }

  const projectedHF = calculateHealthFactorChange()
  const amountNum = Number.parseFloat(amount) || 0
  const usdValue = amountNum * market.priceUsd

  const canSubmit = isConnected && amount && amountNum > 0 && !isLoading

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-3">
              <Image
                src={market.icon || "/placeholder.svg"}
                alt={market.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <div className="text-lg font-semibold">{market.symbol}</div>
                <div className="text-sm text-muted-foreground">{formatUsd(market.priceUsd)}</div>
              </div>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as ActionType)
                setAmount("")
                setIsCalculatorAmount(false)
              }}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="supply">Supply</TabsTrigger>
                <TabsTrigger value="borrow">Borrow</TabsTrigger>
                <TabsTrigger value="withdraw" disabled={!userPosition?.supplied}>
                  Withdraw
                </TabsTrigger>
                <TabsTrigger value="repay" disabled={!userPosition?.borrowed}>
                  Repay
                </TabsTrigger>
              </TabsList>

              <TabsContent value="supply" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supply-amount">Amount to Supply</Label>
                  {isCalculatorAmount && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <Calculator className="h-3 w-3" />
                      <span>Amount from Rate Calculator</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="supply-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleMaxClick}>
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Balance: 1,000 {market.symbol} • {formatUsd(usdValue)}
                  </div>
                </div>

                {market.risk.collateralFactor > 0 && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collateral-toggle">Use as collateral</Label>
                    <Switch id="collateral-toggle" checked={useAsCollateral} onCheckedChange={setUseAsCollateral} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="borrow" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="borrow-amount">Amount to Borrow</Label>
                  {isCalculatorAmount && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <Calculator className="h-3 w-3" />
                      <span>Amount from Rate Calculator</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="borrow-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleMaxClick}>
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available: {formatUsd((userPortfolio?.totalSuppliedUsd || 0) * 0.8)} • {formatUsd(usdValue)}
                  </div>
                </div>

                {(!userPortfolio || userPortfolio.totalSuppliedUsd === 0) && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      You need to supply collateral before borrowing
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                  <div className="flex gap-2">
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleMaxClick}>
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Supplied: {userPosition?.supplied || 0} {market.symbol} • {formatUsd(usdValue)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="repay" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repay-amount">Amount to Repay</Label>
                  <div className="flex gap-2">
                    <Input
                      id="repay-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleMaxClick}>
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Borrowed: {userPosition?.borrowed || 0} {market.symbol} • {formatUsd(usdValue)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Transaction Summary */}
            {amount && amountNum > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Transaction Summary</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>
                        {amountNum} {market.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>USD Value:</span>
                      <span>{formatUsd(usdValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Gas:</span>
                      <span className="text-muted-foreground">~$0.05</span>
                    </div>

                    {userPortfolio && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span>Current Health Factor:</span>
                          <Badge
                            variant={
                              userPortfolio.healthFactor > 1.25
                                ? "default"
                                : userPortfolio.healthFactor > 1.05
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {userPortfolio.healthFactor.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Projected Health Factor:</span>
                          <Badge
                            variant={projectedHF > 1.25 ? "default" : projectedHF > 1.05 ? "secondary" : "destructive"}
                          >
                            {projectedHF.toFixed(2)}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" data-testid={`${activeTab}-submit`}>
              {isLoading ? "Processing..." : `Confirm ${activeTab}`}
            </Button>

            {!isConnected && (
              <div className="text-center text-sm text-muted-foreground">Connect your wallet to continue</div>
            )}
          </CardContent>
        </Card>
      </div>

      <TxDialog
        isOpen={txDialogOpen}
        onClose={() => setTxDialogOpen(false)}
        txHash={txHash}
        action={activeTab}
        asset={selectedAsset}
        amount={amountNum}
      />
    </>
  )
}
