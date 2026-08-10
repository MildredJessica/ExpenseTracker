import { supabaseAdmin } from '../db/supabase'
import { AppError } from '../middleware/errorHandler'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

export const statsService = {
  async monthly(userId: string, month: Date) {
    const from = format(startOfMonth(month), 'yyyy-MM-dd')
    const to = format(endOfMonth(month), 'yyyy-MM-dd')

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('amount, category, date')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)

    if (error) throw new AppError(500, error.message)
    const expenses = data ?? []

    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const byCategory: Record<string, number> = {}
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
    }

    const daysInMonth = endOfMonth(month).getDate()
    return {
      total,
      count: expenses.length,
      avg_per_day: total / daysInMonth,
      by_category: byCategory,
      period: { from, to },
    }
  },

  async trend(userId: string, months = 6) {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const month = subMonths(new Date(), i)
      const from = format(startOfMonth(month), 'yyyy-MM-dd')
      const to = format(endOfMonth(month), 'yyyy-MM-dd')

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', from)
        .lte('date', to)

      if (error) throw new AppError(500, error.message)
      const total = (data ?? []).reduce((s, e) => s + e.amount, 0)
      results.push({ month: format(month, 'MMM yyyy'), total, count: (data ?? []).length })
    }
    return results
  },

  async daily(userId: string, days = 30) {
    const from = format(subMonths(new Date(), 1), 'yyyy-MM-dd')
    const to = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)

    if (error) throw new AppError(500, error.message)

    // Build a map of date -> total
    const map: Record<string, number> = {}
    for (const e of data ?? []) {
      map[e.date] = (map[e.date] ?? 0) + e.amount
    }

    // Fill every day in range (including zeros)
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = format(d, 'yyyy-MM-dd')
      result.push({ date: key, label: format(d, 'MMM d'), total: map[key] ?? 0 })
    }
    return result
  },
}
