'use client'

/**
 * useOnChainStocks — reads synthetic stock data from on-chain contracts.
 *
 * Replaces mock MOCK_STOCKS/MOCK_HOLDINGS/MOCK_TRADES from stockData.ts
 * with real reads from SyntheticAssetFactory, CollateralVault, and PriceOracle.
 *
 * Falls back to empty data when contracts are unavailable.
 */

import { useMemo } from 'react'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { SyntheticAssetFactoryABI, CollateralVaultABI, PriceOracleABI } from './abi'
import { CONTRACTS } from './chain'
import type { Stock, PortfolioHolding } from './stockData'

const FACTORY = CONTRACTS.SyntheticAssetFactory
const VAULT = CONTRACTS.CollateralVault
const ORACLE = CONTRACTS.StocksPriceOracle

// Static metadata for known stocks (sector/description enrichment)
const STOCK_META: Record<string, { sector: string; description: string }> = {
  AAPL:  { sector: 'Technology', description: 'Apple Inc. — smartphones, computers, services.' },
  TSLA:  { sector: 'Automotive', description: 'Tesla Inc. — electric vehicles & energy.' },
  NVDA:  { sector: 'Technology', description: 'NVIDIA Corp. — GPUs & AI computing.' },
  MSFT:  { sector: 'Technology', description: 'Microsoft Corp. — Windows, Azure, Office.' },
  AMZN:  { sector: 'Consumer', description: 'Amazon.com — e-commerce & AWS cloud.' },
  GOOGL: { sector: 'Technology', description: 'Alphabet Inc. — Google, YouTube, Cloud.' },
  META:  { sector: 'Technology', description: 'Meta Platforms — Facebook, Instagram, WhatsApp.' },
  JPM:   { sector: 'Finance', description: 'JPMorgan Chase — banking & financial services.' },
  V:     { sector: 'Finance', description: 'Visa Inc. — global payments network.' },
  DIS:   { sector: 'Entertainment', description: 'Walt Disney — media, parks, streaming.' },
  NFLX:  { sector: 'Entertainment', description: 'Netflix — streaming entertainment.' },
  AMD:   { sector: 'Technology', description: 'AMD — CPUs, GPUs, adaptive computing.' },
}

// Known tickers (matches what DeployGoodStocks deployed)
const KNOWN_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD']

// ─── Read all stock listings + prices from chain ─────────────────────────────

export function useOnChainStocks(): { stocks: Stock[]; isLoading: boolean; isLive: boolean } {
  // Read prices for all known tickers from StocksPriceOracle
  const priceContracts = useMemo(() => {
    if (!ORACLE) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: ORACLE as `0x${string}`,
      abi: PriceOracleABI,
      functionName: 'getPrice' as const,
      args: [ticker] as [string],
    }))
  }, [])

  const { data: priceData, isLoading } = useReadContracts({
    contracts: priceContracts,
    query: { enabled: priceContracts.length > 0, refetchInterval: 30_000 },
  })

  const stocks = useMemo<Stock[]>(() => {
    if (!priceData || priceData.length === 0) return []

    return KNOWN_TICKERS.map((ticker, i) => {
      const r = priceData[i]
      const price = r?.status === 'success' && typeof r.result === 'bigint'
        ? Number(r.result) / 1e8
        : 0

      if (price === 0) return null

      const meta = STOCK_META[ticker] ?? { sector: 'Unknown', description: `Synthetic ${ticker}` }

      return {
        ticker,
        name: `s${ticker}`,
        sector: meta.sector,
        description: meta.description,
        price,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        high52w: price * 1.15,
        low52w: price * 0.75,
        sparkline7d: [price, price, price, price, price, price, price],
        peRatio: 0,
        eps: 0,
        dividendYield: 0,
        avgVolume: 0,
      }
    }).filter(Boolean) as Stock[]
  }, [priceData])

  return { stocks, isLoading, isLive: stocks.length > 0 }
}

// ─── Read user's on-chain portfolio (CollateralVault positions) ──────────────

export function useOnChainHoldings(): {
  holdings: PortfolioHolding[]
  isLoading: boolean
} {
  const { address } = useAccount()

  // Read positions for all tickers
  const posContracts = useMemo(() => {
    if (!VAULT || !address) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: VAULT as `0x${string}`,
      abi: CollateralVaultABI,
      functionName: 'getPosition' as const,
      args: [address, ticker] as [string, string],
    }))
  }, [address])

  // Read prices
  const priceContracts = useMemo(() => {
    if (!ORACLE) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: ORACLE as `0x${string}`,
      abi: PriceOracleABI,
      functionName: 'getPrice' as const,
      args: [ticker] as [string],
    }))
  }, [])

  const { data: posData, isLoading: posLoading } = useReadContracts({
    contracts: posContracts,
    query: { enabled: posContracts.length > 0, refetchInterval: 15_000 },
  })

  const { data: priceData } = useReadContracts({
    contracts: priceContracts,
    query: { enabled: priceContracts.length > 0, refetchInterval: 30_000 },
  })

  const holdings = useMemo<PortfolioHolding[]>(() => {
    if (!posData) return []

    const result: PortfolioHolding[] = []
    for (let i = 0; i < KNOWN_TICKERS.length; i++) {
      const posR = posData[i]
      if (posR?.status !== 'success' || !posR.result) continue

      const [collateralAmount, debtAmount] = posR.result as unknown as [bigint, bigint]
      if (debtAmount === BigInt(0)) continue // no position

      const shares = Number(debtAmount) / 1e18
      const collateral = Number(collateralAmount) / 1e18

      const priceR = priceData?.[i]
      const currentPrice = priceR?.status === 'success' && typeof priceR.result === 'bigint'
        ? Number(priceR.result) / 1e8
        : 0

      result.push({
        ticker: KNOWN_TICKERS[i],
        shares,
        avgCost: currentPrice, // CDP doesn't track avg cost, use current
        currentPrice,
        collateralDeposited: collateral,
        collateralRequired: shares * currentPrice * 0.5, // min 200% → 50% of value
      })
    }
    return result
  }, [posData, priceData])

  return { holdings, isLoading: posLoading }
}
