import { supabaseAdmin } from '../db/supabase'
import { AppError } from '../middleware/errorHandler'

export interface BudgetInput {
  category: string
  monthly_limit: number
}

export const budgetService = {
  async list(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
    if (error) throw new AppError(500, error.message)
    return data ?? []
  },

  async upsert(userId: string, input: BudgetInput) {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .upsert({ ...input, user_id: userId }, { onConflict: 'user_id,category' })
      .select()
      .single()
    if (error) throw new AppError(500, error.message)
    return data
  },

  async delete(id: string, userId: string) {
    const { error, count } = await supabaseAdmin
      .from('budgets')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new AppError(500, error.message)
    if (!count) throw new AppError(404, 'Budget not found')
  },
}
