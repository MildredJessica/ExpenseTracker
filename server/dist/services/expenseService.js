"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseService = void 0;
const supabase_1 = require("../db/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
exports.expenseService = {
    async list(userId, filters = {}) {
        let query = supabase_1.supabaseAdmin
            .from('expenses')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (filters.category)
            query = query.eq('category', filters.category);
        if (filters.from)
            query = query.gte('date', filters.from);
        if (filters.to)
            query = query.lte('date', filters.to);
        if (filters.search) {
            query = query.or(`description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`);
        }
        if (filters.limit)
            query = query.limit(filters.limit);
        if (filters.offset)
            query = query.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1);
        const { data, error, count } = await query;
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        return { expenses: data ?? [], total: count ?? 0 };
    },
    async create(userId, input) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('expenses')
            .insert({ ...input, user_id: userId })
            .select()
            .single();
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        return data;
    },
    async update(id, userId, input) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('expenses')
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        if (!data)
            throw new errorHandler_1.AppError(404, 'Expense not found');
        return data;
    },
    async delete(id, userId) {
        const { error, count } = await supabase_1.supabaseAdmin
            .from('expenses')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        if (!count)
            throw new errorHandler_1.AppError(404, 'Expense not found');
    },
    async deleteBulk(ids, userId) {
        const { error } = await supabase_1.supabaseAdmin
            .from('expenses')
            .delete()
            .in('id', ids)
            .eq('user_id', userId);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
    },
    async uploadReceipt(userId, buffer, mimeType) {
        const ext = mimeType.split('/')[1] ?? 'jpg';
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error } = await supabase_1.supabaseAdmin.storage
            .from('receipts')
            .upload(path, buffer, { contentType: mimeType });
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        const { data } = supabase_1.supabaseAdmin.storage.from('receipts').getPublicUrl(path);
        return data.publicUrl;
    },
};
//# sourceMappingURL=expenseService.js.map