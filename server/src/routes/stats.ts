import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { statsService } from '../services/statsService'

export const statsRoutes = Router()

// GET /api/stats/monthly?month=2024-01
statsRoutes.get('/monthly', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const month = req.query.month ? new Date(req.query.month as string) : new Date()
  const stats = await statsService.monthly(userId, month)
  res.json(stats)
})

// GET /api/stats/trend?months=6
statsRoutes.get('/trend', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const months = req.query.months ? parseInt(req.query.months as string) : 6
  const trend = await statsService.trend(userId, months)
  res.json(trend)
})

// GET /api/stats/daily?days=30
statsRoutes.get('/daily', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const days = req.query.days ? parseInt(req.query.days as string) : 30
  const daily = await statsService.daily(userId, days)
  res.json(daily)
})
