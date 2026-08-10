import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { expenseService } from '../services/expenseService'
import { Request, Response } from 'express'

export const expenseRoutes = Router()

const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  category: z.enum(['food','transport','shopping','entertainment','health','utilities','housing','travel','education','other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().max(255).optional(),
  receipt_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
})

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
})

// GET /api/expenses
expenseRoutes.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const { category, from, to, search, limit, offset } = req.query

  const result = await expenseService.list(userId, {
    category: category as string,
    from: from as string,
    to: to as string,
    search: search as string,
    limit: limit ? parseInt(limit as string) : 100,
    offset: offset ? parseInt(offset as string) : 0,
  })

  res.json(result)
})

// POST /api/expenses
expenseRoutes.post('/', requireAuth, validate(expenseSchema), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const expense = await expenseService.create(userId, req.body)
  res.status(201).json(expense)
})

// PATCH /api/expenses/:id
expenseRoutes.patch('/:id', requireAuth, validate(expenseSchema.partial()), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  const expense = await expenseService.update(req.params.id, userId, req.body)
  res.json(expense)
})

// DELETE /api/expenses/:id
expenseRoutes.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  await expenseService.delete(req.params.id, userId)
  res.status(204).send()
})

// DELETE /api/expenses (bulk)
expenseRoutes.delete('/', requireAuth, validate(bulkDeleteSchema), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  await expenseService.deleteBulk(req.body.ids, userId)
  res.status(204).send()
})
