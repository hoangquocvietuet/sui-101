"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, AlertTriangle, TrendingUp } from "lucide-react"
import { Stat } from "@/components/Stat"
import { PositionCard } from "@/components/PositionCard"
import { SupplyBorrowPanel } from "@/components/SupplyBorrowPanel"
import { RateCalculator } from "@/components/RateCalculator"
import { useAppStore } from "@/lib/store"
import { getMarkets, getUser } from "@/lib/mockApi"
import { formatUsd, formatPct, computeUtilization, toTokenAmt } from "@/lib/math"
import type { AssetSymbol, ActionType } from "@/lib/types"
import Image from "next/image"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock utilization history data
const mockUtilizationHistory = [
  { day: "Day 1", utilization: 65 },
  { day: "Day 2", utilization: 68 },
  { day: "Day 3", utilization: 72 },
  { day: "Day 4", utilization: 69 },
  { day: "Day 5", utilization: 74 },
  { day: "Day 6", utilization: 71 },
  { day: "Day 7", utilization: 73 },
]

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { markets, setMarkets, isConnected, walletAddress, userPortfolio, setUserPortfolio } = useAppStore()

  const [supplyBorrowPanelOpen, setSupplyBorrowPanelOpen] = useState(false)
  const [actionType, setActionType] = useState<ActionType>("supply")
  const [calculatorSupplyAmount, setCalculatorSupplyAmount] = useState<number | undefined>()
  const [calculatorBorrowAmount, setCalculatorBorrowAmount] = useState<number | undefined>()

  const symbol = (params.symbol as string)?.toUpperCase() as AssetSymbol
  const market = markets.find((m) => m.symbol === symbol)
  const userPosition = userPortfolio?.positions.find((p) => p.symbol === symbol)

  useEffect(() => {
    async function loadData() {
      if (markets.length === 0) {
        const marketData = await getMarkets()
        setMarkets(marketData)
      }

      if (isConnected && walletAddress && !userPortfolio) {
        const portfolio = await getUser(walletAddress)
        setUserPortfolio(portfolio)
      }
    }

    loadData()
  }, [markets.length, setMarkets, isConnected, walletAddress, userPortfolio, setUserPortfolio])

  if (!market) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
          <Button onClick={() => router.push("/")}>Back to Markets</Button>
        </div>
      </div>
    )
  }

  const utilization = computeUtilization(market.totals.totalBorrow, market.totals.totalSupply)
  const supplyCapUsed = (market.totals.totalSupply / market.caps.supplyCap) * 100
  const borrowCapUsed = (market.totals.totalBorrow / market.caps.borrowCap) * 100

  const handleAction = (action: ActionType) => {
    setActionType(action)
    setSupplyBorrowPanelOpen(true)
  }

  const handleApplyCalculator = (supplyAmount?: number, borrowAmount?: number) => {
    setCalculatorSupplyAmount(supplyAmount)
    setCalculatorBorrowAmount(borrowAmount)

    if (supplyAmount && supplyAmount > 0) {
      setActionType("supply")
    } else if (borrowAmount && borrowAmount > 0) {
      setActionType("borrow")
    } else {
      setActionType("supply")
    }

    setSupplyBorrowPanelOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Image
                src={market.icon || "/placeholder.svg"}
                alt={market.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold">{market.symbol}</h1>
                <p className="text-muted-foreground">{market.name}</p>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold">{formatUsd(market.priceUsd)}</div>
                <div className="text-sm text-muted-foreground">Current Price</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Stat
              title="Supply APY"
              value={formatPct(market.rates.supplyApy)}
              tooltip="Annual percentage yield for supplying this asset"
            />
            <Stat
              title="Borrow APY"
              value={formatPct(market.rates.borrowApy)}
              tooltip="Annual percentage rate for borrowing this asset"
            />
            <Stat
              title="Utilization"
              value={formatPct(utilization)}
              tooltip="Percentage of supplied assets currently being borrowed"
            />
            <Stat
              title="Liquidity"
              value={formatUsd(market.totals.liquidity * market.priceUsd)}
              tooltip="Available liquidity for borrowing"
            />
            <Stat
              title="Supply Cap"
              value={formatPct(supplyCapUsed)}
              tooltip="Percentage of supply cap currently used"
            />
            <Stat
              title="Borrow Cap"
              value={formatPct(borrowCapUsed)}
              tooltip="Percentage of borrow cap currently used"
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Utilization History (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockUtilizationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} labelFormatter={(label) => label} />
                    <Line
                      type="monotone"
                      dataKey="utilization"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="calculator">Rate Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Market Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {market.symbol} is a {market.symbol === "SUI" ? "native" : "bridged"} asset on the Sui
                        blockchain. It can be used for lending and borrowing with competitive rates.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Market Stats</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Supply</div>
                          <div className="font-medium">
                            {toTokenAmt(market.totals.totalSupply)} {market.symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Borrow</div>
                          <div className="font-medium">
                            {toTokenAmt(market.totals.totalBorrow)} {market.symbol}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Loan-to-Value (LTV)</span>
                        <Badge variant="outline">{formatPct(market.risk.collateralFactor * 100)}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Liquidation Threshold</span>
                        <Badge variant="outline">{formatPct(market.risk.liquidationThreshold * 100)}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Liquidation Penalty</span>
                        <Badge variant="destructive">{formatPct(market.risk.liquidationPenalty * 100)}</Badge>
                      </div>
                    </div>

                    {utilization > 80 && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div className="text-sm text-orange-700 dark:text-orange-300">
                          High utilization may affect borrowing availability
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Position */}
              {isConnected && userPosition && (
                <PositionCard position={userPosition} market={market} onAction={handleAction} />
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Supply {market.symbol}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Supply APY</span>
                        <span className="font-medium text-green-600">{formatPct(market.rates.supplyApy)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Can be used as collateral</span>
                        <Badge variant={market.risk.collateralFactor > 0 ? "default" : "secondary"}>
                          {market.risk.collateralFactor > 0 ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => handleAction("supply")} className="w-full">
                      Supply {market.symbol}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Borrow {market.symbol}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Borrow APY</span>
                        <span className="font-medium text-orange-600">{formatPct(market.rates.borrowApy)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available Liquidity</span>
                        <span className="font-medium">{formatUsd(market.totals.liquidity * market.priceUsd)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAction("borrow")}
                      className="w-full"
                      disabled={!isConnected || (userPortfolio?.totalSuppliedUsd || 0) === 0}
                    >
                      Borrow {market.symbol}
                    </Button>
                    {!isConnected && (
                      <p className="text-xs text-muted-foreground text-center">Connect wallet to borrow</p>
                    )}
                    {isConnected && (userPortfolio?.totalSuppliedUsd || 0) === 0 && (
                      <p className="text-xs text-muted-foreground text-center">Supply collateral first to borrow</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="calculator">
              <RateCalculator symbol={symbol} currentPrice={market.priceUsd} onApplyToPanel={handleApplyCalculator} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SupplyBorrowPanel
        isOpen={supplyBorrowPanelOpen}
        onClose={() => {
          setSupplyBorrowPanelOpen(false)
          setCalculatorSupplyAmount(undefined)
          setCalculatorBorrowAmount(undefined)
        }}
        selectedAsset={symbol}
        initialAction={actionType}
        supplyAmount={calculatorSupplyAmount}
        borrowAmount={calculatorBorrowAmount}
      />
    </div>
  )
}
