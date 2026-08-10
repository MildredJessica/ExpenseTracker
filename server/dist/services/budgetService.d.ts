export interface BudgetInput {
    category: string;
    monthly_limit: number;
}
export declare const budgetService: {
    list(userId: string): Promise<any[]>;
    upsert(userId: string, input: BudgetInput): Promise<any>;
    delete(id: string, userId: string): Promise<void>;
};
//# sourceMappingURL=budgetService.d.ts.map