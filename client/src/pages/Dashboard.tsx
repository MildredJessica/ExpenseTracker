import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { TrendingUp, Receipt, DollarSign, BarChart3, Plus, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/index'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { useStore } from '@/store/appStore'
import { useApi } from '@/lib/apiContext'
import { getCategoryConfig } from '@/lib/categories'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { MonthlyStats } from '@/types'

export function Dashboard() {
  const { user } = useUser()
  const api = useApi()
  const { expenses, budgets } = useStore()
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [prevStats, setPrevStats] = useState<MonthlyStats | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    Promise.all([
      api.stats.monthly(),
      api.stats.monthly(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`),
    ]).then(([cur, p]) => { setStats(cur); setPrevStats(p) })
  }, [api])

  const monthChange = stats && prevStats && prevStats.total > 0
    ? ((stats.total - prevStats.total) / prevStats.total) * 100 : 0

  const statCards = [
    { title: 'This month', value: stats ? formatCurrency(stats.total) : '—', sub: monthChange !== 0 ? `${monthChange > 0 ? '+' : ''}${monthChange.toFixed(1)}% vs last month` : 'First month', icon: DollarSign, up: monthChange > 0 },
    { title: 'Transactions', value: stats?.count.toString() ?? '—', sub: 'This month', icon: Receipt, up: false },
    { title: 'Daily average', value: stats ? formatCurrency(stats.avg_per_day) : '—', sub: 'This month', icon: TrendingUp, up: false },
    { title: 'All time', value: expenses.length.toString(), sub: 'Total expenses', icon: BarChart3, up: false },
  ]

  const recentExpenses = expenses.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {user?.firstName ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's your spending overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/scanner"><ScanLine className="mr-2 h-4 w-4" />Scan receipt</Link>
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <ExpenseForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-1 font-display text-2xl font-bold">{card.value}</p>
                  <p className={`mt-1 text-xs ${card.up ? 'text-destructive' : 'text-muted-foreground'}`}>{card.sub}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget alerts */}
      {budgets.length > 0 && stats && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Budget status</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const spent = stats.by_category[budget.category] ?? 0
              const pct = Math.min((spent / budget.monthly_limit) * 100, 100)
              const cat = getCategoryConfig(budget.category)
              const isOver = spent > budget.monthly_limit
              const isWarning = pct >= 80
              return (
                <Card key={budget.id} className={isOver ? 'border-destructive/50' : ''}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium">{cat.emoji} {cat.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOver ? 'bg-destructive/10 text-destructive' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-secondary-foreground'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        background: isOver ? 'hsl(var(--destructive))' : isWarning ? '#f59e0b' : cat.color,
                      }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(spent)} of {formatCurrency(budget.monthly_limit)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent expenses</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/expenses">View all</Link></Button>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No expenses yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => {
                const cat = getCategoryConfig(expense.category)
                return (
                  <div key={expense.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: cat.color + '20' }}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                    </div>
                    <p className="font-mono text-sm font-medium">{formatCurrency(expense.amount)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
