import { supabaseAdmin } from '../db/supabase'
import { AppError } from '../middleware/errorHandler'

export interface ExpenseInput {
  amount: number
  description: string
  category: string
  date: string
  merchant?: string
  receipt_url?: string
  notes?: string
}

export interface ExpenseFilters {
  category?: string
  from?: string
  to?: string
  search?: string
  limit?: number
  offset?: number
}

export const expenseService = {
  async list(userId: string, filters: ExpenseFilters = {}) {
    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters.category) query = query.eq('category', filters.category)
    if (filters.from) query = query.gte('date', filters.from)
    if (filters.to) query = query.lte('date', filters.to)
    if (filters.search) {
      query = query.or(
        `description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`
      )
    }
    if (filters.limit) query = query.limit(filters.limit)
    if (filters.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1)

    const { data, error, count } = await query
    if (error) throw new AppError(500, error.message)
    return { expenses: data ?? [], total: count ?? 0 }
  },

  async create(userId: string, input: ExpenseInput) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw new AppError(500, error.message)
    return data
  },

  async update(id: string, userId: string, input: Partial<ExpenseInput>) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new AppError(500, error.message)
    if (!data) throw new AppError(404, 'Expense not found')
    return data
  },

  async delete(id: string, userId: string) {
    const { error, count } = await supabaseAdmin
      .from('expenses')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new AppError(500, error.message)
    if (!count) throw new AppError(404, 'Expense not found')
  },

  async deleteBulk(ids: string[], userId: string) {
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .in('id', ids)
      .eq('user_id', userId)
    if (error) throw new AppError(500, error.message)
  },

  async uploadReceipt(userId: string, buffer: Buffer, mimeType: string) {
    const ext = mimeType.split('/')[1] ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabaseAdmin.storage
      .from('receipts')
      .upload(path, buffer, { contentType: mimeType })
    if (error) throw new AppError(500, error.message)
    const { data } = supabaseAdmin.storage.from('receipts').getPublicUrl(path)
    return data.publicUrl
  },
}
