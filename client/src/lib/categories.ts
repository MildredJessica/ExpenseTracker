import type { Category } from '@/types'

export const CATEGORIES: { value: Category; label: string; color: string; emoji: string }[] = [
  { value: 'food',          label: 'Food & Dining',   color: '#f97316', emoji: '🍽️' },
  { value: 'transport',     label: 'Transport',        color: '#3b82f6', emoji: '🚗' },
  { value: 'shopping',      label: 'Shopping',         color: '#a855f7', emoji: '🛍️' },
  { value: 'entertainment', label: 'Entertainment',    color: '#ec4899', emoji: '🎬' },
  { value: 'health',        label: 'Health',           color: '#ef4444', emoji: '💊' },
  { value: 'utilities',     label: 'Utilities',        color: '#6366f1', emoji: '⚡' },
  { value: 'housing',       label: 'Housing',          color: '#84cc16', emoji: '🏠' },
  { value: 'travel',        label: 'Travel',           color: '#06b6d4', emoji: '✈️' },
  { value: 'education',     label: 'Education',        color: '#f59e0b', emoji: '📚' },
  { value: 'other',         label: 'Other',            color: '#6b7280', emoji: '📦' },
]

export const getCategoryConfig = (cat: Category) =>
  CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]
