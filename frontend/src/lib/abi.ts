export const GoodDollarTokenABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const MarketFactoryABI = [
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolver', type: 'address' },
    ],
    name: 'createMarket',
    outputs: [{ name: 'marketId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'isYES', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'buy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'totalYES', type: 'uint256' },
      { name: 'totalNO', type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'impliedProbabilityYES',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ConditionalTokensABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'yesTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'noTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

export const UBIFeeHookABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'calculateUBIFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ubiFeeShareBPS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSwapsProcessed',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'totalUBIFees',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── GoodLendPool ABI (core lending operations) ───────────────────────────────
export const GoodLendPoolABI = [
  // supply
  {
    inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // withdraw
  {
    inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // borrow
  {
    inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // repay
  {
    inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'repay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // liquidate
  {
    inputs: [
      { name: 'collateralAsset', type: 'address' },
      { name: 'debtAsset', type: 'address' },
      { name: 'user', type: 'address' },
      { name: 'debtToCover', type: 'uint256' },
    ],
    name: 'liquidate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // getUserAccountData
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { name: 'healthFactor', type: 'uint256' },
      { name: 'totalCollateralUSD', type: 'uint256' },
      { name: 'totalDebtUSD', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // getReserveData
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'totalDeposits', type: 'uint256' },
      { name: 'totalBorrows', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'borrowIndex', type: 'uint256' },
      { name: 'supplyRate', type: 'uint256' },
      { name: 'borrowRate', type: 'uint256' },
      { name: 'accruedToTreasury', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // reserves mapping (public)
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'reserves',
    outputs: [
      { name: 'gToken', type: 'address' },
      { name: 'debtToken', type: 'address' },
      { name: 'reserveFactorBPS', type: 'uint256' },
      { name: 'ltvBPS', type: 'uint256' },
      { name: 'liquidationThresholdBPS', type: 'uint256' },
      { name: 'liquidationBonusBPS', type: 'uint256' },
      { name: 'supplyCap', type: 'uint256' },
      { name: 'borrowCap', type: 'uint256' },
      { name: 'decimals', type: 'uint8' },
      { name: 'isActive', type: 'bool' },
      { name: 'borrowingEnabled', type: 'bool' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'currentBorrowRate', type: 'uint256' },
      { name: 'currentSupplyRate', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
      { name: 'accruedToTreasury', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'asset', type: 'address' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Supply',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'asset', type: 'address' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Withdraw',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'asset', type: 'address' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Borrow',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'asset', type: 'address' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Repay',
    type: 'event',
  },
] as const

// ─── PerpEngine ABI (open/close positions, read markets + positions) ──────────
export const PerpEngineABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'size', type: 'uint256' },
      { name: 'isLong', type: 'bool' },
      { name: 'minPrice', type: 'uint256' },
    ],
    name: 'openPosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'closePosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { name: 'key', type: 'bytes32' },
      { name: 'maxLeverage', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'marketId', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { name: 'size', type: 'uint256' },
      { name: 'entryPrice', type: 'uint256' },
      { name: 'isLong', type: 'bool' },
      { name: 'collateral', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'marketId', type: 'uint256' }],
    name: 'marginRatio',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'marketId', type: 'uint256' }],
    name: 'unrealizedPnL',
    outputs: [{ name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── CollateralVault ABI (mint/burn synthetic assets, manage collateral) ──────
export const CollateralVaultABI = [
  {
    inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }],
    name: 'depositCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'ticker', type: 'string' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'syntheticAmount', type: 'uint256' },
    ],
    name: 'depositAndMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'ticker', type: 'string' },
      { name: 'syntheticAmount', type: 'uint256' },
      { name: 'additionalCollateral', type: 'uint256' },
    ],
    name: 'getMintRequirements',
    outputs: [
      { name: 'requiredCollateral', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'available', type: 'uint256' },
      { name: 'canMint', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }],
    name: 'withdrawCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'ticker', type: 'string' }],
    name: 'getPosition',
    outputs: [
      { name: 'userCollateral', type: 'uint256' },
      { name: 'userDebt', type: 'uint256' },
      { name: 'ratio', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'ticker', type: 'string' }],
    name: 'getCollateralRatio',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'ticker', type: 'bytes32', indexed: true },
      { name: 'syntheticAmount', type: 'uint256', indexed: false },
      { name: 'collateralUsed', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Burned',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'ticker', type: 'bytes32', indexed: true },
      { name: 'syntheticAmount', type: 'uint256', indexed: false },
      { name: 'collateralReturned', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
] as const

// ─── SyntheticAssetFactory ABI (list/get synthetic assets) ───────────────────
export const SyntheticAssetFactoryABI = [
  {
    inputs: [{ name: 'ticker', type: 'string' }],
    name: 'getAsset',
    outputs: [{ name: 'tokenAddress', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'key', type: 'bytes32' }],
    name: 'keyToTicker',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'listedCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'index', type: 'uint256' }],
    name: 'listedKeys',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── MarginVault ABI (deposit / withdraw / balances) ─────────────────────────
export const MarginVaultABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'balances',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── FundingRate ABI (read cumulative index + last funding time) ─────────────
export const FundingRateABI = [
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'cumulativeFundingIndex',
    outputs: [{ name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'lastFundingTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FUNDING_INTERVAL',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── ERC20 minimal ABI (approve + allowance + balanceOf) ─────────────────────
export const ERC20ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── GoodLend PriceOracle (Aave-style: getAssetPrice(address) → uint256, 8 dec) ─

export const GoodLendPriceOracleABI = [
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getAssetPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── GoodStocks PriceOracle ───────────────────────────────────────────────────

export const PriceOracleABI = [
  {
    inputs: [{ name: 'ticker', type: 'string' }],
    name: 'getPrice',
    outputs: [{ name: 'price', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ticker', type: 'string' }],
    name: 'hasFeed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxAge',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── GoodStable — VaultManager ────────────────────────────────────────────────

export const VaultManagerABI = [
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }, { name: 'owner', type: 'address' }],
    name: 'vaults',
    outputs: [
      { name: 'collateral', type: 'uint256' },
      { name: 'normalizedDebt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }],
    name: 'accumulators',
    outputs: [
      { name: 'chi', type: 'uint256' },
      { name: 'lastDrip', type: 'uint256' },
      { name: 'totalNormalizedDebt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }, { name: 'amount', type: 'uint256' }],
    name: 'depositCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }, { name: 'amount', type: 'uint256' }],
    name: 'withdrawCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }, { name: 'amount', type: 'uint256' }],
    name: 'mintGUSD',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }, { name: 'amount', type: 'uint256' }],
    name: 'repayGUSD',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// ─── GoodStable — CollateralRegistry ─────────────────────────────────────────

export const CollateralRegistryABI = [
  {
    inputs: [{ name: 'ilk', type: 'bytes32' }],
    name: 'getConfig',
    outputs: [
      {
        components: [
          { name: 'token', type: 'address' },
          { name: 'liquidationRatio', type: 'uint256' },
          { name: 'liquidationPenalty', type: 'uint256' },
          { name: 'debtCeiling', type: 'uint256' },
          { name: 'stabilityFeeRate', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ilkCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'ilkList',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ─── GoodPool (x*y=k AMM) ABI ──────────────────────────────────────────────
export const GoodPoolABI = [
  {
    inputs: [],
    name: 'tokenA',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenB',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveA',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveB',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalLiquidity',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'liquidity',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'spotPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    name: 'getAmountOut',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minOut', type: 'uint256' },
    ],
    name: 'swap',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [{ name: 'lp', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'lpAmount', type: 'uint256' }],
    name: 'removeLiquidity',
    outputs: [
      { name: 'outA', type: 'uint256' },
      { name: 'outB', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'trader', type: 'address' },
      { indexed: false, name: 'tokenIn', type: 'address' },
      { indexed: false, name: 'amountIn', type: 'uint256' },
      { indexed: false, name: 'amountOut', type: 'uint256' },
      { indexed: false, name: 'fee', type: 'uint256' },
    ],
    name: 'Swap',
    type: 'event',
  },
] as const

export const GoodSwapRouterABI = [
  {
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }],
    name: 'getAmountOut',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amountOut', type: 'uint256' }, { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }],
    name: 'getAmountIn',
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }],
    name: 'getPool',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'amountInMax', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapTokensForExactTokens',
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenIn', type: 'address' },
      { indexed: true, name: 'tokenOut', type: 'address' },
      { indexed: false, name: 'amountIn', type: 'uint256' },
      { indexed: false, name: 'amountOut', type: 'uint256' },
      { indexed: true, name: 'to', type: 'address' },
    ],
    name: 'Swap',
    type: 'event',
  },
] as const
