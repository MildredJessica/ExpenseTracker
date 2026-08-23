import Tesseract from 'tesseract.js'
import sharp from 'sharp'

export interface ParsedReceipt {
  merchant?: string
  amount?: number
  date?: string
  description?: string
  raw_text: string
  confidence: number
}

const DATE_PATTERNS = [
  /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
  /([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/i,
]

// Lines that are common receipt boilerplate, never the store name
const NON_MERCHANT_LINE =
  /receipt|invoice|welcome|thank|order|cashier|cash|change|total|subtotal|tax|vat|visa|master|amex|discover|debit|credit|card|payment|approved|customer|copy|tel[:\s]|phone|fax|www\.|\.com|http|street|avenue|blvd|suite|date|time|server|table|guest|check\b|item|qty|price|balance|due|refund|transaction|terminal|merchant\s*id|auth/i

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .greyscale()
    .normalise()
    .sharpen()
    .toBuffer()
}

function moneyValues(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(/(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})/g)) {
    const v = parseFloat(m[1].replace(/,/g, ''))
    if (!isNaN(v) && v > 0 && v < 100000) out.push(v)
  }
  return out
}

function extractAmount(lines: string[]): number | undefined {
  const isSubtotal = (l: string) => /sub\s*[-–.]?\s*total/i.test(l)
  // Strong keywords almost always label the grand total; weaker ones as second pass
  const keywordPasses = [
    /grand\s*total|total\s*due|amount\s*due|balance\s*due|total\s*amount|amount\s*paid|to\s*pay|charged/i,
    /total|balance|amount/i,
  ]

  // Scan bottom-up: the grand total sits below subtotal/tax/line items
  for (const re of keywordPasses) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]
      if (isSubtotal(line) || !re.test(line)) continue
      const sameLine = moneyValues(line)
      if (sameLine.length) return sameLine[sameLine.length - 1]
      // OCR sometimes splits the label and value onto separate lines
      const nextLine = i + 1 < lines.length ? moneyValues(lines[i + 1]) : []
      if (nextLine.length) return nextLine[0]
    }
  }

  // Last resort: the largest money value (total >= subtotal, tax and any line item)
  const all = moneyValues(lines.join('\n'))
  return all.length ? Math.max(...all) : undefined
}

function extractMerchant(lines: string[]): string | undefined {
  // The store name is virtually always within the first few lines of a receipt
  for (const line of lines.slice(0, 6)) {
    const cleaned = line.replace(/[^A-Za-z0-9&'.\- ]/g, ' ').replace(/\s+/g, ' ').trim()
    const letters = (cleaned.match(/[A-Za-z]/g) ?? []).length
    if (letters < 3 || cleaned.length < 3 || cleaned.length > 40) continue
    if (NON_MERCHANT_LINE.test(cleaned)) continue
    if (/^[\d\s\-()#.]+$/.test(cleaned)) continue
    // Normalize SHOUTING receipt headers to title case
    if (cleaned === cleaned.toUpperCase()) {
      return cleaned
        .toLowerCase()
        .replace(/(^|[\s\-&.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    }
    return cleaned
  }
  return undefined
}

export function parseText(rawText: string): Omit<ParsedReceipt, 'raw_text' | 'confidence'> {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)

  const amount = extractAmount(lines)
  const merchant = extractMerchant(lines)

  let date: string | undefined
  for (const pattern of DATE_PATTERNS) {
    const match = rawText.match(pattern)
    if (match) {
      date = match[1]
      break
    }
  }

  return {
    merchant,
    amount,
    date,
    description: merchant ? `Purchase at ${merchant}` : 'Scanned receipt',
  }
}

export async function processReceiptImage(imageBuffer: Buffer): Promise<ParsedReceipt> {
  const preprocessed = await preprocessImage(imageBuffer)

  const result = await Tesseract.recognize(preprocessed, 'eng', {
    logger: () => {},
  })

  const rawText = result.data.text
  const confidence = result.data.confidence
  const parsed = parseText(rawText)

  return { ...parsed, raw_text: rawText, confidence }
}
