import { useStore } from '@/store/appStore'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { formatCurrency } from '@/lib/formatters'

export function Expenses() {
  const { expenses, loading } = useStore()
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="mt-1 text-muted-foreground">
          {expenses.length} total · {formatCurrency(total)} spent
        </p>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ExpenseTable />
      )}
    </div>
  )
}
