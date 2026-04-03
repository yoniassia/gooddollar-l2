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
  // GoodPerps — PerpEngine (TODO: deploy to devnet, update address)
  PerpEngine: null as `0x${string}` | null,
  MarginVault: null as `0x${string}` | null,
  // GoodStocks — PriceOracle, CollateralVault + SyntheticAssetFactory
  // Run `forge script script/DeployGoodStocks.s.sol` and paste addresses below.
  StocksPriceOracle: null as `0x${string}` | null,
  CollateralVault: null as `0x${string}` | null,
  SyntheticAssetFactory: null as `0x${string}` | null,
} as const
