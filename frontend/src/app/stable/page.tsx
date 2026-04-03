'use client'

import { useState, useMemo } from 'react'
import { WalletButton } from '@/components/WalletButton'
import { sanitizeNumericInput } from '@/lib/format'
import {
  ILKS,
  ILK_ETH,
  ILK_GD,
  ILK_USDC,
  useVault,
  useGUSDBalance,
  useGUSDTotalSupply,
  useCollateralBalance,
  useStableAction,
  useConnectedAccount,
  maxMintable,
  type IlkKey,
  type StableActionKind,
} from '@/lib/useGoodStable'

// Approximate USD prices for collateral (devnet — no live oracle on frontend)
const COLLATERAL_PRICES: Record<string, number> = {
  WETH: 3200,
  'G$': 0.00035,
  USDC: 1.0,
}

const ILK_CONFIG = {
  [ILK_ETH]:  { label: 'WETH', symbol: 'WETH',  ratio: '150%', fee: '~2% APY', color: 'text-blue-400',  icon: 'ETH' },
  [ILK_GD]:   { label: 'G$',   symbol: 'G$',    ratio: '200%', fee: '~3% APY', color: 'text-goodgreen', icon: 'G$' },
  [ILK_USDC]: { label: 'USDC', symbol: 'USDC',  ratio: '101%', fee: '~0.5% APY', color: 'text-emerald-400', icon: '$' },
} as const

function fmt(n: number, decimals = 4) {
  if (!isFinite(n) || isNaN(n)) return '0'
  return n.toFixed(decimals)
}

function fmtHF(hf: number) {
  if (!isFinite(hf)) return '∞'
  return hf.toFixed(2)
}

function hfColor(hf: number) {
  if (!isFinite(hf)) return 'text-goodgreen'
  if (hf >= 2.0) return 'text-goodgreen'
  if (hf >= 1.5) return 'text-yellow-400'
  if (hf >= 1.1) return 'text-orange-400'
  return 'text-red-400'
}

// ─── Vault panel for one collateral type ─────────────────────────────────────

function VaultPanel({ ilkKey }: { ilkKey: IlkKey }) {
  const cfg = ILK_CONFIG[ilkKey]
  const ilkMeta = ILKS.find(i => i.key === ilkKey)!

  const address = useConnectedAccount()
  const price = COLLATERAL_PRICES[cfg.symbol] ?? 1
  const liquidationRatio = ilkMeta.minRatio / 100

  const { data: vault, isLoading: vaultLoading } = useVault(
    ilkKey, address, ilkMeta.decimals, price, liquidationRatio,
  )
  const { balanceFloat: collateralBalance } = useCollateralBalance(
    ilkMeta.tokenAddress, ilkMeta.decimals, address,
  )
  const { balanceFloat: gusdBalance } = useGUSDBalance(address)
  const { execute, phase, error, reset } = useStableAction()

  const [tab, setTab] = useState<StableActionKind>('deposit')
  const [amount, setAmount] = useState('')

  const busy = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  const phaseLabel: Record<typeof phase, string> = {
    idle:       tab === 'deposit' ? 'Deposit' : tab === 'withdraw' ? 'Withdraw' : tab === 'mint' ? 'Mint gUSD' : 'Repay gUSD',
    approving:  'Approving…',
    submitting: 'Submitting…',
    confirming: 'Confirming…',
    done:       'Done!',
    error:      'Try Again',
  }

  const maxDeposit = collateralBalance
  const maxWithdraw = vault ? vault.collateralFloat : 0
  const maxMint = vault ? maxMintable(vault.collateralFloat, price, liquidationRatio, vault.actualDebtFloat) : 0
  const maxRepay = vault ? Math.min(vault.actualDebtFloat, gusdBalance) : 0

  function handleMax() {
    const maxVal = tab === 'deposit' ? maxDeposit : tab === 'withdraw' ? maxWithdraw : tab === 'mint' ? maxMint : maxRepay
    setAmount(fmt(maxVal, 6))
  }

  function handleSubmit() {
    if (!amount || !address) return
    execute(tab, ilkKey, amount, ilkMeta.tokenAddress, ilkMeta.decimals)
      .then(() => { if (phase === 'done') setAmount('') })
  }

  return (
    <div className="rounded-2xl bg-dark-100 border border-dark-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-50/30">
        <div className={`w-10 h-10 rounded-full bg-dark-50 flex items-center justify-center font-bold text-sm ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div>
          <div className="text-white font-semibold">{cfg.label} Vault</div>
          <div className="text-xs text-gray-400">Min. ratio {cfg.ratio} · Stability fee {cfg.fee}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-dark-50/30 border-b border-dark-50/30">
        <div className="px-4 py-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Collateral</div>
          <div className="text-sm font-medium text-white">
            {vaultLoading ? '…' : `${fmt(vault?.collateralFloat ?? 0, 4)} ${cfg.label}`}
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Debt</div>
          <div className="text-sm font-medium text-white">
            {vaultLoading ? '…' : `${fmt(vault?.actualDebtFloat ?? 0, 2)} gUSD`}
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Health</div>
          <div className={`text-sm font-medium ${hfColor(vault?.healthFactor ?? Infinity)}`}>
            {vaultLoading ? '…' : fmtHF(vault?.healthFactor ?? Infinity)}
          </div>
        </div>
      </div>

      {/* Action tabs */}
      <div className="p-4">
        <div className="flex gap-1 mb-4 bg-dark-50/30 rounded-xl p-1">
          {(['deposit', 'withdraw', 'mint', 'repay'] as StableActionKind[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setAmount(''); reset() }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                tab === t ? 'bg-goodgreen text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'mint' ? 'Mint' : t === 'repay' ? 'Repay' : t === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="relative mb-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
            className="w-full bg-dark-50/50 border border-dark-50 rounded-xl px-4 py-3 pr-20 text-white text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-goodgreen/40"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={handleMax}
              className="text-xs text-goodgreen hover:text-goodgreen/80 font-medium"
            >
              MAX
            </button>
            <span className="text-xs text-gray-400">
              {tab === 'mint' || tab === 'repay' ? 'gUSD' : cfg.label}
            </span>
          </div>
        </div>

        {/* Helper text */}
        <div className="text-xs text-gray-500 mb-3">
          {tab === 'deposit' && `Wallet: ${fmt(maxDeposit, 4)} ${cfg.label}`}
          {tab === 'withdraw' && `Max: ${fmt(maxWithdraw, 4)} ${cfg.label}`}
          {tab === 'mint' && `Max safe: ${fmt(maxMint, 2)} gUSD`}
          {tab === 'repay' && `Outstanding: ${fmt(maxRepay, 2)} gUSD`}
        </div>

        {/* Submit */}
        {address ? (
          <button
            onClick={phase === 'done' || phase === 'error' ? reset : handleSubmit}
            disabled={busy || (!amount && phase === 'idle')}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.99] ${
              phase === 'done'
                ? 'bg-goodgreen/20 text-goodgreen border border-goodgreen/30'
                : phase === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-goodgreen text-white hover:bg-goodgreen/90 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {phaseLabel[phase]}
          </button>
        ) : (
          <div className="flex justify-center">
            <WalletButton />
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}

// ─── Protocol stats bar ───────────────────────────────────────────────────────

function ProtocolStats() {
  const { totalSupplyFloat, isLoading } = useGUSDTotalSupply()
  const supplyDisplay = isLoading
    ? '…'
    : totalSupplyFloat > 0
      ? totalSupplyFloat.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' gUSD'
      : '—'

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Total gUSD Supply', value: supplyDisplay, sub: 'live from devnet' },
        { label: 'UBI Fees Routed', value: '33%', sub: 'of stability fees' },
        { label: 'Min. Ratio', value: '101–200%', sub: 'depends on collateral' },
      ].map(s => (
        <div key={s.label} className="rounded-xl bg-dark-100 border border-dark-50/50 px-4 py-3 text-center">
          <div className="text-lg font-bold text-white">{s.value}</div>
          <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          <div className="text-[11px] text-gray-600 mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StablePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
            <span className="text-goodgreen font-bold text-sm">gUSD</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">GoodStable</h1>
            <p className="text-sm text-gray-400">Mint gUSD stablecoin by locking collateral</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 max-w-xl">
          Lock WETH, G$, or USDC to mint gUSD — a decentralised stablecoin backed by overcollateralized vaults.
          33% of stability fees fund the UBI pool.
        </p>
      </div>

      <ProtocolStats />

      {/* Vault panels */}
      <div className="grid gap-4 md:grid-cols-3">
        <VaultPanel ilkKey={ILK_ETH} />
        <VaultPanel ilkKey={ILK_GD} />
        <VaultPanel ilkKey={ILK_USDC} />
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-2xl bg-dark-100 border border-dark-50/50 p-5">
        <h2 className="text-sm font-semibold text-white mb-3">How GoodStable works</h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li><span className="text-goodgreen font-medium">1.</span> Deposit collateral (WETH, G$, or USDC) into a vault.</li>
          <li><span className="text-goodgreen font-medium">2.</span> Mint gUSD up to the safe collateralisation limit.</li>
          <li><span className="text-goodgreen font-medium">3.</span> Use gUSD anywhere — swap, lend, or bridge across chains.</li>
          <li><span className="text-goodgreen font-medium">4.</span> Repay gUSD + accrued stability fee to unlock your collateral.</li>
          <li><span className="text-goodgreen font-medium">5.</span> Keep your health factor above 1.0 to avoid liquidation.</li>
        </ol>
      </div>
    </div>
  )
}
