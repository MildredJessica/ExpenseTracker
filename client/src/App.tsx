import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Dashboard }   from '@/pages/Dashboard'
import { Expenses }    from '@/pages/Expenses'
import { Scanner }     from '@/pages/Scanner'
import { Analytics }   from '@/pages/Analytics'
import { Budgets }     from '@/pages/Budgets'
import { Settings }    from '@/pages/Settings'
import { SignInPage }  from '@/pages/SignIn'
import { SignUpPage }  from '@/pages/SignUp'
import { Toaster }     from '@/components/ui/toaster'

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/"          element={protect(<Dashboard />)} />
        <Route path="/expenses"  element={protect(<Expenses />)} />
        <Route path="/scanner"   element={protect(<Scanner />)} />
        <Route path="/analytics" element={protect(<Analytics />)} />
        <Route path="/budgets"   element={protect(<Budgets />)} />
        <Route path="/settings"  element={protect(<Settings />)} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
