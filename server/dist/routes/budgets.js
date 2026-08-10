"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const budgetService_1 = require("../services/budgetService");
exports.budgetRoutes = (0, express_1.Router)();
const budgetSchema = zod_1.z.object({
    category: zod_1.z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'utilities', 'housing', 'travel', 'education', 'other']),
    monthly_limit: zod_1.z.number().positive(),
});
// GET /api/budgets
exports.budgetRoutes.get('/', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    const budgets = await budgetService_1.budgetService.list(userId);
    res.json(budgets);
});
// PUT /api/budgets
exports.budgetRoutes.put('/', auth_1.requireAuth, (0, validate_1.validate)(budgetSchema), async (req, res) => {
    const { userId } = req;
    const budget = await budgetService_1.budgetService.upsert(userId, req.body);
    res.json(budget);
});
// DELETE /api/budgets/:id
exports.budgetRoutes.delete('/:id', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    await budgetService_1.budgetService.delete(req.params.id, userId);
    res.status(204).send();
});
//# sourceMappingURL=budgets.js.map