'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { gooddollarL2 } from './chain'

export const config = getDefaultConfig({
  appName: 'GoodDollar',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'goodswap-dev',
  chains: [gooddollarL2],
  ssr: true,
})
