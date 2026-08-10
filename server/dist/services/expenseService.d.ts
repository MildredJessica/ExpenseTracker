export interface ExpenseInput {
    amount: number;
    description: string;
    category: string;
    date: string;
    merchant?: string;
    receipt_url?: string;
    notes?: string;
}
export interface ExpenseFilters {
    category?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare const expenseService: {
    list(userId: string, filters?: ExpenseFilters): Promise<{
        expenses: any[];
        total: number;
    }>;
    create(userId: string, input: ExpenseInput): Promise<any>;
    update(id: string, userId: string, input: Partial<ExpenseInput>): Promise<any>;
    delete(id: string, userId: string): Promise<void>;
    deleteBulk(ids: string[], userId: string): Promise<void>;
    uploadReceipt(userId: string, buffer: Buffer, mimeType: string): Promise<string>;
};
//# sourceMappingURL=expenseService.d.ts.map