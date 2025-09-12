import type { Market, UserPortfolio, TxReceipt, RatePreview, AssetSymbol } from "./types"
import { computeUtilization } from "./math"

// Mock delay to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock market data
const mockMarkets: Market[] = [
  {
    symbol: "SUI",
    name: "Sui",
    icon: "/sui-logo.png",
    priceUsd: 1.2,
    totals: {
      totalSupply: 1500000,
      totalBorrow: 900000,
      liquidity: 600000,
    },
    rates: {
      supplyApy: 4.2,
      borrowApy: 8.5,
    },
    caps: {
      supplyCap: 2000000,
      borrowCap: 1200000,
    },
    risk: {
      collateralFactor: 0.8,
      liquidationThreshold: 0.85,
      liquidationPenalty: 0.05,
    },
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "/usdc-logo.png",
    priceUsd: 1.0,
    totals: {
      totalSupply: 5000000,
      totalBorrow: 3500000,
      liquidity: 1500000,
    },
    rates: {
      supplyApy: 3.8,
      borrowApy: 6.2,
    },
    caps: {
      supplyCap: 8000000,
      borrowCap: 6000000,
    },
    risk: {
      collateralFactor: 0.85,
      liquidationThreshold: 0.9,
      liquidationPenalty: 0.05,
    },
  },
]

// Mock user data
const mockUser: UserPortfolio = {
  address: "0xworkshop1234567890abcdef",
  positions: [
    {
      symbol: "SUI",
      supplied: 1000,
      borrowed: 0,
      isCollateral: true,
    },
    {
      symbol: "USDC",
      supplied: 500,
      borrowed: 200,
      isCollateral: true,
    },
  ],
  netWorthUsd: 1500,
  totalSuppliedUsd: 1700,
  totalBorrowedUsd: 200,
  healthFactor: 5.2,
}

export async function getMarkets(): Promise<Market[]> {
  await delay(Math.random() * 500 + 300)
  return mockMarkets
}

export async function getUser(address: string): Promise<UserPortfolio> {
  await delay(Math.random() * 500 + 300)
  return { ...mockUser, address }
}

export async function supply(address: string, symbol: AssetSymbol, amount: number): Promise<TxReceipt> {
  await delay(Math.random() * 1000 + 800)
  return {
    hash: `0xsui${Math.random().toString(16).slice(2, 10)}`,
    status: "success",
  }
}

export async function borrow(address: string, symbol: AssetSymbol, amount: number): Promise<TxReceipt> {
  await delay(Math.random() * 1000 + 800)
  return {
    hash: `0xsui${Math.random().toString(16).slice(2, 10)}`,
    status: "success",
  }
}

export async function withdraw(address: string, symbol: AssetSymbol, amount: number): Promise<TxReceipt> {
  await delay(Math.random() * 1000 + 800)
  return {
    hash: `0xsui${Math.random().toString(16).slice(2, 10)}`,
    status: "success",
  }
}

export async function repay(address: string, symbol: AssetSymbol, amount: number): Promise<TxReceipt> {
  await delay(Math.random() * 1000 + 800)
  return {
    hash: `0xsui${Math.random().toString(16).slice(2, 10)}`,
    status: "success",
  }
}

export async function estimateRates(
  symbol: AssetSymbol,
  supplyDelta: number,
  borrowDelta: number,
): Promise<RatePreview> {
  await delay(Math.random() * 300 + 200)

  const market = mockMarkets.find((m) => m.symbol === symbol)!
  const newSupply = market.totals.totalSupply + supplyDelta
  const newBorrow = market.totals.totalBorrow + borrowDelta
  const newUtilization = computeUtilization(newBorrow, newSupply)

  // Simple rate model: higher utilization = higher rates
  const utilizationFactor = newUtilization / 100
  const projectedSupplyApy = market.rates.supplyApy * (1 + utilizationFactor * 0.5)
  const projectedBorrowApy = market.rates.borrowApy * (1 + utilizationFactor * 0.3)

  return {
    projectedSupplyApy,
    projectedBorrowApy,
    projectedUtilization: newUtilization,
    projectedHF: mockUser.healthFactor * 0.95, // Mock slight decrease
  }
}

export async function toggleCollateral(address: string, symbol: AssetSymbol, enabled: boolean): Promise<void> {
  await delay(Math.random() * 500 + 300)
  // Mock success - in real app would update user positions
}
