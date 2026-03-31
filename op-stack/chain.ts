/**
 * GoodDollar L2 chain definition for wagmi/viem.
 * Import this in the frontend to configure the chain.
 */
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
  contracts: {
    goodDollarToken: {
      address: '0x4200000000000000000000000000000000000100',
    },
    ubiFeeSplitter: {
      address: '0x4200000000000000000000000000000000000101',
    },
    validatorStaking: {
      address: '0x4200000000000000000000000000000000000102',
    },
    ubiFeeHook: {
      address: '0x4200000000000000000000000000000000000103',
    },
  },
  testnet: true,
})

export const CONTRACTS = {
  GoodDollarToken: '0x4200000000000000000000000000000000000100' as const,
  UBIFeeSplitter: '0x4200000000000000000000000000000000000101' as const,
  ValidatorStaking: '0x4200000000000000000000000000000000000102' as const,
  UBIFeeHook: '0x4200000000000000000000000000000000000103' as const,
} as const
