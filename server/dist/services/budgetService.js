"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = void 0;
const supabase_1 = require("../db/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
exports.budgetService = {
    async list(userId) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('budgets')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        return data ?? [];
    },
    async upsert(userId, input) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('budgets')
            .upsert({ ...input, user_id: userId }, { onConflict: 'user_id,category' })
            .select()
            .single();
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        return data;
    },
    async delete(id, userId) {
        const { error, count } = await supabase_1.supabaseAdmin
            .from('budgets')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        if (!count)
            throw new errorHandler_1.AppError(404, 'Budget not found');
    },
};
//# sourceMappingURL=budgetService.js.map