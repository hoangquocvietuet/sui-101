"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Banknote, Info, AlertTriangle, Shield } from "lucide-react"
import { ConnectWalletButton } from "@/components/ConnectWalletButton"
import { TxDialog } from "@/components/TxDialog"
import { useAppStore } from "@/lib/store"
import { getMarkets, getUser, supply, borrow } from "@/lib/mockApi"
import { formatUsd, formatPct, computeUtilization } from "@/lib/math"
import type { AssetSymbol, ActionType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useCurrentAccount } from "@mysten/dapp-kit"

export default function ActionsPage() {
  const router = useRouter()
  const { markets, setMarkets, userPortfolio, setUserPortfolio } = useAppStore()
  const currentAccount = useCurrentAccount()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<ActionType>("supply")
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol | null>(null)
  const [amount, setAmount] = useState("")
  const [useAsCollateral, setUseAsCollateral] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [txHash, setTxHash] = useState("")

  const selectedMarket = markets.find((m) => m.symbol === selectedAsset)
  const userPosition = userPortfolio?.positions.find((p) => p.symbol === selectedAsset)

  useEffect(() => {
    async function loadData() {
      if (markets.length === 0) {
        const marketData = await getMarkets()
        setMarkets(marketData)
        // Auto-select first asset
        if (marketData.length > 0) {
          setSelectedAsset(marketData[0].symbol)
        }
      }

      if (currentAccount) {
        const portfolio = await getUser(currentAccount.address)
        setUserPortfolio(portfolio)
      }
    }

    loadData()
  }, [markets.length, setMarkets, currentAccount, setUserPortfolio])

  useEffect(() => {
    if (selectedMarket && activeTab === "supply") {
      setUseAsCollateral(selectedMarket.risk.collateralFactor > 0)
    }
  }, [selectedMarket, activeTab])

  const handleMaxClick = () => {
    const mockBalance = 1000

    if (activeTab === "supply") {
      setAmount(mockBalance.toString())
    } else if (activeTab === "borrow") {
      // Calculate max borrow based on collateral
      const maxBorrow = userPortfolio ? userPortfolio.totalSuppliedUsd * 0.8 - userPortfolio.totalBorrowedUsd : 0
      if (selectedMarket) {
        setAmount(Math.max(0, maxBorrow / selectedMarket.priceUsd).toString())
      }
    }
  }

  const handleSubmit = async () => {
    if (!currentAccount || !amount || !selectedAsset || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)
    try {
      const amountNum = Number.parseFloat(amount)
      let result

      if (activeTab === "supply") {
        result = await supply(currentAccount.address, selectedAsset, amountNum)
      } else {
        result = await borrow(currentAccount.address, selectedAsset, amountNum)
      }

      if (result.status === "success") {
        setTxHash(result.hash)
        setTxDialogOpen(true)

        // Refresh user portfolio
        const updatedPortfolio = await getUser(currentAccount.address)
        setUserPortfolio(updatedPortfolio)

        // Reset form
        setAmount("")

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
    if (!userPortfolio || !amount || !selectedMarket) return '0'

    const amountNum = Number.parseFloat(amount)
    const usdValue = amountNum * selectedMarket.priceUsd

    let newHF = userPortfolio.healthFactor

    if (activeTab === "supply" && useAsCollateral) {
      newHF += usdValue * 0.001 // Slight improvement
    } else if (activeTab === "borrow") {
      newHF -= usdValue * 0.002 // Decrease based on borrow
    }

    return Math.max(0, newHF)
  }

  const projectedHF = calculateHealthFactorChange()
  const amountNum = Number.parseFloat(amount) || 0
  const usdValue = selectedMarket ? amountNum * selectedMarket.priceUsd : 0

  const canSubmit = currentAccount && amount && amountNum > 0 && selectedAsset && !isLoading

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Banknote className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Supply & Borrow</h1>
              </div>
            </div>
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Action Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Action</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as ActionType)
                  setAmount("")
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supply">Supply Assets</TabsTrigger>
                  <TabsTrigger value="borrow">Borrow Assets</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-6">
                  {/* Asset Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="asset-select">Select Asset</Label>
                    <Select
                      value={selectedAsset || ""}
                      onValueChange={(value) => setSelectedAsset(value as AssetSymbol)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {markets.map((market) => (
                          <SelectItem key={market.symbol} value={market.symbol}>
                            <div className="flex items-center gap-3">
                              <Image
                                src={market.icon || "/placeholder.svg"}
                                alt={market.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                              <div>
                                <div className="font-medium">{market.symbol}</div>
                                <div className="text-sm text-muted-foreground">{formatUsd(market.priceUsd)}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMarket && (
                    <>
                      {/* Market Info */}
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={selectedMarket.icon || "/placeholder.svg"}
                                alt={selectedMarket.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                              <div>
                                <div className="font-semibold">{selectedMarket.symbol}</div>
                                <div className="text-sm text-muted-foreground">{selectedMarket.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatUsd(selectedMarket.priceUsd)}</div>
                              <div className="text-sm text-muted-foreground">Current Price</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Supply APY</div>
                              <div className="font-medium text-green-600">
                                {formatPct(selectedMarket.rates.supplyApy)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Borrow APY</div>
                              <div className="font-medium text-orange-600">
                                {formatPct(selectedMarket.rates.borrowApy)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Utilization</div>
                              <div className="font-medium">
                                {formatPct(
                                  computeUtilization(
                                    selectedMarket.totals.totalBorrow,
                                    selectedMarket.totals.totalSupply,
                                  ),
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Liquidity</div>
                              <div className="font-medium">
                                {formatUsd(selectedMarket.totals.liquidity * selectedMarket.priceUsd)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <TabsContent value="supply" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="supply-amount">Amount to Supply</Label>
                            <div className="flex gap-2">
                              <Input
                                id="supply-amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                              />
                              <Button variant="outline" onClick={handleMaxClick}>
                                Max
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Balance: 1,000 {selectedMarket.symbol} • {formatUsd(usdValue)}
                            </div>
                          </div>

                          {selectedMarket.risk.collateralFactor > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <Label htmlFor="collateral-toggle" className="text-blue-700 dark:text-blue-300">
                                  Use as collateral
                                </Label>
                              </div>
                              <Switch
                                id="collateral-toggle"
                                checked={useAsCollateral}
                                onCheckedChange={setUseAsCollateral}
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <h4 className="font-medium">Supply Benefits</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>
                                • Earn {formatPct(selectedMarket.rates.supplyApy)} APY on your {selectedMarket.symbol}
                              </li>
                              {selectedMarket.risk.collateralFactor > 0 && (
                                <li>• Can be used as collateral to borrow other assets</li>
                              )}
                              <li>• Withdraw anytime (subject to utilization)</li>
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="borrow" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="borrow-amount">Amount to Borrow</Label>
                            <div className="flex gap-2">
                              <Input
                                id="borrow-amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                              />
                              <Button variant="outline" onClick={handleMaxClick}>
                                Max
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Available: {formatUsd((userPortfolio?.totalSuppliedUsd || 0) * 0.8)} •{" "}
                              {formatUsd(usdValue)}
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

                          <div className="space-y-2">
                            <h4 className="font-medium">Borrow Details</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>
                                • Pay {formatPct(selectedMarket.rates.borrowApy)} APY on borrowed{" "}
                                {selectedMarket.symbol}
                              </li>
                              <li>• Requires collateral to maintain health factor above 1.0</li>
                              <li>• Risk of liquidation if health factor drops too low</li>
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

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
                                <span>Action:</span>
                                <span className="capitalize font-medium">
                                  {activeTab} {selectedMarket.symbol}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Amount:</span>
                                <span>
                                  {amountNum} {selectedMarket.symbol}
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
                                      variant={
                                        projectedHF > 1.25
                                          ? "default"
                                          : projectedHF > 1.05
                                            ? "secondary"
                                            : "destructive"
                                      }
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
                      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
                        {isLoading ? "Processing..." : `Confirm ${activeTab}`}
                      </Button>

                      {!currentAccount && (
                        <div className="text-center text-sm text-muted-foreground">Connect your wallet to continue</div>
                      )}
                    </>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {currentAccount && userPortfolio && userPortfolio.positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {userPortfolio.positions
                    .filter((pos) => pos.supplied > 0 || pos.borrowed > 0)
                    .map((position) => {
                      const market = markets.find((m) => m.symbol === position.symbol)
                      if (!market) return null

                      return (
                        <div key={position.symbol} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={market.icon || "/placeholder.svg"}
                              alt={market.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                            <div>
                              <div className="font-medium">{market.symbol}</div>
                              <div className="text-sm text-muted-foreground">{market.name}</div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            {position.supplied > 0 && (
                              <div className="flex justify-between">
                                <span>Supplied:</span>
                                <span className="text-green-600">{formatUsd(position.supplied * market.priceUsd)}</span>
                              </div>
                            )}
                            {position.borrowed > 0 && (
                              <div className="flex justify-between">
                                <span>Borrowed:</span>
                                <span className="text-orange-600">
                                  {formatUsd(position.borrowed * market.priceUsd)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(position.symbol)
                                setActiveTab("supply")
                                setAmount("")
                              }}
                              className="flex-1"
                            >
                              Supply More
                            </Button>
                            {position.supplied > 0 && (userPortfolio?.totalSuppliedUsd || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAsset(position.symbol)
                                  setActiveTab("borrow")
                                  setAmount("")
                                }}
                                className="flex-1"
                              >
                                Borrow More
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <TxDialog
        isOpen={txDialogOpen}
        onClose={() => setTxDialogOpen(false)}
        txHash={txHash}
        action={activeTab}
        asset={selectedAsset!}
        amount={amountNum}
      />
    </div>
  )
}
