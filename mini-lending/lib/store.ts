import { create } from "zustand"
import type { Market, UserPortfolio } from "./types"

interface AppState {
  // Market data
  markets: Market[]

  // User data
  userPortfolio: UserPortfolio | null

  // UI state
  isLoading: boolean

  // Actions
  setMarkets: (markets: Market[]) => void
  setUserPortfolio: (portfolio: UserPortfolio | null) => void
  setLoading: (loading: boolean) => void
  clearUserData: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  markets: [],
  userPortfolio: null,
  isLoading: false,

  // Actions
  setMarkets: (markets) => set({ markets }),

  setUserPortfolio: (userPortfolio) => set({ userPortfolio }),

  setLoading: (isLoading) => set({ isLoading }),

  clearUserData: () => set({ userPortfolio: null }),
}))