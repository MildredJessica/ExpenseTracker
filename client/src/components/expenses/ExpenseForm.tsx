import { useState } from 'react'
import { format } from 'date-fns'
import {
  Button, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/index'
import { useStore } from '@/store/appStore'
import { useApi } from '@/lib/apiContext'
import { CATEGORIES } from '@/lib/categories'
import { toast } from '@/hooks/useToast'
import type { Expense, ExpenseInput, Category } from '@/types'

interface Props {
  expense?: Expense
  prefill?: Partial<ExpenseInput>
  onSuccess?: () => void
}

export function ExpenseForm({ expense, prefill, onSuccess }: Props) {
  const api = useApi()
  const { addExpense, editExpense } = useStore()
  const isEditing = !!expense

  const [form, setForm] = useState<ExpenseInput>({
    amount: expense?.amount ?? prefill?.amount ?? 0,
    description: expense?.description ?? prefill?.description ?? '',
    category: expense?.category ?? prefill?.category ?? 'other',
    date: expense?.date ?? prefill?.date ?? format(new Date(), 'yyyy-MM-dd'),
    merchant: expense?.merchant ?? prefill?.merchant ?? '',
    notes: expense?.notes ?? prefill?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof ExpenseInput>(key: K, val: ExpenseInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Enter an amount greater than 0.' })
      return
    }
    setLoading(true)
    try {
      if (isEditing) {
        await editExpense(api, expense.id, form)
        toast({ variant: 'success', title: 'Expense updated' })
      } else {
        await addExpense(api, form)
        toast({ variant: 'success', title: 'Expense added' })
      }
      onSuccess?.()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00"
            value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={form.date}
            onChange={(e) => set('date', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="What was this for?" value={form.description}
          onChange={(e) => set('description', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v as Category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2"><span>{c.emoji}</span><span>{c.label}</span></span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant</Label>
          <Input id="merchant" placeholder="Store name" value={form.merchant ?? ''}
            onChange={(e) => set('merchant', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" placeholder="Optional notes..." value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{isEditing ? 'Updating...' : 'Adding...'}</span>
          : isEditing ? 'Update Expense' : 'Add Expense'}
      </Button>
    </form>
  )
}
