import Tesseract from 'tesseract.js'
import sharp from 'sharp'

export interface ParsedReceipt {
  merchant?: string
  amount?: number
  date?: string // YYYY-MM-DD
  description?: string
  category?: string
  raw_text: string
  confidence: number
}

// Words that are almost never the merchant name — skip them when
// scanning the top of the receipt.
const MERCHANT_BLACKLIST = [
  'receipt', 'invoice', 'sales receipt', 'tax invoice', 'order',
  'customer copy', 'merchant copy', 'duplicate', 'original',
  'welcome', 'thank you', 'thanks', 'hello',
  'cashier', 'cashier:', 'clerk', 'associate', 'served by',
  'tel', 'phone', 'fax', 'www', 'http', '.com',
  'open', 'hours', 'mon-', 'mon -', 'am -', 'am-',
  'receipt no', 'order no', 'trans', 'auth',
];

const TOTAL_KEYWORDS =
  /(grand\s*total|total\s*due|amount\s*due|balance\s*due|total\s*amount|net\s*total|invoice\s*total|total\s*payable|total|amount|due|pay|charged?|balance)/i;

const NOISE_TOTAL_KEYWORDS = /(sub\s*total|subtotal|tax|vat|discount|change|cash|tender|tip|gratuity)/i;

const DATE_PATTERNS = [
  /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/, // 2024-03-12, 2024/03/12
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/, // 12/03/2024, 03-12-24
  /([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/i, // Mar 12, 2024
  /(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})/i, // 12 Mar 2024
];

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  // Stronger pipeline than before: auto-orient, upscale small phone photos,
  // boost contrast and apply a threshold so Tesseract sees crisp black-on-white.
  return sharp(buffer)
    .rotate() // honour EXIF orientation (fixes sideways uploads)
    .resize({ width: 2000, withoutEnlargement: false })
    .greyscale()
    .normalise()
    .linear(1.4, -20) // contrast stretch
    .sharpen({ sigma: 1.2 })
    .threshold(160) // binarise — kills grey background noise
    .toBuffer()
}

/** Light cleanup of common Tesseract misreads before regex parsing. */
function cleanText(raw: string): string {
  return raw
    .split('\n')
    .map((line) =>
      line
        .replace(/[|]/g, '1') // | -> 1
        .replace(/[‘’`]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
    .join('\n');
}

function parseAmount(text: string, lines: string[]): number | undefined {
  const candidates: { value: number; score: number }[] = [];

  lines.forEach((line, idx) => {
    const positionBonus = idx / Math.max(lines.length - 1, 1); // later lines score higher
    const hasTotalKw = TOTAL_KEYWORDS.test(line);
    const hasNoiseKw = NOISE_TOTAL_KEYWORDS.test(line) && !hasTotalKw;

    // Find every money-like number on the line: 1,234.56 / 1234.56 / 45.00
    const moneyRe = /\$?\s*([\d,]{1,7}\.\d{2})/g;
    let m: RegExpExecArray | null;
    while ((m = moneyRe.exec(line)) !== null) {
      const value = parseFloat(m[1].replace(/,/g, ''));
      if (isNaN(value) || value <= 0 || value >= 100000) continue;
      let score = positionBonus * 2 + Math.min(value / 500, 1);
      if (hasTotalKw) score += 5;
      if (hasNoiseKw) score -= 3;
      if (/\$/.test(line)) score += 0.5;
      candidates.push({ value, score });
    }
  });

  // Fallback: bare keyword match like "TOTAL 45.00" where OCR dropped decimals
  if (candidates.length === 0) {
    const fallback = text.match(
      /(?:grand\s*total|total|amount|due|balance)[^\d]{0,10}([\d,]+\.?\d{0,2})/i,
    );
    if (fallback) {
      const value = parseFloat(fallback[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0 && value < 100000) return value;
    }
    return undefined;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].value;
}

function parseDateISO(text: string): string | undefined {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = match[1].replace(/\./g, '/').replace(/-/g, '/');
    const iso = toISODate(raw);
    if (iso) return iso;
  }
  return undefined;
}

/** Normalise US / ISO / written dates to YYYY-MM-DD. Returns undefined if invalid. */
function toISODate(raw: string): string | undefined {
  let d: Date | null = null;

  // ISO first: 2024/03/12
  let m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // US numeric: MM/DD/YYYY or MM/DD/YY
  if (!d) {
    m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let year = Number(m[3]);
      if (year < 100) year += year > 50 ? 1900 : 2000;
      d = new Date(year, Number(m[1]) - 1, Number(m[2]));
    }
  }

  // Written: Mar 12, 2024 / 12 Mar 2024
  if (!d) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) d = parsed;
  }

  if (!d || isNaN(d.getTime())) return undefined;
  // Sanity: receipts shouldn't be from the future or >15 years ago
  const now = new Date();
  if (d.getTime() > now.getTime() + 24 * 3600 * 1000) return undefined;
  if (d.getFullYear() < now.getFullYear() - 15) return undefined;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseMerchant(lines: string[]): string | undefined {
  const isBlacklisted = (line: string) => {
    const lower = line.toLowerCase();
    return MERCHANT_BLACKLIST.some((b) => lower.includes(b));
  };

  // Only look at the top 6 non-empty lines — the merchant logo/name
  // is virtually always at the top of a receipt.
  const top = lines.slice(0, 6);
  for (const line of top) {
    if (line.length < 3 || line.length > 50) continue;
    if (isBlacklisted(line)) continue;
    // Skip lines that are mostly numbers / addresses / dates
    if (/^[\d\s$.,\-\/#:;()]+$/.test(line)) continue;
    if (/\d{3}[-\s.]?\d{3}[-\s.]?\d{4}/.test(line)) continue; // phone number
    if (DATE_PATTERNS.some((p) => p.test(line))) continue;
    if (/^\d+\s+[A-Z].*\d{5}/.test(line)) continue; // street address + zip

    return cleanMerchantName(line);
  }

  // Fallback: first usable line anywhere in the receipt
  for (const line of lines) {
    if (line.length < 3 || line.length > 50) continue;
    if (isBlacklisted(line)) continue;
    if (/^[\d\s$.,\-\/#:;()]+$/.test(line)) continue;
    return cleanMerchantName(line);
  }
  return undefined;
}

function cleanMerchantName(line: string): string {
  return line
    .replace(/^[^a-zA-Z0-9*&#]+/, '') // leading symbols Tesseract adds
    .replace(/[*#]{2,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Build a useful description from receipt line items instead of the old
 * generic "Purchase at X". Skips totals/tax/payment/address lines.
 */
function parseDescription(lines: string[], merchant?: string): string {
  const skip = (line: string) => {
    const lower = line.toLowerCase();
    if (TOTAL_KEYWORDS.test(line)) return true;
    if (NOISE_TOTAL_KEYWORDS.test(line)) return true;
    if (/^(visa|mastercard|amex|cash|debit|credit|card|change|receipt|thank)/i.test(lower)) return true;
    if (/^[\d\s$.,\-\/#:;()]+$/.test(line)) return true;
    if (/\d{3}[-\s.]?\d{3}[-\s.]?\d{4}/.test(line)) return true; // phone
    if (/^\d+\s+\S+.*\d{5}/.test(line)) return true; // street address + zip
    if (DATE_PATTERNS.some((p) => p.test(line))) return true;
    if (line.length < 3 || line.length > 60) return true;
    if (merchant && line.toLowerCase() === merchant.toLowerCase()) return true;
    if (MERCHANT_BLACKLIST.some((b) => lower === b)) return true;
    return false;
  };

  const items = lines.filter((l) => !skip(l)).slice(0, 3);
  if (items.length === 0) {
    return merchant ? `Purchase at ${merchant}` : 'Scanned expense';
  }
  // Strip trailing prices: "CHEESE BURGER 12.99" -> "CHEESE BURGER"
  const cleaned = items.map((l) => l.replace(/\s+\$?[\d,]+\.\d{2}\s*$/, '').trim());
  const joined = cleaned.join(', ');
  return joined.length > 100 ? joined.slice(0, 100) : joined;
}

function parseText(rawText: string): Omit<ParsedReceipt, 'raw_text' | 'confidence'> {
  const cleaned = cleanText(rawText);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

  const amount = parseAmount(cleaned, lines);
  const date = parseDateISO(cleaned);
  const merchant = parseMerchant(lines);
  const description = parseDescription(lines, merchant);

  return { merchant, amount, date, description };
}

/**
 * Optional LLM-vision pass for near-perfect extraction.
 * Set OPENAI_API_KEY in server/.env — if unset, local Tesseract is used.
 * Uses gpt-4o-mini with a base64 image + strict JSON response.
 */
async function tryLLMParse(imageBuffer: Buffer): Promise<Omit<ParsedReceipt, 'raw_text' | 'confidence'> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const base64 = imageBuffer.toString('base64');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OCR_LLM_MODEL ?? 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract from this receipt image: merchant (store name only), amount (final total as number), date (YYYY-MM-DD), description (short summary of items, max 100 chars). Return JSON with keys merchant, amount, date, description. Use null for anything you cannot read.',
              },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.warn('[ocr] LLM parse failed with status', res.status);
      return null;
    }
    const json = (await res.json()) as any;
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    return {
      merchant: parsed.merchant ?? undefined,
      amount: typeof parsed.amount === 'number' ? parsed.amount : Number(parsed.amount) || undefined,
      date: parsed.date ?? undefined,
      description: parsed.description ?? undefined,
    };
  } catch (err) {
    console.warn('[ocr] LLM parse error, falling back to Tesseract:', err);
    return null;
  }
}

export async function processReceiptImage(imageBuffer: Buffer): Promise<ParsedReceipt> {
  // 1. If an OpenAI key is configured, prefer vision-LLM (far more accurate
  //    on merchant / line items). Still run Tesseract afterwards for raw_text.
  const llm = await tryLLMParse(imageBuffer);

  const preprocessed = await preprocessImage(imageBuffer);

  const result = await Tesseract.recognize(preprocessed, 'eng', {
    logger: () => {},
    // @ts-expect-error — tesseract.js worker params
    tessedit_pageseg_mode: '6', // assume uniform block of text (receipts)
    tessedit_ocr_engine_mode: '1', // LSTM only
    preserve_interword_spaces: '1',
  });

  const rawText = result.data.text
  const confidence = result.data.confidence
  const parsed = parseText(rawText)

  // LLM wins where it produced a value, Tesseract fills the gaps.
  if (llm) {
    return {
      merchant: llm.merchant ?? parsed.merchant,
      amount: llm.amount ?? parsed.amount,
      date: llm.date ?? parsed.date,
      description: llm.description ?? parsed.description,
      raw_text: rawText,
      confidence,
    };
  }

  return { ...parsed, raw_text: rawText, confidence }
}

// Exported for unit testing without running Tesseract.
export const _test = { parseText, cleanText, toISODate, parseAmount, parseMerchant, parseDescription };
