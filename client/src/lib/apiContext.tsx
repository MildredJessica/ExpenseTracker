import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createApiClient, type ApiClient } from '@/lib/api'

const ApiContext = createContext<ApiClient | null>(null)

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()

  const api = useMemo(
    () => createApiClient(() => getToken().then((t) => t ?? '')),
    [getToken]
  )

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi(): ApiClient {
  const ctx = useContext(ApiContext)
  if (!ctx) throw new Error('useApi must be used within ApiProvider')
  return ctx
}
