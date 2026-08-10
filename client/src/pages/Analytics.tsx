import { Download } from 'lucide-react'
import { Button } from '@/components/ui/index'
import { SpendingCharts } from '@/components/charts/SpendingCharts'
import { useStore } from '@/store/appStore'
import { exportToCSV, formatMonth } from '@/lib/formatters'
import { toast } from '@/hooks/useToast'

export function Analytics() {
  const { expenses } = useStore()

  const handleExport = () => {
    exportToCSV(expenses, `expenses-${new Date().toISOString().split('T')[0]}.csv`)
    toast({ variant: 'success', title: 'Exported successfully' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">{formatMonth(new Date())} · server-computed stats</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />Export all
        </Button>
      </div>
      <SpendingCharts />
    </div>
  )
}
