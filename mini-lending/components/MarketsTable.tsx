"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, ArrowDownRight, Search, Shield, Coins } from "lucide-react"
import { formatUsd, formatPct, computeUtilization } from "@/lib/math"
import type { Market, AssetSymbol } from "@/lib/types"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface MarketsTableProps {
  markets: Market[]
  onSupply: (symbol: AssetSymbol) => void
  onBorrow: (symbol: AssetSymbol) => void
}

export function MarketsTable({ markets, onSupply, onBorrow }: MarketsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showCollateralOnly, setShowCollateralOnly] = useState(false)
  const [showStablesOnly, setShowStablesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"supplyApy" | "borrowApy" | "utilization" | null>(null)
  const [sortDesc, setSortDesc] = useState(true)

  const filteredMarkets = markets
    .filter((market) => {
      if (searchTerm && !market.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (showCollateralOnly && market.risk.collateralFactor === 0) {
        return false
      }
      if (showStablesOnly && !["USDC", "USDT"].includes(market.symbol)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (!sortBy) return 0

      let aVal: number, bVal: number

      if (sortBy === "utilization") {
        aVal = computeUtilization(a.totals.totalBorrow, a.totals.totalSupply)
        bVal = computeUtilization(b.totals.totalBorrow, b.totals.totalSupply)
      } else {
        aVal = a.rates[sortBy]
        bVal = b.rates[sortBy]
      }

      return sortDesc ? bVal - aVal : aVal - bVal
    })

  const handleSort = (field: "supplyApy" | "borrowApy" | "utilization") => {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
  }

  const handleRowClick = (symbol: string) => {
    router.push(`/market/${symbol.toLowerCase()}`)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showCollateralOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCollateralOnly(!showCollateralOnly)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Collateral Only
            </Button>
            <Button
              variant={showStablesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowStablesOnly(!showStablesOnly)}
              className="gap-2"
            >
              <Coins className="h-4 w-4" />
              Stablecoins
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("supplyApy")}>
                  Supply APY {sortBy === "supplyApy" && (sortDesc ? "↓" : "↑")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("borrowApy")}>
                  Borrow APY {sortBy === "borrowApy" && (sortDesc ? "↓" : "↑")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("utilization")}>
                  Utilization {sortBy === "utilization" && (sortDesc ? "↓" : "↑")}
                </TableHead>
                <TableHead>Liquidity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarkets.map((market) => {
                const utilization = computeUtilization(market.totals.totalBorrow, market.totals.totalSupply)
                const isHighUtilization = utilization > 80
                const isNearCap = market.totals.totalSupply / market.caps.supplyCap > 0.9

                return (
                  <TableRow
                    key={market.symbol}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(market.symbol)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={market.icon || "/placeholder.svg"}
                          alt={market.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <div className="font-medium">{market.symbol}</div>
                          <div className="text-sm text-muted-foreground">{market.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatUsd(market.priceUsd)}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{formatPct(market.rates.supplyApy)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-600 font-medium">{formatPct(market.rates.borrowApy)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium", isHighUtilization ? "text-red-600" : "text-foreground")}>
                          {formatPct(utilization)}
                        </span>
                        {isHighUtilization && (
                          <Badge variant="destructive" className="text-xs">
                            High
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatUsd(market.totals.liquidity * market.priceUsd)}</div>
                        {isNearCap && (
                          <Badge variant="secondary" className="text-xs">
                            Near Cap
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSupply(market.symbol)
                          }}
                          className="gap-1"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Supply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onBorrow(market.symbol)
                          }}
                          className="gap-1"
                        >
                          <ArrowDownRight className="h-3 w-3" />
                          Borrow
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {filteredMarkets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No markets found matching your filters.</div>
        )}
      </div>
    </Card>
  )
}
