'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useSyncExternalStore, lazy, Suspense } from 'react'
import { WalletReadyContext } from '@/lib/WalletReadyContext'
import { TransactionProvider } from '@/lib/TransactionContext'

const WalletProviders = lazy(() => import('./WalletProviders'))

const noop = () => () => {}

function WalletReadyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WalletReadyContext.Provider value={true}>
      {children}
    </WalletReadyContext.Provider>
  )
}

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
  const mounted = useSyncExternalStore(noop, () => true, () => false)

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionProvider>
        {mounted ? (
          <Suspense fallback={
            <WalletReadyContext.Provider value={false}>
              {children}
            </WalletReadyContext.Provider>
          }>
            <WalletProviders>
              <WalletReadyWrapper>
                {children}
              </WalletReadyWrapper>
            </WalletProviders>
          </Suspense>
        ) : (
          <WalletReadyContext.Provider value={false}>
            {children}
          </WalletReadyContext.Provider>
        )}
      </TransactionProvider>
    </QueryClientProvider>
  )
}
