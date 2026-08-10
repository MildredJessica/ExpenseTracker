import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@clerk/backend'

export interface AuthRequest extends Request {
  userId: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '').trim()
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' })
      return
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: [process.env.CLIENT_URL || 'http://localhost:5173'],
    })
    ;(req as AuthRequest).userId = payload.sub
    next()
  } catch (err) {
    console.error('Clerk verifyToken error:', err)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
