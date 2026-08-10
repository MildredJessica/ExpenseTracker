
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { useApi } from '@/lib/apiContext'
import { CATEGORIES } from '@/lib/categories'
import { formatCurrency } from '@/lib/formatters'
import { useStore } from '@/store/appStore'
import type { DailyStat, TrendStat } from '@/types'

export function SpendingCharts() {
  const api = useApi()
  const { expenses } = useStore()
  const [daily, setDaily] = useState<DailyStat[]>([])
  const [trend, setTrend] = useState<TrendStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.stats.daily(30), api.stats.trend(6)])
      .then(([d, t]) => { setDaily(d); setTrend(t) })
      .finally(() => setLoading(false))
  }, [api])

  // Category breakdown from local store (already loaded)
  const categoryData = (() => {
    const totals: Record<string, number> = {}
    expenses.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return CATEGORIES
      .filter((c) => totals[c.value] > 0)
      .map((c) => ({ name: c.label, value: totals[c.value], color: c.color, emoji: c.emoji }))
      .sort((a, b) => b.value - a.value)
  })()

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.75rem',
      fontSize: 12,
    },
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Daily area chart */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Daily spending — last 30 days</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158 64% 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(158 64% 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Spent']} />
              <Area type="monotone" dataKey="total" stroke="hsl(158 64% 40%)" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly trend bar chart */}
      <Card>
        <CardHeader><CardTitle>Monthly trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Total']} />
              <Bar dataKey="total" fill="hsl(158 64% 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category pie */}
      <Card>
        <CardHeader><CardTitle>By category</CardTitle></CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v)]} />
                <Legend formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown list */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Top categories</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryData.slice(0, 6).map((cat) => {
              const total = categoryData.reduce((s, c) => s + c.value, 0)
              const pct = total > 0 ? (cat.value / total) * 100 : 0
              return (
                <div key={cat.name} className="space-y-1.5 rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{cat.emoji}</span><span>{cat.name}</span>
                    </span>
                    <span className="font-mono text-xs">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% of total</p>
                </div>
              )
            })}
            {categoryData.length === 0 && (
              <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No expenses yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
