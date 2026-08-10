import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId: string;
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map