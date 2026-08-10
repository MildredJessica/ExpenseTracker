import type {
  Expense, ExpenseInput, Budget, BudgetInput,
  MonthlyStats, DailyStat, TrendStat, ScannedReceipt,
} from '@/types'

const BASE = '/api'

// async function getToken(): Promise<string> {
//   // Clerk token is injected by the ClerkProvider; we read it from the window
//   // The App wraps all calls via useApi() which passes the token
//   throw new Error('getToken must be overridden via createApiClient()')
// }

export function createApiClient(tokenFn: () => Promise<string>) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: { isFormData?: boolean } = {}
  ): Promise<T> {
    const token = await tokenFn()
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }
    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: options.isFormData
        ? (body as FormData)
        : body != null
        ? JSON.stringify(body)
        : undefined,
    })

    if (res.status === 204) return undefined as T

    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data as T
  }

  return {
    // ── Expenses ────────────────────────────────────────────
    expenses: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return request<{ expenses: Expense[]; total: number }>('GET', `/expenses${qs}`)
      },
      create: (input: ExpenseInput) =>
        request<Expense>('POST', '/expenses', input),
      update: (id: string, input: Partial<ExpenseInput>) =>
        request<Expense>('PATCH', `/expenses/${id}`, input),
      delete: (id: string) =>
        request<void>('DELETE', `/expenses/${id}`),
      deleteBulk: (ids: string[]) =>
        request<void>('DELETE', '/expenses', { ids }),
    },

    // ── Budgets ─────────────────────────────────────────────
    budgets: {
      list: () => request<Budget[]>('GET', '/budgets'),
      upsert: (input: BudgetInput) =>
        request<Budget>('PUT', '/budgets', input),
      delete: (id: string) =>
        request<void>('DELETE', `/budgets/${id}`),
    },

    // ── Scanner ─────────────────────────────────────────────
    scanner: {
      ocr: (file: File) => {
        const form = new FormData()
        form.append('receipt', file)
        return request<ScannedReceipt>('POST', '/scanner/ocr', form, { isFormData: true })
      },
      upload: (file: File) => {
        const form = new FormData()
        form.append('receipt', file)
        return request<{ url: string }>('POST', '/scanner/upload', form, { isFormData: true })
      },
    },

    // ── Stats ────────────────────────────────────────────────
    stats: {
      monthly: (month?: string) => {
        const qs = month ? `?month=${month}` : ''
        return request<MonthlyStats>('GET', `/stats/monthly${qs}`)
      },
      daily: (days = 30) =>
        request<DailyStat[]>('GET', `/stats/daily?days=${days}`),
      trend: (months = 6) =>
        request<TrendStat[]>('GET', `/stats/trend?months=${months}`),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
