import { useEffect, useState } from 'react'
import { Plus, Trash2, PiggyBank } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/index'
import { useStore } from '@/store/appStore'
import { useApi } from '@/lib/apiContext'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'
import { formatCurrency } from '@/lib/formatters'
import { toast } from '@/hooks/useToast'
import type { Category, MonthlyStats } from '@/types'

function BudgetForm({ onSuccess }: { onSuccess: () => void }) {
  const api = useApi()
  const { budgets, saveBudget } = useStore()
  const [category, setCategory] = useState<Category>('food')
  const [limit, setLimit] = useState('')
  const [loading, setLoading] = useState(false)

  const used = new Set(budgets.map((b) => b.category))
  const available = CATEGORIES.filter((c) => !used.has(c.value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!limit) return
    setLoading(true)
    try {
      await saveBudget(api, { category, monthly_limit: parseFloat(limit) })
      toast({ variant: 'success', title: 'Budget saved' })
      onSuccess()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to save', description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {available.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="limit">Monthly limit ($)</Label>
        <Input id="limit" type="number" min="1" step="0.01" placeholder="e.g. 500"
          value={limit} onChange={(e) => setLimit(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading || available.length === 0}>
        {loading ? 'Saving...' : 'Set Budget'}
      </Button>
      {available.length === 0 && <p className="text-xs text-center text-muted-foreground">All categories already have budgets.</p>}
    </form>
  )
}

export function Budgets() {
  const api = useApi()
  const { budgets, removeBudget } = useStore()
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => { api.stats.monthly().then(setStats) }, [api])

  const handleDelete = async (id: string) => {
    try {
      await removeBudget(api, id)
      toast({ variant: 'success', title: 'Budget removed' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="mt-1 text-muted-foreground">Set monthly spending limits per category</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set monthly budget</DialogTitle></DialogHeader>
            <BudgetForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <PiggyBank className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold">No budgets yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Create monthly spending limits to track your goals.
            </p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Set your first budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spent = stats?.by_category[budget.category] ?? 0
            const pct = Math.min((spent / budget.monthly_limit) * 100, 100)
            const cat = getCategoryConfig(budget.category)
            const isOver = spent > budget.monthly_limit
            const isWarning = pct >= 80
            const remaining = budget.monthly_limit - spent

            return (
              <Card key={budget.id} className={isOver ? 'border-destructive/50 bg-destructive/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: cat.color + '20' }}>
                        {cat.emoji}
                      </div>
                      <div>
                        <CardTitle className="text-base">{cat.label}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {isOver ? '⚠️ Over budget' : isWarning ? '⚡ Almost there' : '✓ On track'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(budget.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-mono font-medium">{formatCurrency(spent)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${pct}%`,
                        background: isOver ? 'hsl(var(--destructive))' : isWarning ? '#f59e0b' : cat.color,
                      }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct.toFixed(0)}% used</span>
                      <span>Limit: {formatCurrency(budget.monthly_limit)}</span>
                    </div>
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${isOver ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
                    {isOver ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(remaining)} remaining`}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
