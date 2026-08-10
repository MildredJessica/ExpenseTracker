export declare const statsService: {
    monthly(userId: string, month: Date): Promise<{
        total: number;
        count: number;
        avg_per_day: number;
        by_category: Record<string, number>;
        period: {
            from: string;
            to: string;
        };
    }>;
    trend(userId: string, months?: number): Promise<{
        month: string;
        total: number;
        count: number;
    }[]>;
    daily(userId: string, days?: number): Promise<{
        date: string;
        label: string;
        total: number;
    }[]>;
};
//# sourceMappingURL=statsService.d.ts.map