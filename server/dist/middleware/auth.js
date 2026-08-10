"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const backend_1 = require("@clerk/backend");
const clerk = (0, backend_1.createClerkClient)({
    secretKey: process.env.CLERK_SECRET_KEY,
});
async function requireAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Missing authorization token' });
            return;
        }
        // Debugging secret key
        console.log('Validating with Secret Key (starts with):', process.env.CLERK_SECRET_KEY?.substring(0, 10));
        const { sub } = await clerk.verifyToken(token);
        req.userId = sub;
        next();
    }
    catch (err) {
        console.error('Clerk verifyToken error:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=auth.js.map