export type AssetSymbol = "SUI" | "USDC" | "USDT" | "WETH"

export interface Market {
  symbol: AssetSymbol
  name: string
  icon: string
  priceUsd: number
  totals: {
    totalSupply: number
    totalBorrow: number
    liquidity: number
  }
  rates: {
    supplyApy: number
    borrowApy: number
  }
  caps: {
    supplyCap: number
    borrowCap: number
  }
  risk: {
    collateralFactor: number // LTV
    liquidationThreshold: number
    liquidationPenalty: number
  }
}

export interface UserPosition {
  symbol: AssetSymbol
  supplied: number
  borrowed: number
  isCollateral: boolean
}

export interface UserPortfolio {
  address: string
  positions: UserPosition[]
  netWorthUsd: number
  totalSuppliedUsd: number
  totalBorrowedUsd: number
  healthFactor: number
}

export interface RatePreview {
  projectedSupplyApy: number
  projectedBorrowApy: number
  projectedUtilization: number
  projectedHF: number
}

export interface TxReceipt {
  hash: string
  status: "success" | "failed" | "pending"
}

export type ActionType = "supply" | "borrow" | "withdraw" | "repay"
