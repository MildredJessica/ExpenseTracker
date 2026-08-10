# Expensify — Fullstack Expense Tracker

A production-ready fullstack expense tracker built with React 18 + Express + Clerk + Supabase.

## Architecture

```
expensify-fullstack/
├── client/          # React 18 + Vite + Tailwind + shadcn/ui
└── server/          # Express + TypeScript + Tesseract.js + Sharp
```

```
Browser (React 18)
    │  Clerk JWT on every request
    ▼
Express API (Node.js)
    │  Clerk middleware verifies JWT → extracts userId
    │  Zod validates request body
    ▼
Supabase (PostgreSQL)
    │  Service-role client (server-side only, bypasses RLS)
    ▼
Supabase Storage (receipts bucket)
```

## What's different vs the client-only version

| Feature | Client-only | Fullstack |
|---|---|---|
| OCR | Runs in browser (slow, heavy WASM) | Server-side with `sharp` image preprocessing for better accuracy |
| Auth | Clerk token used only for Supabase RLS | Clerk JWT verified in Express middleware on every route |
| Stats | Computed in JS from all loaded expenses | Computed server-side via SQL aggregations |
| Data access | Client holds Supabase anon key | Client never touches Supabase; only Express (service-role) |
| Validation | None | Zod schemas on every route |
| Error handling | Try/catch per component | Central Express error handler with typed AppError |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | Zustand |
| Charts | Recharts |
| Auth | Clerk (frontend + backend) |
| Backend | Express 5, TypeScript, tsx |
| OCR | Tesseract.js + Sharp (server-side) |
| Database | Supabase (PostgreSQL) |
| Validation | Zod |

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses (filterable) |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| DELETE | `/api/expenses` | Bulk delete (body: `{ids:[]}`) |
| GET | `/api/budgets` | List budgets |
| PUT | `/api/budgets` | Upsert budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| POST | `/api/scanner/ocr` | Upload image → OCR → ParsedReceipt |
| POST | `/api/scanner/upload` | Upload image → Supabase Storage URL |
| GET | `/api/stats/monthly` | Monthly totals + category breakdown |
| GET | `/api/stats/daily` | Daily totals (last N days) |
| GET | `/api/stats/trend` | Monthly totals for last N months |
| GET | `/health` | Health check |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd expensify-fullstack
npm run install:all
```

### 2. Set up Clerk

1. Create a project at [clerk.com](https://clerk.com)
2. Copy the **Publishable Key** and **Secret Key**

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `server/migrations/001_initial.sql`
3. Copy **Project URL**, **anon key**, and **service role key** from Settings → API

### 4. Configure environment variables

**Server:**
```bash
cd server && cp .env.example .env
```
```env
PORT=3001
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLIENT_URL=http://localhost:5173
```

**Client:**
```bash
cd client && cp .env.example .env
```
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 5. Run

```bash
# From the root — starts both server (3001) and client (5173)
npm run dev
```

The Vite dev server proxies `/api` → `http://localhost:3001` automatically.

## Building for Production

```bash
npm run build
```

- Client output: `client/dist/` — deploy to Vercel, Netlify, or any static host
- Server output: `server/dist/` — deploy to Railway, Render, Fly.io, or any Node.js host
- Set `CLIENT_URL` on the server to your production frontend domain

## Deployment Notes

- The server uses the **Supabase service-role key** — never expose it client-side
- The client only needs the **Clerk publishable key** — safe to expose
- All API routes require a valid Clerk JWT — no unauthenticated access
