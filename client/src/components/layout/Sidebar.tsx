import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, ScanLine, Settings, TrendingUp, PiggyBank } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/scanner', icon: ScanLine, label: 'Scan Receipt' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Receipt className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">Expensify</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">My Account</p>
            <p className="truncate text-xs text-muted-foreground">Manage profile</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
