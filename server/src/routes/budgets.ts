import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { budgetService } from '../services/budgetService'

export const budgetRoutes = Router()

const budgetSchema = z.object({
  category: z.enum(['food','transport','shopping','entertainment','health','utilities','housing','travel','education','other']),
  monthly_limit: z.number().positive(),
})

// GET /api/budgets
budgetRoutes.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const budgets = await budgetService.list(userId)
  res.json(budgets)
})

// PUT /api/budgets
budgetRoutes.put('/', requireAuth, validate(budgetSchema), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const budget = await budgetService.upsert(userId, req.body)
  res.json(budget)
})

// DELETE /api/budgets/:id
budgetRoutes.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  await budgetService.delete(req.params.id, userId)
  res.status(204).send()
})
