/**
 * Devnet configuration — single source of truth for contract addresses, RPC
 * URL, chain ID, and ABIs.
 *
 * Base addresses are sourced from op-stack/addresses.json (initial deployment).
 * Extended contracts (GoodLend, GoodSwap, GoodStocks redeployment, GoodStable,
 * GoodPerps) are declared here with their live devnet addresses.
 *
 * All frontend data modules should import addresses and ABIs from this module
 * instead of hardcoding values or importing from chain.ts directly.
 */

import rawAddresses from '../../../op-stack/addresses.json'

// ─── Network constants ────────────────────────────────────────────────────────

export const DEVNET_CHAIN_ID: number = rawAddresses.chain_id
export const DEVNET_RPC_URL: string = rawAddresses.rpc_url
export const DEVNET_EXPLORER_URL: string = rawAddresses.explorer_url

// ─── Contract addresses ───────────────────────────────────────────────────────

/**
 * All live devnet contract addresses.
 *
 * Base contracts come from op-stack/addresses.json.
 * Extended contracts (GoodLend, GoodSwap, GoodPerps, GoodStocks, GoodStable)
 * were deployed on 2026-04-03 and are listed here directly.
 *
 * GoodStocks contracts (CollateralVault, SyntheticAssetFactory,
 * StocksPriceOracle) were redeployed on 2026-04-03 with 12 synthetic equities
 * — those addresses below take precedence over the original addresses.json values.
 */
export const CONTRACTS = {
  // ── Core (from op-stack/addresses.json) ──────────────────────────────────
  GoodDollarToken:       rawAddresses.contracts.GoodDollarToken as `0x${string}`,
  UBIFeeSplitter:        rawAddresses.contracts.UBIFeeSplitter as `0x${string}`,
  ValidatorStaking:      rawAddresses.contracts.ValidatorStaking as `0x${string}`,
  UBIFeeHook:            rawAddresses.contracts.UBIFeeHook as `0x${string}`,
  MarketFactory:         '0xc7cDb7A2E5dDa1B7A0E792Fe1ef08ED20A6F56D4' as `0x${string}`,
  ConditionalTokens:     '0x28f057Dc79e3Cb77B2bbF4358D7A690CFe21b2D5' as `0x${string}`,

  // ── GoodLend — devnet (chain 42069), deployed 2026-04-03 ─────────────────
  GoodLendPool:                '0x322813fd9a801c5507c9de605d63cea4f2ce6c44' as `0x${string}`,
  GoodLendPriceOracle:         '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae' as `0x${string}`,
  GoodLendInterestRateModel:   '0xc6e7df5e7b4f2a278906862b61205850344d4e7d' as `0x${string}`,
  // GoodLend reserve tokens
  MockUSDC:              '0x0b306bf915c4d645ff596e518faf3f9669b97016' as `0x${string}`,
  MockWETH:              '0x959922be3caee4b8cd9a407cc3ac1c251c2007b1' as `0x${string}`,
  // gTokens (interest-bearing)
  gUSDC:                 '0xa85233c63b9ee964add6f2cffe00fd84eb32338f' as `0x${string}`,
  gWETH:                 '0x7a2088a1bfc9d81c55368ae168c2c02570cb814f' as `0x${string}`,
  // Debt tokens
  debtUSDC:              '0x4a679253410272dd5232b3ff7cf5dbb88f295319' as `0x${string}`,
  debtWETH:              '0x09635f643e140090a9a8dcd712ed6285858cebef' as `0x${string}`,

  // ── GoodSwap — deployed to devnet (chain 42069), 2026-04-03 ──────────────
  PoolManager:           '0xC9a43158891282A2B1475592D5719c001986Aaec' as `0x${string}`,
  GoodSwapRouter:        '0xaC9fCBA56E42d5960f813B9D0387F3D3bC003338' as `0x${string}`,
  // GoodSwap Liquidity Pools
  SwapPoolGdWeth:        '0xA4899D35897033b927acFCf422bc745916139776' as `0x${string}`,
  SwapPoolGdUsdc:        '0xf953b3A269d80e3eB0F2947630Da976B896A8C5b' as `0x${string}`,
  SwapPoolWethUsdc:      '0xAA292E8611aDF267e563f334Ee42320aC96D0463' as `0x${string}`,
  // GoodSwap pool tokens (devnet mocks)
  SwapGD:                '0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb' as `0x${string}`,
  SwapWETH:              '0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9' as `0x${string}`,
  SwapUSDC:              '0x4631BCAbD6dF18D94796344963cB60d44a4136b6' as `0x${string}`,

  // ── GoodPerps — deployed to devnet (chain 42069), 2026-04-03 ─────────────
  PerpEngine:            '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as `0x${string}`,
  MarginVault:           '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as `0x${string}`,
  FundingRate:           '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as `0x${string}`,
  PerpPriceOracle:       '0x286B8DecD5ED79c962b2d8F4346CD97FF0E2C352' as `0x${string}`,

  // ── GoodStocks — redeployed with 12 synthetic stocks (chain 42069), 2026-04-03
  StocksPriceOracle:     '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A' as `0x${string}`,
  CollateralVault:       '0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5' as `0x${string}`,
  SyntheticAssetFactory: '0xd9140951d8aE6E5F625a02F5908535e16e3af964' as `0x${string}`,
  // Synthetic stock tokens (sToken ERC-20s)
  sAAPL:                 '0x9587cd15faa3E816127F4FDaE090c40Dd5248Af6' as `0x${string}`,
  sTSLA:                 '0x50BF91221d69370f534a8898159A80b1CBd12B72' as `0x${string}`,
  sNVDA:                 '0x59ed2002eDA2BbF12fdD28755A28638eb90b1a41' as `0x${string}`,
  sMSFT:                 '0x2AB7856411662E5c3452BFa63fFB626e2594C088' as `0x${string}`,
  sAMZN:                 '0x43cA2d043964cFde45405367036f9eC991301918' as `0x${string}`,
  sGOOGL:                '0xf2Da7A9324397eBe46b5fA2eCf2C2852afece06b' as `0x${string}`,
  sMETA:                 '0xbbE5C4aDb5170717b658550c2e5cA49C791E4ca5' as `0x${string}`,
  sJPM:                  '0x0aD41337532BfedCa58815b13cF8960fCabD9975' as `0x${string}`,
  sV:                    '0xf17726B913d04950D62A79CFc141a8D090344791' as `0x${string}`,
  sDIS:                  '0x60039b5e160972673B5865CE82DfEeE35D8e94a6' as `0x${string}`,
  sNFLX:                 '0x63dF691A295f0c59980bC0B388B26E897885C603' as `0x${string}`,
  sAMD:                  '0xeBE18012222d1bDdA9eaFeD66d3259c11fbebd61' as `0x${string}`,

  // ── GoodStable — CDP vault system (chain 42069), redeployed 2026-04-03 ─────
  gUSD:                  '0x0e801d84fa97b50751dbf25036d067dcf18858bf' as `0x${string}`,
  VaultManager:          '0xe039608E695D21aB11675EBBA00261A0e750526c' as `0x${string}`,
  CollateralRegistry:    '0x9d4454b023096f34b160d6b654540c56a1f81688' as `0x${string}`,
  // GoodStable collateral tokens (separate from GoodLend mocks)
  StableMockWETH:        '0x851356ae760d987e095750cceb3bc6014560891c' as `0x${string}`,
  StableMockUSDC:        '0xf5059a5d33d5853360d16c683c16e67980206f36' as `0x${string}`,
  StableMockGD:          '0x95401dc811bb5740090279ba06cfa8fcf6113778' as `0x${string}`,
} as const

/**
 * @deprecated Use CONTRACTS instead. Kept for backward compatibility.
 */
export const DEVNET_CONTRACTS = CONTRACTS

// ─── ABIs ─────────────────────────────────────────────────────────────────────
// Re-exported from abi.ts so all consumers can import both addresses and ABIs
// from a single module.

export {
  GoodDollarTokenABI,
  MarketFactoryABI,
  ConditionalTokensABI,
  UBIFeeHookABI,
  GoodLendPoolABI,
  PerpEngineABI,
  CollateralVaultABI,
  SyntheticAssetFactoryABI,
  MarginVaultABI,
  FundingRateABI,
  ERC20ABI,
  GoodLendPriceOracleABI,
  PriceOracleABI,
  VaultManagerABI,
  CollateralRegistryABI,
  GoodPoolABI,
  GoodSwapRouterABI,
} from './abi'
