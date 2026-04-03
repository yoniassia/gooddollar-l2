'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WalletReadyContext } from '@/lib/WalletReadyContext'
import { TransactionProvider } from '@/lib/TransactionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionProvider>
        <WalletReadyContext.Provider value={true}>
          {children}
        </WalletReadyContext.Provider>
      </TransactionProvider>
    </QueryClientProvider>
  )
}
