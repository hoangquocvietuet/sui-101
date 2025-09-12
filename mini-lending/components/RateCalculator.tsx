"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, TrendingDown, BarChart3, Zap } from "lucide-react"
import { formatPct, formatUsd } from "@/lib/math"
import { estimateRates } from "@/lib/mockApi"
import { useAppStore } from "@/lib/store"
import type { AssetSymbol, RatePreview } from "@/lib/types"

interface RateCalculatorProps {
  symbol: AssetSymbol
  currentPrice: number
  onApplyToPanel?: (supplyAmount?: number, borrowAmount?: number) => void
}

export function RateCalculator({ symbol, currentPrice, onApplyToPanel }: RateCalculatorProps) {
  const { userPortfolio, markets } = useAppStore()
  const [supplyChange, setSupplyChange] = useState([0])
  const [borrowChange, setBorrowChange] = useState([0])
  const [supplyInput, setSupplyInput] = useState("")
  const [borrowInput, setBorrowInput] = useState("")
  const [preview, setPreview] = useState<RatePreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [calculatorMode, setCalculatorMode] = useState<"slider" | "input">("slider")

  const market = markets.find((m) => m.symbol === symbol)
  const userPosition = userPortfolio?.positions.find((p) => p.symbol === symbol)

  useEffect(() => {
    const calculateRates = async () => {
      const supplyDelta = calculatorMode === "slider" ? supplyChange[0] : Number.parseFloat(supplyInput) || 0
      const borrowDelta = calculatorMode === "slider" ? borrowChange[0] : Number.parseFloat(borrowInput) || 0

      if (supplyDelta === 0 && borrowDelta === 0) {
        setPreview(null)
        return
      }

      setIsLoading(true)
      try {
        const result = await estimateRates(symbol, supplyDelta, borrowDelta)
        setPreview(result)
      } catch (error) {
        console.error("Failed to calculate rates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(calculateRates, 300)
    return () => clearTimeout(debounceTimer)
  }, [symbol, supplyChange, borrowChange, supplyInput, borrowInput, calculatorMode])

  const maxChange = 100000 // Max change in tokens

  const handleApplyChanges = () => {
    const supplyDelta = calculatorMode === "slider" ? supplyChange[0] : Number.parseFloat(supplyInput) || 0
    const borrowDelta = calculatorMode === "slider" ? borrowChange[0] : Number.parseFloat(borrowInput) || 0

    if (onApplyToPanel) {
      onApplyToPanel(supplyDelta > 0 ? supplyDelta : undefined, borrowDelta > 0 ? borrowDelta : undefined)
    }
  }

  const resetCalculator = () => {
    setSupplyChange([0])
    setBorrowChange([0])
    setSupplyInput("")
    setBorrowInput("")
    setPreview(null)
  }

  const calculateImpactMetrics = () => {
    if (!preview || !market) return null

    const currentSupplyApy = market.rates.supplyApy
    const currentBorrowApy = market.rates.borrowApy
    const currentUtilization = (market.totals.totalBorrow / market.totals.totalSupply) * 100

    const supplyApyChange = preview.projectedSupplyApy - currentSupplyApy
    const borrowApyChange = preview.projectedBorrowApy - currentBorrowApy
    const utilizationChange = preview.projectedUtilization - currentUtilization

    return {
      supplyApyChange,
      borrowApyChange,
      utilizationChange,
      isSupplyApyIncreasing: supplyApyChange > 0,
      isBorrowApyIncreasing: borrowApyChange > 0,
      isUtilizationIncreasing: utilizationChange > 0,
    }
  }

  const impactMetrics = calculateImpactMetrics()

  const calculatePotentialEarnings = () => {
    if (!preview) return null

    const supplyDelta = calculatorMode === "slider" ? supplyChange[0] : Number.parseFloat(supplyInput) || 0
    const borrowDelta = calculatorMode === "slider" ? borrowChange[0] : Number.parseFloat(borrowInput) || 0

    const annualSupplyEarnings = supplyDelta > 0 ? (supplyDelta * currentPrice * preview.projectedSupplyApy) / 100 : 0
    const annualBorrowCost = borrowDelta > 0 ? (borrowDelta * currentPrice * preview.projectedBorrowApy) / 100 : 0

    return {
      annualSupplyEarnings,
      annualBorrowCost,
      netAnnualReturn: annualSupplyEarnings - annualBorrowCost,
    }
  }

  const earnings = calculatePotentialEarnings()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Rate Calculator
          <Badge variant="secondary" className="ml-auto">
            {symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calculator Mode Toggle */}
        <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as "slider" | "input")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slider" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Slider Mode
            </TabsTrigger>
            <TabsTrigger value="input" className="gap-2">
              <Zap className="h-4 w-4" />
              Precise Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slider" className="space-y-6">
            {/* Supply Change Slider */}
            <div className="space-y-3">
              <Label>Supply Change</Label>
              <div className="space-y-2">
                <Slider
                  value={supplyChange}
                  onValueChange={setSupplyChange}
                  max={maxChange}
                  min={-maxChange}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>-{maxChange.toLocaleString()}</span>
                  <span className="font-medium">
                    {supplyChange[0] > 0 ? "+" : ""}
                    {supplyChange[0].toLocaleString()} {symbol}
                  </span>
                  <span>+{maxChange.toLocaleString()}</span>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formatUsd(supplyChange[0] * currentPrice)}
                </div>
              </div>
            </div>

            {/* Borrow Change Slider */}
            <div className="space-y-3">
              <Label>Borrow Change</Label>
              <div className="space-y-2">
                <Slider
                  value={borrowChange}
                  onValueChange={setBorrowChange}
                  max={maxChange}
                  min={-maxChange}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>-{maxChange.toLocaleString()}</span>
                  <span className="font-medium">
                    {borrowChange[0] > 0 ? "+" : ""}
                    {borrowChange[0].toLocaleString()} {symbol}
                  </span>
                  <span>+{maxChange.toLocaleString()}</span>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formatUsd(borrowChange[0] * currentPrice)}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="input" className="space-y-6">
            {/* Supply Input */}
            <div className="space-y-3">
              <Label htmlFor="supply-input">Supply Amount ({symbol})</Label>
              <Input
                id="supply-input"
                type="number"
                placeholder="0.00"
                value={supplyInput}
                onChange={(e) => setSupplyInput(e.target.value)}
              />
              {supplyInput && (
                <div className="text-sm text-muted-foreground">
                  USD Value: {formatUsd((Number.parseFloat(supplyInput) || 0) * currentPrice)}
                </div>
              )}
            </div>

            {/* Borrow Input */}
            <div className="space-y-3">
              <Label htmlFor="borrow-input">Borrow Amount ({symbol})</Label>
              <Input
                id="borrow-input"
                type="number"
                placeholder="0.00"
                value={borrowInput}
                onChange={(e) => setBorrowInput(e.target.value)}
              />
              {borrowInput && (
                <div className="text-sm text-muted-foreground">
                  USD Value: {formatUsd((Number.parseFloat(borrowInput) || 0) * currentPrice)}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Position Info */}
        {userPosition && (userPosition.supplied > 0 || userPosition.borrowed > 0) && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Your Current Position</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {userPosition.supplied > 0 && (
                <div>
                  <div className="text-muted-foreground">Supplied</div>
                  <div className="font-medium">
                    {userPosition.supplied.toLocaleString()} {symbol}
                  </div>
                </div>
              )}
              {userPosition.borrowed > 0 && (
                <div>
                  <div className="text-muted-foreground">Borrowed</div>
                  <div className="font-medium">
                    {userPosition.borrowed.toLocaleString()} {symbol}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Results */}
        {preview && !isLoading && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Projected Market Changes
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Supply APY</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">{formatPct(preview.projectedSupplyApy)}</span>
                  {impactMetrics && (
                    <Badge variant={impactMetrics.isSupplyApyIncreasing ? "default" : "secondary"} className="text-xs">
                      {impactMetrics.isSupplyApyIncreasing ? "+" : ""}
                      {formatPct(impactMetrics.supplyApyChange)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Borrow APY</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-orange-600">{formatPct(preview.projectedBorrowApy)}</span>
                  {impactMetrics && (
                    <Badge
                      variant={impactMetrics.isBorrowApyIncreasing ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {impactMetrics.isBorrowApyIncreasing ? "+" : ""}
                      {formatPct(impactMetrics.borrowApyChange)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Utilization</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatPct(preview.projectedUtilization)}</span>
                  {impactMetrics && (
                    <Badge variant="outline" className="text-xs">
                      {impactMetrics.isUtilizationIncreasing ? "+" : ""}
                      {formatPct(impactMetrics.utilizationChange)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Your Health Factor</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{preview.projectedHF.toFixed(2)}</span>
                  {userPortfolio && (
                    <Badge
                      variant={
                        preview.projectedHF > userPortfolio.healthFactor
                          ? "default"
                          : preview.projectedHF < userPortfolio.healthFactor
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {preview.projectedHF > userPortfolio.healthFactor ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : preview.projectedHF < userPortfolio.healthFactor ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        "="
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Earnings Projection */}
            {earnings && (earnings.annualSupplyEarnings > 0 || earnings.annualBorrowCost > 0) && (
              <div className="pt-3 border-t">
                <h5 className="font-medium mb-2">Annual Projections</h5>
                <div className="space-y-2 text-sm">
                  {earnings.annualSupplyEarnings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supply Earnings:</span>
                      <span className="font-medium text-green-600">+{formatUsd(earnings.annualSupplyEarnings)}</span>
                    </div>
                  )}
                  {earnings.annualBorrowCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Borrow Cost:</span>
                      <span className="font-medium text-orange-600">-{formatUsd(earnings.annualBorrowCost)}</span>
                    </div>
                  )}
                  {earnings.annualSupplyEarnings > 0 && earnings.annualBorrowCost > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Net Annual Return:</span>
                      <span
                        className={`font-medium ${earnings.netAnnualReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {earnings.netAnnualReturn >= 0 ? "+" : ""}
                        {formatUsd(earnings.netAnnualReturn)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
            Calculating rates...
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onApplyToPanel &&
            ((calculatorMode === "slider" && (supplyChange[0] !== 0 || borrowChange[0] !== 0)) ||
              (calculatorMode === "input" && (supplyInput || borrowInput))) && (
              <Button onClick={handleApplyChanges} className="flex-1">
                Apply to Transaction Panel
              </Button>
            )}

          {((calculatorMode === "slider" && (supplyChange[0] !== 0 || borrowChange[0] !== 0)) ||
            (calculatorMode === "input" && (supplyInput || borrowInput))) && (
            <Button variant="outline" onClick={resetCalculator} className="flex-1 bg-transparent">
              Reset Calculator
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Use the calculator to simulate how your actions would affect market rates</p>
          <p>• Positive values = supply/borrow more, negative values = withdraw/repay</p>
          <p>• All projections are estimates based on current market conditions</p>
        </div>
      </CardContent>
    </Card>
  )
}
