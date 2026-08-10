"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const ocrService_1 = require("../services/ocrService");
const expenseService_1 = require("../services/expenseService");
const errorHandler_1 = require("../middleware/errorHandler");
exports.scannerRoutes = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new errorHandler_1.AppError(400, 'Only image files are accepted'));
    },
});
// POST /api/scanner/ocr
// Accepts: multipart/form-data with field "receipt" (image file)
// Returns: ParsedReceipt
exports.scannerRoutes.post('/ocr', auth_1.requireAuth, upload.single('receipt'), async (req, res) => {
    if (!req.file) {
        throw new errorHandler_1.AppError(400, 'No image file provided');
    }
    const result = await (0, ocrService_1.processReceiptImage)(req.file.buffer);
    res.json(result);
});
// POST /api/scanner/upload
// Uploads image to Supabase storage, returns public URL
exports.scannerRoutes.post('/upload', auth_1.requireAuth, upload.single('receipt'), async (req, res) => {
    const { userId } = req;
    if (!req.file)
        throw new errorHandler_1.AppError(400, 'No image file provided');
    const url = await expenseService_1.expenseService.uploadReceipt(userId, req.file.buffer, req.file.mimetype);
    res.json({ url });
});
//# sourceMappingURL=scanner.js.map