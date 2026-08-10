"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const statsService_1 = require("../services/statsService");
exports.statsRoutes = (0, express_1.Router)();
// GET /api/stats/monthly?month=2024-01
exports.statsRoutes.get('/monthly', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    const month = req.query.month ? new Date(req.query.month) : new Date();
    const stats = await statsService_1.statsService.monthly(userId, month);
    res.json(stats);
});
// GET /api/stats/trend?months=6
exports.statsRoutes.get('/trend', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    const months = req.query.months ? parseInt(req.query.months) : 6;
    const trend = await statsService_1.statsService.trend(userId, months);
    res.json(trend);
});
// GET /api/stats/daily?days=30
exports.statsRoutes.get('/daily', auth_1.requireAuth, async (req, res) => {
    const { userId } = req;
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const daily = await statsService_1.statsService.daily(userId, days);
    res.json(daily);
});
//# sourceMappingURL=stats.js.map