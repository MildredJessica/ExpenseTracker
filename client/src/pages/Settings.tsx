import { UserProfile } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui/index'
import { Download } from 'lucide-react'
import { useStore } from '@/store/appStore'
import { exportToCSV } from '@/lib/formatters'
import { toast } from '@/hooks/useToast'

export function Settings() {
  const { expenses } = useStore()

  const handleExport = () => {
    exportToCSV(expenses, `expenses-${new Date().toISOString().split('T')[0]}.csv`)
    toast({ variant: 'success', title: 'Exported successfully' })
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export your expense data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Export expenses</p>
              <p className="text-xs text-muted-foreground mt-0.5">Download all {expenses.length} expenses as CSV</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-3.5 w-3.5" />Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your Clerk profile, email, and security</CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfile appearance={{ elements: { rootBox: 'w-full', card: 'shadow-none border-0 p-0', navbar: 'hidden', pageScrollBox: 'p-0' } }} />
        </CardContent>
      </Card>
    </div>
  )
}
