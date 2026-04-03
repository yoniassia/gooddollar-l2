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
  // GoodSwap Liquidity Pools — deployed 2026-04-03
  SwapPoolGdWeth: '0xA4899D35897033b927acFCf422bc745916139776' as `0x${string}`,
  SwapPoolGdUsdc: '0xf953b3A269d80e3eB0F2947630Da976B896A8C5b' as `0x${string}`,
  SwapPoolWethUsdc: '0xAA292E8611aDF267e563f334Ee42320aC96D0463' as `0x${string}`,
  // GoodSwap pool tokens (devnet mocks for swap pools)
  SwapGD: '0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb' as `0x${string}`,
  SwapWETH: '0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9' as `0x${string}`,
  SwapUSDC: '0x4631BCAbD6dF18D94796344963cB60d44a4136b6' as `0x${string}`,
  // GoodPerps — deployed to devnet (chain 42069), 2026-04-03
  PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as `0x${string}`,
  MarginVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as `0x${string}`,
  // GoodStocks — redeployed with 12 synthetic stocks (chain 42069), 2026-04-03
  StocksPriceOracle: '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A' as `0x${string}`,
  CollateralVault: '0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb' as `0x${string}`,
  SyntheticAssetFactory: '0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82' as `0x${string}`,
  // Synthetic stock tokens (sToken ERC-20s)
  sAAPL: '0x5F6470D65d82C4fCFd5b7245D76A9011158ad142' as `0x${string}`,
  sTSLA: '0xD98678105A4B298890Eb35FfBC2d3b02357413Ec' as `0x${string}`,
  sNVDA: '0xAD2fCF4dB5988EF8616BB5FC021E4Ab5B4C77281' as `0x${string}`,
  sMSFT: '0xA3cBDaB80f473875690b39546A19b8d493eCdb37' as `0x${string}`,
  sAMZN: '0xFC3A93EDFBFeAF455cf79CFf6ce0aF0ca7bA01Fd' as `0x${string}`,
  sGOOGL: '0x827dcE508AAF3b8Da694Cc514bf99085BC94E0CA' as `0x${string}`,
  sMETA: '0x701aA107682f48Cd6dCca8728C7581A0e5A13780' as `0x${string}`,
  sJPM: '0x0b10EE0e963813855a4F8e5BDd9d6A24b458c2dA' as `0x${string}`,
  sV: '0x272b149aD31CBA25Ce3851440dbf9Cf6B087b068' as `0x${string}`,
  sDIS: '0x655431725d19dC597Ac2CE297AC664CEd7DfC980' as `0x${string}`,
  sNFLX: '0xf90FB57e62f8D65Ddd67C4EbE11E42B108a505D1' as `0x${string}`,
  sAMD: '0x9Ae8284C2404243c88CB31dF652F0c36144d7CFc' as `0x${string}`,
  // GoodStable — CDP vault system (chain 42069), deployed 2026-04-03
  gUSD: '0x0e801d84fa97b50751dbf25036d067dcf18858bf' as `0x${string}`,
  VaultManager: '0x5eb3bc0a489c5a8288765d2336659ebca68fcd00' as `0x${string}`,
  CollateralRegistry: '0x9d4454b023096f34b160d6b654540c56a1f81688' as `0x${string}`,
  // GoodStable collateral tokens (separate from GoodLend mocks)
  StableMockWETH: '0x851356ae760d987e095750cceb3bc6014560891c' as `0x${string}`,
  StableMockUSDC: '0xf5059a5d33d5853360d16c683c16e67980206f36' as `0x${string}`,
  StableMockGD: '0x95401dc811bb5740090279ba06cfa8fcf6113778' as `0x${string}`,
} as const
