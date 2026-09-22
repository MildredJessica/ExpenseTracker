import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ReceiptScanner } from '@/components/scanner/ReceiptScanner'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/index'
import type { ScannedReceipt, ExpenseInput } from '@/types'

export function Scanner() {
  const [scanned, setScanned] = useState<Partial<ExpenseInput> | null>(null)
  const navigate = useNavigate()

  const handleResult = (result: ScannedReceipt) => {
    // Server now returns date as YYYY-MM-DD. Accept that directly and only
    // fall back to Date parsing for legacy responses.
    let dateStr = format(new Date(), 'yyyy-MM-dd')
    if (result.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
        dateStr = result.date
      } else {
        try {
          dateStr = format(new Date(result.date!), 'yyyy-MM-dd')
        } catch {
          // keep today
        }
      }
    }
    setScanned({
      amount: result.amount ?? 0,
      description: result.description ?? '',
      merchant: result.merchant ?? '',
      date: dateStr,
      category: 'other',
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Scan receipt</h1>
        <p className="mt-1 text-muted-foreground">
          Capture or upload a receipt — OCR runs on the server with image preprocessing for better accuracy
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capture</CardTitle>
          <CardDescription>Use your camera or upload an image</CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptScanner onResult={handleResult} />
        </CardContent>
      </Card>

      {scanned && (
        <Card className="border-primary/30 animate-fade-in">
          <CardHeader>
            <CardTitle>Confirm details</CardTitle>
            <CardDescription>Review and edit the extracted info before saving</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm prefill={scanned} onSuccess={() => navigate('/expenses')} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
