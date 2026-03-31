'use client'

import { useState, useCallback, useMemo } from 'react'
import { TokenSelector, Token, TOKENS } from './TokenSelector'
import { UBIBreakdown } from './UBIBreakdown'

const MOCK_RATES: Record<string, Record<string, number>> = {
  'G$':   { 'ETH': 0.00001,  'USDC': 0.01,    'G$': 1 },
  'ETH':  { 'G$': 100000,    'USDC': 3000,     'ETH': 1 },
  'USDC': { 'G$': 100,       'ETH': 0.000333,  'USDC': 1 },
}

const SWAP_FEE_BPS = 30 // 0.3%
const UBI_FEE_BPS = 3333 // 33.33% of swap fee goes to UBI

export function SwapCard() {
  const [inputToken, setInputToken] = useState<Token>(TOKENS[1]) // ETH
  const [outputToken, setOutputToken] = useState<Token>(TOKENS[0]) // G$
  const [inputAmount, setInputAmount] = useState('')

  const outputAmount = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return ''
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    const gross = amt * rate
    const fee = gross * (SWAP_FEE_BPS / 10000)
    return (gross - fee).toFixed(inputToken.symbol === 'USDC' ? 2 : 6)
  }, [inputAmount, inputToken.symbol, outputToken.symbol])

  const ubiFee = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    const gross = amt * rate
    const swapFee = gross * (SWAP_FEE_BPS / 10000)
    return swapFee * (UBI_FEE_BPS / 10000)
  }, [inputAmount, inputToken.symbol, outputToken.symbol])

  const exchangeRate = useMemo(() => {
    const rate = MOCK_RATES[inputToken.symbol]?.[outputToken.symbol] ?? 0
    if (rate >= 1000) return `1 ${inputToken.symbol} = ${rate.toLocaleString()} ${outputToken.symbol}`
    if (rate >= 1) return `1 ${inputToken.symbol} = ${rate.toFixed(2)} ${outputToken.symbol}`
    return `1 ${inputToken.symbol} = ${rate.toFixed(6)} ${outputToken.symbol}`
  }, [inputToken.symbol, outputToken.symbol])

  const handleFlip = useCallback(() => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setInputAmount('')
  }, [inputToken, outputToken])

  const handleInputSelect = useCallback((t: Token) => {
    if (t.symbol === outputToken.symbol) {
      setOutputToken(inputToken)
    }
    setInputToken(t)
  }, [inputToken, outputToken])

  const handleOutputSelect = useCallback((t: Token) => {
    if (t.symbol === inputToken.symbol) {
      setInputToken(outputToken)
    }
    setOutputToken(t)
  }, [inputToken, outputToken])

  return (
    <div className="w-full max-w-[460px]">
      <div className="bg-dark-100 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Swap</h2>
          <span className="text-xs text-gray-400 bg-dark-50 px-2.5 py-1 rounded-lg">0.3% fee</span>
        </div>

        {/* Input */}
        <div className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You pay</span>
            <button className="text-xs text-goodgreen hover:text-goodgreen-300 transition-colors">
              Max
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0"
              value={inputAmount}
              onChange={e => setInputAmount(e.target.value)}
              className="flex-1 bg-transparent text-3xl font-medium text-white outline-none placeholder:text-gray-600 min-w-0"
            />
            <TokenSelector
              selected={inputToken}
              onSelect={handleInputSelect}
              exclude={outputToken.symbol}
            />
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlip}
            className="w-10 h-10 rounded-xl bg-dark-100 border border-gray-700/50 flex items-center justify-center hover:border-goodgreen/50 hover:text-goodgreen transition-colors text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output */}
        <div className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0"
              value={outputAmount}
              readOnly
              className="flex-1 bg-transparent text-3xl font-medium text-white outline-none placeholder:text-gray-600 min-w-0"
            />
            <TokenSelector
              selected={outputToken}
              onSelect={handleOutputSelect}
              exclude={inputToken.symbol}
            />
          </div>
        </div>

        {/* Rate display */}
        {inputAmount && parseFloat(inputAmount) > 0 && (
          <div className="mx-4 mt-3 px-4 py-2 text-xs text-gray-400 flex justify-between">
            <span>Rate</span>
            <span>{exchangeRate}</span>
          </div>
        )}

        {/* UBI Breakdown */}
        <UBIBreakdown
          ubiFeeAmount={ubiFee}
          outputToken={outputToken}
          visible={!!inputAmount && parseFloat(inputAmount) > 0}
        />

        {/* Swap button */}
        <div className="p-4 pt-3">
          <button
            disabled
            className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-goodgreen/20 text-goodgreen/60 cursor-not-allowed"
          >
            Connect Wallet to Swap
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by GoodDollar L2 — Chain ID 42069
        </p>
      </div>
    </div>
  )
}
