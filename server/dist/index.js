"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const expenses_1 = require("./routes/expenses");
const budgets_1 = require("./routes/budgets");
const scanner_1 = require("./routes/scanner");
const stats_1 = require("./routes/stats");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
// ── Middleware ────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
}));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Routes ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use('/api/expenses', expenses_1.expenseRoutes);
app.use('/api/budgets', budgets_1.budgetRoutes);
app.use('/api/scanner', scanner_1.scannerRoutes);
app.use('/api/stats', stats_1.statsRoutes);
// ── Error handler (must be last) ──────────────────────────────
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map