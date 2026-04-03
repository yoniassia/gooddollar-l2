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
} as const
