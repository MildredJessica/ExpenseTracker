import { Router, Request, Response } from 'express'
import multer from 'multer'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { processReceiptImage } from '../services/ocrService'
import { expenseService } from '../services/expenseService'
import { AppError } from '../middleware/errorHandler'

export const scannerRoutes = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new AppError(400, 'Only image files are accepted'))
  },
})

// POST /api/scanner/ocr
// Accepts: multipart/form-data with field "receipt" (image file)
// Returns: ParsedReceipt
scannerRoutes.post('/ocr', requireAuth, upload.single('receipt'), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided')
  }

  const result = await processReceiptImage(req.file.buffer)
  res.json(result)
})

// POST /api/scanner/upload
// Uploads image to Supabase storage, returns public URL
scannerRoutes.post('/upload', requireAuth, upload.single('receipt'), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
  if (!req.file) throw new AppError(400, 'No image file provided')

  const url = await expenseService.uploadReceipt(userId, req.file.buffer, req.file.mimetype)
  res.json({ url })
})
