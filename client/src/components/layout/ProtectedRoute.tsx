import { useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ApiProvider } from '@/lib/apiContext'
import { useStore } from '@/store/appStore'
import { useApi } from '@/lib/apiContext'

function DataLoader({ children }: { children: React.ReactNode }) {
  const api = useApi()
  const loadAll = useStore((s) => s.loadAll)

  useEffect(() => {
    loadAll(api)
  }, [api])

  return <>{children}</>
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return (
    <ApiProvider>
      <DataLoader>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="ml-64 flex-1 overflow-y-auto bg-background">
            <div className="min-h-full p-8 animate-fade-in">{children}</div>
          </main>
        </div>
      </DataLoader>
    </ApiProvider>
  )
}
