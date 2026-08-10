import { useState, useMemo } from 'react'
import { Pencil, Trash2, Download, Plus, Search } from 'lucide-react'
import {
  Button, Badge, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/index'
import { ExpenseForm } from './ExpenseForm'
import { useStore } from '@/store/appStore'
import { useApi } from '@/lib/apiContext'
import { CATEGORIES, getCategoryConfig } from '@/lib/categories'
import { formatCurrency, formatDate, exportToCSV } from '@/lib/formatters'
import { toast } from '@/hooks/useToast'
import type { Expense, Category } from '@/types'

export function ExpenseTable() {
  const api = useApi()
  const { expenses, removeExpense, removeExpenses } = useStore()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => expenses.filter((e) => {
    const matchSearch = !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.merchant ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || e.category === catFilter
    return matchSearch && matchCat
  }), [expenses, search, catFilter])

  const toggleSelect = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((e) => e.id)))

  const handleBulkDelete = async () => {
    try {
      await removeExpenses(api, [...selected])
      toast({ variant: 'success', title: `Deleted ${selected.size} expenses` })
      setSelected(new Set())
    } catch (err) {
      toast({ variant: 'destructive', title: 'Delete failed', description: (err as Error).message })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeExpense(api, id)
      toast({ variant: 'success', title: 'Expense deleted' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Delete failed', description: (err as Error).message })
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v as Category | 'all')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete {selected.size}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)}>
          <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <ExpenseForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="h-4 w-4 rounded border-input" />
              </th>
              {['Date', 'Description', 'Category', 'Amount', 'Actions'].map((h) => (
                <th key={h} className={`px-4 py-3 font-medium text-muted-foreground ${h === 'Amount' || h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No expenses found</td></tr>
            ) : filtered.map((expense) => {
              const cat = getCategoryConfig(expense.category)
              return (
                <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(expense.id)}
                      onChange={() => toggleSelect(expense.id)} className="h-4 w-4 rounded border-input" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{expense.description}</div>
                    {expense.merchant && <div className="text-xs text-muted-foreground">{expense.merchant}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="gap-1 text-xs" style={{ borderColor: cat.color + '40', color: cat.color }}>
                      {cat.emoji} {cat.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(expense)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
                          {editTarget && <ExpenseForm expense={editTarget} onSuccess={() => setEditTarget(null)} />}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {expenses.length} expenses</p>
    </div>
  )
}
