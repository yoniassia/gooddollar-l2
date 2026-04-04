/**
 * Contract ABIs for all GoodDollar L2 protocols
 * Extracted from frontend/src/lib/abi.ts — canonical source
 */
export const ERC20ABI = [
    { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
export const PerpEngineABI = [
    { inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'size', type: 'uint256' }, { name: 'isLong', type: 'bool' }, { name: 'minPrice', type: 'uint256' }], name: 'openPosition', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }], name: 'closePosition', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }], name: 'markets', outputs: [{ name: 'key', type: 'bytes32' }, { name: 'maxLeverage', type: 'uint256' }, { name: 'isActive', type: 'bool' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'marketCount', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }, { name: 'marketId', type: 'uint256' }], name: 'positions', outputs: [{ name: 'size', type: 'uint256' }, { name: 'entryPrice', type: 'uint256' }, { name: 'isLong', type: 'bool' }, { name: 'collateral', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }, { name: 'marketId', type: 'uint256' }], name: 'unrealizedPnL', outputs: [{ name: '', type: 'int256' }], stateMutability: 'view', type: 'function' },
];
export const MarketFactoryABI = [
    { inputs: [{ name: 'question', type: 'string' }, { name: 'endTime', type: 'uint256' }, { name: 'resolver', type: 'address' }], name: 'createMarket', outputs: [{ name: 'marketId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'isYES', type: 'bool' }, { name: 'amount', type: 'uint256' }], name: 'buy', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], name: 'redeem', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }], name: 'getMarket', outputs: [{ name: 'question', type: 'string' }, { name: 'endTime', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'totalYES', type: 'uint256' }, { name: 'totalNO', type: 'uint256' }, { name: 'collateral', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'marketCount', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'marketId', type: 'uint256' }], name: 'impliedProbabilityYES', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
export const GoodLendPoolABI = [
    { inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'supply', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'withdraw', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'borrow', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'repay', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }], name: 'getUserAccountData', outputs: [{ name: 'healthFactor', type: 'uint256' }, { name: 'totalCollateralUSD', type: 'uint256' }, { name: 'totalDebtUSD', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'asset', type: 'address' }], name: 'getReserveData', outputs: [{ name: 'totalDeposits', type: 'uint256' }, { name: 'totalBorrows', type: 'uint256' }, { name: 'liquidityIndex', type: 'uint256' }, { name: 'borrowIndex', type: 'uint256' }, { name: 'supplyRate', type: 'uint256' }, { name: 'borrowRate', type: 'uint256' }, { name: 'accruedToTreasury', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
export const CollateralVaultABI = [
    { inputs: [{ name: 'ticker', type: 'string' }, { name: 'collateralAmount', type: 'uint256' }, { name: 'syntheticAmount', type: 'uint256' }], name: 'depositAndMint', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }], name: 'burn', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'ticker', type: 'string' }, { name: 'amount', type: 'uint256' }], name: 'withdrawCollateral', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }, { name: 'ticker', type: 'string' }], name: 'getPosition', outputs: [{ name: 'userCollateral', type: 'uint256' }, { name: 'userDebt', type: 'uint256' }, { name: 'ratio', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }, { name: 'ticker', type: 'string' }], name: 'getCollateralRatio', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
export const SyntheticAssetFactoryABI = [
    { inputs: [{ name: 'ticker', type: 'string' }], name: 'getAsset', outputs: [{ name: 'tokenAddress', type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'allTickers', outputs: [{ name: '', type: 'string[]' }], stateMutability: 'view', type: 'function' },
];
export const MarginVaultABI = [
    { inputs: [{ name: 'amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'amount', type: 'uint256' }], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }], name: 'balances', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
export const UBIFeeHookABI = [
    { inputs: [{ name: 'amount', type: 'uint256' }], name: 'calculateUBIFee', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSwapsProcessed', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'token', type: 'address' }], name: 'totalUBIFees', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];
