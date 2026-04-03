'use client'

import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useLiFiRoute,
  LIFI_SUPPORTED_CHAINS,
  type LiFiChainId,
} from '@/lib/useLiFiRoute'
import { parseUnits } from 'viem'
import { sanitizeNumericInput } from '@/lib/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const BRIDGE_TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC'] as const
type BridgeToken = typeof BRIDGE_TOKENS[number]

const TOKEN_DECIMALS: Record<BridgeToken, number> = {
  ETH: 18, USDC: 6, USDT: 6, DAI: 18, WETH: 18, WBTC: 8,
}

// ─── Chain selector ───────────────────────────────────────────────────────────

function ChainSelector({
  value,
  onChange,
  exclude,
  label,
}: {
  value: LiFiChainId
  onChange: (id: LiFiChainId) => void
  exclude?: LiFiChainId
  label: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {LIFI_SUPPORTED_CHAINS.map(chain => {
          const isSelected = chain.id === value
          const isDisabled = chain.id === exclude
          return (
            <button
              key={chain.id}
              onClick={() => !isDisabled && onChange(chain.id as LiFiChainId)}
              disabled={isDisabled}
              className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors border ${
                isSelected
                  ? 'bg-goodgreen/20 text-goodgreen border-goodgreen/40'
                  : isDisabled
                  ? 'opacity-30 cursor-not-allowed bg-dark-50 border-gray-700/30 text-gray-500'
                  : 'bg-dark-50 border-gray-700/30 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {chain.shortName}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Token selector ───────────────────────────────────────────────────────────

function TokenSelector({
  value,
  onChange,
}: {
  value: BridgeToken
  onChange: (t: BridgeToken) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-400">Token</label>
      <div className="flex flex-wrap gap-2">
        {BRIDGE_TOKENS.map(token => (
          <button
            key={token}
            onClick={() => onChange(token)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              value === token
                ? 'bg-goodgreen/20 text-goodgreen border-goodgreen/40'
                : 'bg-dark-50 border-gray-700/30 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Route summary ────────────────────────────────────────────────────────────

function RouteSummary({
  toAmountFormatted,
  toToken,
  gasCostUSD,
  priceImpactPct,
  executionTimeSec,
  routeSummary,
  loading,
  error,
}: {
  toAmountFormatted: string | null
  toToken: BridgeToken
  gasCostUSD: string | null
  priceImpactPct: string | null
  executionTimeSec: number | null
  routeSummary: string | null
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="bg-dark-50 border border-gray-700/30 rounded-xl p-4 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-goodgreen/30 border-t-goodgreen rounded-full animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400 animate-pulse">Finding best route…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    )
  }

  if (!toAmountFormatted) return null

  const etaSec = executionTimeSec ?? 0
  const etaLabel = etaSec >= 60 ? `~${Math.round(etaSec / 60)}m` : `~${etaSec}s`

  return (
    <div className="bg-dark-50 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">You receive</span>
        <span className="text-sm font-semibold text-white">
          {toAmountFormatted} {toToken}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">Gas</p>
          <p className="text-xs text-white">{gasCostUSD ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">Impact</p>
          <p className="text-xs text-white">{priceImpactPct ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">Time</p>
          <p className="text-xs text-white">{etaSec > 0 ? etaLabel : '—'}</p>
        </div>
      </div>
      {routeSummary && (
        <p className="text-[10px] text-gray-500 text-center border-t border-gray-700/20 pt-2">
          via {routeSummary}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BridgePage() {
  const { address, isConnected } = useAccount()

  const [fromChain, setFromChain] = useState<LiFiChainId>(1)       // Ethereum
  const [toChain, setToChain] = useState<LiFiChainId>(42161)       // Arbitrum
  const [fromToken, setFromToken] = useState<BridgeToken>('ETH')
  const [toToken, setToToken] = useState<BridgeToken>('ETH')
  const [amount, setAmount] = useState('')

  // Build Li.Fi quote params — only when connected and amount entered
  const quoteParams = useMemo(() => {
    if (!isConnected || !address || !amount || parseFloat(amount) <= 0) return null
    try {
      const decimals = TOKEN_DECIMALS[fromToken]
      const fromAmount = parseUnits(amount, decimals).toString()
      return {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount,
        fromAddress: address,
      }
    } catch {
      return null
    }
  }, [isConnected, address, amount, fromChain, toChain, fromToken, toToken])

  const {
    toAmountFormatted,
    gasCostUSD,
    priceImpactPct,
    executionTimeSec,
    routeSummary,
    loading,
    error,
    refresh,
  } = useLiFiRoute(quoteParams)

  function swapChains() {
    setFromChain(toChain)
    setToChain(fromChain)
    setFromToken(toToken)
    setToToken(fromToken)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Cross-Chain Bridge</h1>
        <p className="text-sm text-gray-400">
          Move assets between chains via Li.Fi route aggregation.
        </p>
      </div>

      {/* Connect prompt */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-dark-100 border border-gray-700/30 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-gray-400">Connect wallet to bridge</p>
          <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
        </div>
      )}

      {/* Bridge card */}
      <div className="bg-dark-100 border border-gray-700/40 rounded-2xl p-5 flex flex-col gap-5">

        {/* From chain */}
        <ChainSelector
          label="From chain"
          value={fromChain}
          onChange={setFromChain}
          exclude={toChain}
        />

        {/* Swap chains button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700/30" />
          <button
            onClick={swapChains}
            className="w-8 h-8 rounded-full bg-dark-50 border border-gray-700/40 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            title="Swap chains"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <div className="flex-1 h-px bg-gray-700/30" />
        </div>

        {/* To chain */}
        <ChainSelector
          label="To chain"
          value={toChain}
          onChange={setToChain}
          exclude={fromChain}
        />

        {/* Token selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Send</p>
            <TokenSelector value={fromToken} onChange={setFromToken} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Receive</p>
            <TokenSelector value={toToken} onChange={setToToken} />
          </div>
        </div>

        {/* Amount input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400">Amount ({fromToken})</label>
          <input
            type="number"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
            className="w-full bg-dark-50 border border-gray-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-goodgreen/50"
          />
        </div>

        {/* Route summary */}
        <RouteSummary
          toAmountFormatted={toAmountFormatted}
          toToken={toToken}
          gasCostUSD={gasCostUSD}
          priceImpactPct={priceImpactPct}
          executionTimeSec={executionTimeSec}
          routeSummary={routeSummary}
          loading={loading}
          error={error}
        />

        {/* Refresh + bridge actions */}
        <div className="flex gap-3">
          {quoteParams && (
            <button
              onClick={refresh}
              className="p-3 rounded-xl bg-dark-50 border border-gray-700/40 text-gray-400 hover:text-white transition-colors"
              title="Refresh quote"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button
            disabled={!toAmountFormatted || !isConnected}
            className="flex-1 py-3 rounded-xl bg-goodgreen text-white font-semibold text-sm hover:bg-goodgreen-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {!isConnected ? 'Connect Wallet' : !toAmountFormatted ? 'Enter amount' : 'Bridge'}
          </button>
        </div>
      </div>

      {/* GoodDollar L2 native bridge section */}
      <div className="mt-6 p-5 bg-dark-100 border border-gray-700/40 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-goodgreen/15 flex items-center justify-center">
            <svg className="w-3 h-3 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">GoodDollar L2 Native Bridge</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Pending OP Stack
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          The native ETH/L2 deposit bridge (GoodDollar L2 ↔ Ethereum mainnet) requires the OP Stack
          to be deployed — op-geth, op-node, and op-batcher. Once live, you'll be able to bridge
          directly to chain 42069 with canonical L2 security guarantees.
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-dark-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 mb-1">Chain ID</p>
            <p className="text-sm font-semibold text-white">42069</p>
          </div>
          <div className="bg-dark-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 mb-1">Status</p>
            <p className="text-xs font-medium text-yellow-400">Awaiting OP Stack</p>
          </div>
        </div>
      </div>

      {/* Li.Fi attribution */}
      <p className="mt-4 text-center text-[10px] text-gray-600">
        Cross-chain routes powered by{' '}
        <span className="text-gray-400">Li.Fi</span> · 7 chains · 25+ bridges
      </p>
    </div>
  )
}
