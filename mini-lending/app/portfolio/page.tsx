"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Wallet,
  ArrowLeft,
  AlertTriangle,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  ArrowRightLeft,
} from "lucide-react"
import { Stat } from "@/components/Stat"
import { HealthFactorBar } from "@/components/HealthFactorBar"
import { SupplyBorrowPanel } from "@/components/SupplyBorrowPanel"
import { ConnectWalletButton } from "@/components/ConnectWalletButton"
import { useAppStore } from "@/lib/store"
import { getMarkets, getUser } from "@/lib/mockApi"
import { formatUsd, toTokenAmt, computeUtilization } from "@/lib/math"
import type { AssetSymbol, ActionType } from "@/lib/types"
import Image from "next/image"

export default function PortfolioPage() {
  const router = useRouter()
  const { markets, setMarkets, isConnected, walletAddress, userPortfolio, setUserPortfolio } = useAppStore()

  const [supplyBorrowPanelOpen, setSupplyBorrowPanelOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol | null>(null)
  const [actionType, setActionType] = useState<ActionType>("supply")

  useEffect(() => {
    async function loadData() {
      if (markets.length === 0) {
        const marketData = await getMarkets()
        setMarkets(marketData)
      }

      if (isConnected && walletAddress) {
        const portfolio = await getUser(walletAddress)
        setUserPortfolio(portfolio)
      }
    }

    loadData()
  }, [markets.length, setMarkets, isConnected, walletAddress, setUserPortfolio])

  const handleAction = (symbol: AssetSymbol, action: ActionType) => {
    setSelectedAsset(symbol)
    setActionType(action)
    setSupplyBorrowPanelOpen(true)
  }

  // Calculate risk warnings
  const getRiskWarnings = () => {
    if (!userPortfolio || !markets.length) return []

    const warnings = []

    // Health factor warnings
    if (userPortfolio.healthFactor < 1.25 && userPortfolio.healthFactor >= 1.05) {
      warnings.push({
        type: "warning" as const,
        title: "Low Health Factor",
        description: "Your health factor is approaching liquidation threshold",
      })
    } else if (userPortfolio.healthFactor < 1.05) {
      warnings.push({
        type: "danger" as const,
        title: "Liquidation Risk",
        description: "Your position may be liquidated soon",
      })
    }

    // High utilization warnings
    userPortfolio.positions.forEach((position) => {
      if (position.borrowed > 0) {
        const market = markets.find((m) => m.symbol === position.symbol)
        if (market) {
          const utilization = computeUtilization(market.totals.totalBorrow, market.totals.totalSupply)
          if (utilization > 80) {
            warnings.push({
              type: "warning" as const,
              title: `High ${position.symbol} Utilization`,
              description: `${position.symbol} market utilization is ${utilization.toFixed(1)}%`,
            })
          }
        }
      }
    })

    return warnings.slice(0, 2) // Show max 2 warnings
  }

  const riskWarnings = getRiskWarnings()

  if (!isConnected) {
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
                <h1 className="text-2xl font-bold">My Portfolio</h1>
              </div>
              <ConnectWalletButton />
            </div>
          </div>
        </header>

        {/* Empty State */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <Wallet className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect your wallet to view your lending positions, track your health factor, and manage your portfolio.
              </p>
            </div>
            <ConnectWalletButton />
          </div>
        </main>
      </div>
    )
  }

  if (!userPortfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold">My Portfolio</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push("/actions")} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Actions
              </Button>
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Portfolio KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stat
              title="Net Worth"
              value={formatUsd(userPortfolio.netWorthUsd)}
              tooltip="Total value of supplied assets minus borrowed assets"
            />
            <Stat
              title="Total Supplied"
              value={formatUsd(userPortfolio.totalSuppliedUsd)}
              tooltip="Total USD value of all supplied assets"
            />
            <Stat
              title="Total Borrowed"
              value={formatUsd(userPortfolio.totalBorrowedUsd)}
              tooltip="Total USD value of all borrowed assets"
            />
            <div>
              <HealthFactorBar healthFactor={userPortfolio.healthFactor} />
            </div>
          </div>

          {/* Risk Warnings */}
          {riskWarnings.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      warning.type === "danger" ? "bg-red-50 dark:bg-red-950/20" : "bg-orange-50 dark:bg-orange-950/20"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 ${warning.type === "danger" ? "text-red-600" : "text-orange-600"}`}
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          warning.type === "danger"
                            ? "text-red-700 dark:text-red-300"
                            : "text-orange-700 dark:text-orange-300"
                        }`}
                      >
                        {warning.title}
                      </div>
                      <div
                        className={`text-sm ${
                          warning.type === "danger"
                            ? "text-red-600 dark:text-red-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {warning.description}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {userPortfolio.positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">You don't have any positions yet</p>
                  <Button onClick={() => router.push("/")}>Explore Markets</Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {userPortfolio.positions.map((position) => {
                    const market = markets.find((m) => m.symbol === position.symbol)
                    if (!market) return null

                    const suppliedUsd = position.supplied * market.priceUsd
                    const borrowedUsd = position.borrowed * market.priceUsd
                    const hasPosition = position.supplied > 0 || position.borrowed > 0

                    if (!hasPosition) return null

                    return (
                      <AccordionItem key={position.symbol} value={position.symbol}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={market.icon || "/placeholder.svg"}
                                alt={market.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                              <div className="text-left">
                                <div className="font-medium">{market.symbol}</div>
                                <div className="text-sm text-muted-foreground">{market.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {position.supplied > 0 && (
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">Supplied</div>
                                  <div className="font-medium text-green-600">{formatUsd(suppliedUsd)}</div>
                                </div>
                              )}
                              {position.borrowed > 0 && (
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">Borrowed</div>
                                  <div className="font-medium text-orange-600">{formatUsd(borrowedUsd)}</div>
                                </div>
                              )}
                              {position.isCollateral && (
                                <Badge variant="default" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  Collateral
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-4 space-y-4">
                            {/* Position Details */}
                            <div className="grid md:grid-cols-2 gap-6">
                              {position.supplied > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-green-600">Supply Position</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Amount</span>
                                      <span>
                                        {toTokenAmt(position.supplied)} {market.symbol}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>USD Value</span>
                                      <span>{formatUsd(suppliedUsd)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>APY</span>
                                      <span className="text-green-600">{market.rates.supplyApy.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAction(position.symbol, "supply")}
                                      className="flex-1 gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Supply More
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAction(position.symbol, "withdraw")}
                                      className="flex-1 gap-1"
                                    >
                                      <Minus className="h-3 w-3" />
                                      Withdraw
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {position.borrowed > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-orange-600">Borrow Position</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Amount</span>
                                      <span>
                                        {toTokenAmt(position.borrowed)} {market.symbol}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>USD Value</span>
                                      <span>{formatUsd(borrowedUsd)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>APY</span>
                                      <span className="text-orange-600">{market.rates.borrowApy.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAction(position.symbol, "borrow")}
                                      className="flex-1 gap-1"
                                    >
                                      <ArrowDownRight className="h-3 w-3" />
                                      Borrow More
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAction(position.symbol, "repay")}
                                      className="flex-1 gap-1"
                                    >
                                      <ArrowUpRight className="h-3 w-3" />
                                      Repay
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Market Info */}
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>Current Price: {formatUsd(market.priceUsd)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/market/${market.symbol.toLowerCase()}`)}
                                className="gap-1"
                              >
                                View Market
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <SupplyBorrowPanel
        isOpen={supplyBorrowPanelOpen}
        onClose={() => setSupplyBorrowPanelOpen(false)}
        selectedAsset={selectedAsset}
        initialAction={actionType}
      />
    </div>
  )
}
