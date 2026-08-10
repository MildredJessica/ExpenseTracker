export interface ParsedReceipt {
    merchant?: string;
    amount?: number;
    date?: string;
    description?: string;
    raw_text: string;
    confidence: number;
}
export declare function processReceiptImage(imageBuffer: Buffer): Promise<ParsedReceipt>;
//# sourceMappingURL=ocrService.d.ts.map