import { defineChain } from 'viem'

export const gooddollarL2 = defineChain({
  id: 42069,
  name: 'GoodDollar L2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.goodclaw.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://explorer.goodclaw.org' },
  },
  testnet: true,
})

export const CONTRACTS = {
  GoodDollarToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
  UBIFeeSplitter: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
  ValidatorStaking: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
  UBIFeeHook: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
  MarketFactory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as `0x${string}`,
  ConditionalTokens: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6' as `0x${string}`,
  // GoodLend — devnet (chain 42069), deployed 2026-04-03
  GoodLendPool: '0x322813fd9a801c5507c9de605d63cea4f2ce6c44' as `0x${string}`,
  GoodLendPriceOracle: '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae' as `0x${string}`,
  GoodLendInterestRateModel: '0xc6e7df5e7b4f2a278906862b61205850344d4e7d' as `0x${string}`,
  // GoodLend reserve tokens
  MockUSDC: '0x0b306bf915c4d645ff596e518faf3f9669b97016' as `0x${string}`,
  MockWETH: '0x959922be3caee4b8cd9a407cc3ac1c251c2007b1' as `0x${string}`,
  // gTokens (interest-bearing)
  gUSDC: '0xa85233c63b9ee964add6f2cffe00fd84eb32338f' as `0x${string}`,
  gWETH: '0x7a2088a1bfc9d81c55368ae168c2c02570cb814f' as `0x${string}`,
  // Debt tokens
  debtUSDC: '0x4a679253410272dd5232b3ff7cf5dbb88f295319' as `0x${string}`,
  debtWETH: '0x09635f643e140090a9a8dcd712ed6285858cebef' as `0x${string}`,
  // GoodSwap — deployed to devnet (chain 42069), 2026-04-03
  PoolManager: '0xC9a43158891282A2B1475592D5719c001986Aaec' as `0x${string}`,
  GoodSwapRouter: '0x1c85638e118b37167e9298c2268758e058DdfDA0' as `0x${string}`,
  // GoodPerps — deployed to devnet (chain 42069), 2026-04-03
  PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as `0x${string}`,
  MarginVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as `0x${string}`,
  // GoodStocks — deployed to devnet (chain 42069), 2026-04-03
  StocksPriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F' as `0x${string}`,
  CollateralVault: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' as `0x${string}`,
  SyntheticAssetFactory: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788' as `0x${string}`,
  // GoodStable — CDP vault system (chain 42069), deployed 2026-04-03
  gUSD: '0x0e801d84fa97b50751dbf25036d067dcf18858bf' as `0x${string}`,
  VaultManager: '0x5eb3bc0a489c5a8288765d2336659ebca68fcd00' as `0x${string}`,
  CollateralRegistry: '0x9d4454b023096f34b160d6b654540c56a1f81688' as `0x${string}`,
  // GoodStable collateral tokens (separate from GoodLend mocks)
  StableMockWETH: '0x851356ae760d987e095750cceb3bc6014560891c' as `0x${string}`,
  StableMockUSDC: '0xf5059a5d33d5853360d16c683c16e67980206f36' as `0x${string}`,
  StableMockGD: '0x95401dc811bb5740090279ba06cfa8fcf6113778' as `0x${string}`,
} as const
