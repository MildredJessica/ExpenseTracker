"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsService = void 0;
const supabase_1 = require("../db/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const date_fns_1 = require("date-fns");
exports.statsService = {
    async monthly(userId, month) {
        const from = (0, date_fns_1.format)((0, date_fns_1.startOfMonth)(month), 'yyyy-MM-dd');
        const to = (0, date_fns_1.format)((0, date_fns_1.endOfMonth)(month), 'yyyy-MM-dd');
        const { data, error } = await supabase_1.supabaseAdmin
            .from('expenses')
            .select('amount, category, date')
            .eq('user_id', userId)
            .gte('date', from)
            .lte('date', to);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        const expenses = data ?? [];
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const byCategory = {};
        for (const e of expenses) {
            byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
        }
        const daysInMonth = (0, date_fns_1.endOfMonth)(month).getDate();
        return {
            total,
            count: expenses.length,
            avg_per_day: total / daysInMonth,
            by_category: byCategory,
            period: { from, to },
        };
    },
    async trend(userId, months = 6) {
        const results = [];
        for (let i = months - 1; i >= 0; i--) {
            const month = (0, date_fns_1.subMonths)(new Date(), i);
            const from = (0, date_fns_1.format)((0, date_fns_1.startOfMonth)(month), 'yyyy-MM-dd');
            const to = (0, date_fns_1.format)((0, date_fns_1.endOfMonth)(month), 'yyyy-MM-dd');
            const { data, error } = await supabase_1.supabaseAdmin
                .from('expenses')
                .select('amount')
                .eq('user_id', userId)
                .gte('date', from)
                .lte('date', to);
            if (error)
                throw new errorHandler_1.AppError(500, error.message);
            const total = (data ?? []).reduce((s, e) => s + e.amount, 0);
            results.push({ month: (0, date_fns_1.format)(month, 'MMM yyyy'), total, count: (data ?? []).length });
        }
        return results;
    },
    async daily(userId, days = 30) {
        const from = (0, date_fns_1.format)((0, date_fns_1.subMonths)(new Date(), 1), 'yyyy-MM-dd');
        const to = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase_1.supabaseAdmin
            .from('expenses')
            .select('amount, date')
            .eq('user_id', userId)
            .gte('date', from)
            .lte('date', to);
        if (error)
            throw new errorHandler_1.AppError(500, error.message);
        // Build a map of date -> total
        const map = {};
        for (const e of data ?? []) {
            map[e.date] = (map[e.date] ?? 0) + e.amount;
        }
        // Fill every day in range (including zeros)
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            result.push({ date: key, label: (0, date_fns_1.format)(d, 'MMM d'), total: map[key] ?? 0 });
        }
        return result;
    },
};
//# sourceMappingURL=statsService.js.map