"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const expenseService_1 = require("../services/expenseService");
exports.expenseRoutes = (0, express_1.Router)();
const expenseSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(1).max(255),
    category: zod_1.z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'utilities', 'housing', 'travel', 'education', 'other']),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    merchant: zod_1.z.string().max(255).optional(),
    receipt_url: zod_1.z.string().url().optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
const bulkDeleteSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(100),
});
// GET /api/expenses
exports.expenseRoutes.get('/', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    const { category, from, to, search, limit, offset } = req.query;
    const result = await expenseService_1.expenseService.list(userId, {
        category: category,
        from: from,
        to: to,
        search: search,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0,
    });
    res.json(result);
});
// POST /api/expenses
exports.expenseRoutes.post('/', auth_1.requireAuth, (0, validate_1.validate)(expenseSchema), async (req, res) => {
    const { userId } = req;
    const expense = await expenseService_1.expenseService.create(userId, req.body);
    res.status(201).json(expense);
});
// PATCH /api/expenses/:id
exports.expenseRoutes.patch('/:id', auth_1.requireAuth, (0, validate_1.validate)(expenseSchema.partial()), async (req, res) => {
    const { userId } = req;
    const expense = await expenseService_1.expenseService.update(req.params.id, userId, req.body);
    res.json(expense);
});
// DELETE /api/expenses/:id
exports.expenseRoutes.delete('/:id', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    await expenseService_1.expenseService.delete(req.params.id, userId);
    res.status(204).send();
});
// DELETE /api/expenses (bulk)
exports.expenseRoutes.delete('/', auth_1.requireAuth, (0, validate_1.validate)(bulkDeleteSchema), async (req, res) => {
    const { userId } = req;
    await expenseService_1.expenseService.deleteBulk(req.body.ids, userId);
    res.status(204).send();
});
//# sourceMappingURL=expenses.js.map