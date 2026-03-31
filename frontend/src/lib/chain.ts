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
      http: ['http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'http://localhost:4000' },
  },
  testnet: true,
})

export const CONTRACTS = {
  GoodDollarToken: '0x4200000000000000000000000000000000000100' as `0x${string}`,
  UBIFeeSplitter: '0x4200000000000000000000000000000000000101' as `0x${string}`,
  ValidatorStaking: '0x4200000000000000000000000000000000000102' as `0x${string}`,
  UBIFeeHook: '0x4200000000000000000000000000000000000103' as `0x${string}`,
} as const
