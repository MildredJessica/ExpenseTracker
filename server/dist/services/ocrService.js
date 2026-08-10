"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReceiptImage = processReceiptImage;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const sharp_1 = __importDefault(require("sharp"));
const AMOUNT_PATTERNS = [
    /(?:total|amount|due|pay|charged?|balance|grand\s*total)[^\d]*\$?([\d,]+\.?\d{0,2})/i,
    /\$\s*([\d,]+\.\d{2})/g,
    /(?:^\s*|\s)([\d,]+\.\d{2})\s*$/m,
];
const DATE_PATTERNS = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/i,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
];
const MERCHANT_PATTERNS = [
    /^([A-Z][A-Z\s&'\.]+)\s*$/m,
    /(?:store|restaurant|cafe|shop|market|station|hotel|pharmacy|inc|llc|ltd)[:\s]+([^\n]+)/i,
];
async function preprocessImage(buffer) {
    return (0, sharp_1.default)(buffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .greyscale()
        .normalise()
        .sharpen()
        .toBuffer();
}
function parseText(rawText) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    let amount;
    let date;
    let merchant;
    for (const pattern of AMOUNT_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const match = rawText.match(regex);
        if (match) {
            const parsed = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
                amount = parsed;
                break;
            }
        }
    }
    for (const pattern of DATE_PATTERNS) {
        const match = rawText.match(pattern);
        if (match) {
            date = match[1];
            break;
        }
    }
    for (const pattern of MERCHANT_PATTERNS) {
        const match = rawText.match(pattern);
        if (match) {
            merchant = match[1].trim();
            break;
        }
    }
    if (!merchant && lines.length > 0) {
        const first = lines[0];
        if (first.length > 2 && first.length < 60)
            merchant = first;
    }
    return {
        merchant,
        amount,
        date,
        description: merchant ? `Purchase at ${merchant}` : 'Scanned expense',
    };
}
async function processReceiptImage(imageBuffer) {
    const preprocessed = await preprocessImage(imageBuffer);
    const result = await tesseract_js_1.default.recognize(preprocessed, 'eng', {
        logger: () => { },
    });
    const rawText = result.data.text;
    const confidence = result.data.confidence;
    const parsed = parseText(rawText);
    return { ...parsed, raw_text: rawText, confidence };
}
//# sourceMappingURL=ocrService.js.map