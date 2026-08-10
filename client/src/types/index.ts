export type Category =
  | 'food' | 'transport' | 'shopping' | 'entertainment'
  | 'health' | 'utilities' | 'housing' | 'travel' | 'education' | 'other'

export interface Expense {
  id: string
  user_id: string
  amount: number
  description: string
  category: Category
  date: string
  merchant?: string
  receipt_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExpenseInput {
  amount: number
  description: string
  category: Category
  date: string
  merchant?: string
  receipt_url?: string
  notes?: string
}

export interface Budget {
  id: string
  user_id: string
  category: Category
  monthly_limit: number
  created_at: string
}

export interface BudgetInput {
  category: Category
  monthly_limit: number
}

export interface MonthlyStats {
  total: number
  count: number
  avg_per_day: number
  by_category: Record<Category, number>
  period: { from: string; to: string }
}

export interface DailyStat {
  date: string
  label: string
  total: number
}

export interface TrendStat {
  month: string
  total: number
  count: number
}

export interface ScannedReceipt {
  merchant?: string
  amount?: number
  date?: string
  description?: string
  raw_text: string
  confidence: number
}
