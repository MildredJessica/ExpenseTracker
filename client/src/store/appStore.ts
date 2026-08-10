import { create } from 'zustand'
import type { Expense, Budget, ExpenseInput, BudgetInput } from '@/types'
import type { ApiClient } from '@/lib/api'

interface AppState {
  expenses: Expense[]
  budgets: Budget[]
  loading: boolean
  error: string | null

  loadAll: (api: ApiClient) => Promise<void>
  addExpense: (api: ApiClient, input: ExpenseInput) => Promise<void>
  editExpense: (api: ApiClient, id: string, input: Partial<ExpenseInput>) => Promise<void>
  removeExpense: (api: ApiClient, id: string) => Promise<void>
  removeExpenses: (api: ApiClient, ids: string[]) => Promise<void>
  saveBudget: (api: ApiClient, input: BudgetInput) => Promise<void>
  removeBudget: (api: ApiClient, id: string) => Promise<void>
  clearError: () => void
}

export const useStore = create<AppState>((set) => ({
  expenses: [],
  budgets: [],
  loading: false,
  error: null,

  loadAll: async (api) => {
    set({ loading: true, error: null })
    try {
      const [{ expenses }, budgets] = await Promise.all([
        api.expenses.list(),
        api.budgets.list(),
      ])
      set({ expenses, budgets, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  addExpense: async (api, input) => {
    try {
      const expense = await api.expenses.create(input)
      set((s) => ({ expenses: [expense, ...s.expenses] }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  editExpense: async (api, id, input) => {
    try {
      const updated = await api.expenses.update(id, input)
      set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  removeExpense: async (api, id) => {
    try {
      await api.expenses.delete(id)
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  removeExpenses: async (api, ids) => {
    try {
      await api.expenses.deleteBulk(ids)
      set((s) => ({ expenses: s.expenses.filter((e) => !ids.includes(e.id)) }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  saveBudget: async (api, input) => {
    try {
      const budget = await api.budgets.upsert(input)
      set((s) => {
        const idx = s.budgets.findIndex((b) => b.category === input.category)
        if (idx >= 0) {
          const updated = [...s.budgets]
          updated[idx] = budget
          return { budgets: updated }
        }
        return { budgets: [...s.budgets, budget] }
      })
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  removeBudget: async (api, id) => {
    try {
      await api.budgets.delete(id)
      set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
