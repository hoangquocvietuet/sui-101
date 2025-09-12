"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ConnectWalletButton } from "@/components/ConnectWalletButton"
import { MarketsTable } from "@/components/MarketsTable"
import { SupplyBorrowPanel } from "@/components/SupplyBorrowPanel"
import { Stat } from "@/components/Stat"
import { useAppStore } from "@/lib/store"
import { getMarkets, getUser } from "@/lib/mockApi"
import { formatUsd, formatPct, computeUtilization } from "@/lib/math"
import type { AssetSymbol, ActionType } from "@/lib/types"
import { Banknote, User, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MarketsPage() {
  const router = useRouter()
  const { markets, setMarkets, setLoading, isConnected, walletAddress, setUserPortfolio } = useAppStore()
  const [supplyBorrowPanelOpen, setSupplyBorrowPanelOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol | null>(null)
  const [actionType, setActionType] = useState<ActionType>("supply")

  useEffect(() => {
    async function loadMarkets() {
      setLoading(true)
      try {
        const marketData = await getMarkets()
        setMarkets(marketData)
      } catch (error) {
        console.error("Failed to load markets:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMarkets()
  }, [setMarkets, setLoading])

  useEffect(() => {
    async function loadUserPortfolio() {
      if (isConnected && walletAddress) {
        try {
          const portfolio = await getUser(walletAddress)
          setUserPortfolio(portfolio)
        } catch (error) {
          console.error("Failed to load user portfolio:", error)
        }
      } else {
        setUserPortfolio(null)
      }
    }

    loadUserPortfolio()
  }, [isConnected, walletAddress, setUserPortfolio])

  const handleSupply = (symbol: AssetSymbol) => {
    setSelectedAsset(symbol)
    setActionType("supply")
    setSupplyBorrowPanelOpen(true)
  }

  const handleBorrow = (symbol: AssetSymbol) => {
    setSelectedAsset(symbol)
    setActionType("borrow")
    setSupplyBorrowPanelOpen(true)
  }

  // Calculate aggregate stats
  const totalSuppliedUsd = markets.reduce((sum, market) => sum + market.totals.totalSupply * market.priceUsd, 0)
  const totalBorrowedUsd = markets.reduce((sum, market) => sum + market.totals.totalBorrow * market.priceUsd, 0)
  const avgUtilization =
    markets.length > 0
      ? markets.reduce(
          (sum, market) => sum + computeUtilization(market.totals.totalBorrow, market.totals.totalSupply),
          0,
        ) / markets.length
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Sui Mini Lending</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push("/actions")} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Actions
              </Button>
              {isConnected && (
                <Button variant="outline" onClick={() => router.push("/portfolio")} className="gap-2">
                  <User className="h-4 w-4" />
                  Portfolio
                </Button>
              )}
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Stat
              title="Total Supplied"
              value={formatUsd(totalSuppliedUsd)}
              tooltip="Total value of all assets supplied across all markets"
            />
            <Stat
              title="Total Borrowed"
              value={formatUsd(totalBorrowedUsd)}
              tooltip="Total value of all assets borrowed across all markets"
            />
            <Stat
              title="Avg Utilization"
              value={formatPct(avgUtilization)}
              tooltip="Average utilization rate across all markets"
            />
          </div>

          {/* Markets Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Markets</h2>
              <div className="flex items-center gap-4">
                <Button onClick={() => router.push("/actions")} className="gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Quick Actions
                </Button>
                <div className="text-sm text-muted-foreground">{markets.length} assets available</div>
              </div>
            </div>
            <MarketsTable markets={markets} onSupply={handleSupply} onBorrow={handleBorrow} />
          </div>
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
