import { format, parseISO } from 'date-fns'
import type { Expense } from '@/types'

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const formatDate = (d: string) => format(parseISO(d), 'MMM d, yyyy')
export const formatDateShort = (d: string) => format(parseISO(d), 'MMM d')
export const formatMonth = (d: Date) => format(d, 'MMMM yyyy')

export const exportToCSV = (expenses: Expense[], filename = 'expenses.csv') => {
  const headers = ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Notes']
  const rows = expenses.map((e) => [
    formatDate(e.date),
    `"${e.description}"`,
    `"${e.merchant ?? ''}"`,
    e.category,
    e.amount.toFixed(2),
    `"${e.notes ?? ''}"`,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
