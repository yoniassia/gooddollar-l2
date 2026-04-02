'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ALL_CATEGORIES, type MarketCategory } from '@/lib/predictData'

export default function CreateMarketPage() {
  const [question, setQuestion] = useState('')
  const [criteria, setCriteria] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState<MarketCategory>('Crypto')
  const [liquidity, setLiquidity] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required'
    if (!criteria.trim()) errs.criteria = 'Resolution criteria is required'
    if (!endDate) errs.endDate = 'End date is required'
    else if (new Date(endDate) <= new Date()) errs.endDate = 'End date must be in the future'
    if (!liquidity || parseFloat(liquidity) < 100) errs.liquidity = 'Minimum $100 initial liquidity'
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-dark-100 rounded-2xl border border-goodgreen/30 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-goodgreen/15 border border-goodgreen/25 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Market Created!</h2>
          <p className="text-sm text-gray-400 mb-6">&quot;{question}&quot;</p>
          <div className="flex gap-3 justify-center">
            <Link href="/predict" className="px-5 py-2.5 rounded-xl bg-goodgreen text-white font-semibold text-sm hover:bg-goodgreen-600 transition-colors">
              View Markets
            </Link>
            <button onClick={() => { setSubmitted(false); setQuestion(''); setCriteria(''); setEndDate(''); setLiquidity('') }}
              className="px-5 py-2.5 rounded-xl bg-dark-50 text-gray-300 font-semibold text-sm hover:bg-dark-50/80 transition-colors border border-gray-700/30">
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/predict" className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Market</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block font-medium">Question *</label>
          <input type="text" placeholder="Will X happen by Y?" value={question} onChange={e => setQuestion(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${errors.question ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {errors.question && <p className="text-red-400 text-xs mt-1">{errors.question}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block font-medium">Resolution Criteria *</label>
          <textarea placeholder="How will this market be resolved?" value={criteria} onChange={e => setCriteria(e.target.value)} rows={3}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 resize-none ${errors.criteria ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {errors.criteria && <p className="text-red-400 text-xs mt-1">{errors.criteria}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">End Date *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${errors.endDate ? 'border-red-500/50' : 'border-gray-700/30'}`} />
            {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as MarketCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50">
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block font-medium">Initial Liquidity (USD) *</label>
          <input type="number" step="1" min="100" placeholder="Min $100" value={liquidity} onChange={e => setLiquidity(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${errors.liquidity ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {errors.liquidity && <p className="text-red-400 text-xs mt-1">{errors.liquidity}</p>}
          <p className="text-xs text-gray-600 mt-1">Liquidity bootstraps the market and enables trading.</p>
        </div>

        <button type="submit"
          className="w-full py-3 rounded-xl bg-goodgreen text-white font-semibold text-sm hover:bg-goodgreen-600 transition-colors active:scale-[0.98]">
          Create Market
        </button>
      </form>
    </div>
  )
}
