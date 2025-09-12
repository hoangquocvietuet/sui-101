import type { UserPortfolio, Market } from "./types"

export function computeUtilization(totalBorrow: number, totalSupply: number): number {
  if (totalSupply === 0) return 0
  return (totalBorrow / totalSupply) * 100
}

export function computeHealthFactor(user: UserPortfolio, markets: Market[]): number {
  let totalCollateralValue = 0
  let totalBorrowValue = 0

  user.positions.forEach((position) => {
    const market = markets.find((m) => m.symbol === position.symbol)
    if (!market) return

    if (position.isCollateral && position.supplied > 0) {
      totalCollateralValue += position.supplied * market.priceUsd * market.risk.liquidationThreshold
    }

    if (position.borrowed > 0) {
      totalBorrowValue += position.borrowed * market.priceUsd
    }
  })

  if (totalBorrowValue === 0) return 999 // No debt = very healthy
  return totalCollateralValue / totalBorrowValue
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPct(percentage: number): string {
  return `${percentage.toFixed(2)}%`
}

export function toTokenAmt(amount: number, decimals = 6): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function calculateLiquidationPrice(
  collateralAmount: number,
  borrowAmount: number,
  liquidationThreshold: number,
): number {
  if (collateralAmount === 0) return 0
  return borrowAmount / (collateralAmount * liquidationThreshold)
}
