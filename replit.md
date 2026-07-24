# منصة سند التجريبية

بوابة أمارة منطقة المدينة المنورة التجريبية مع مساعد ذكي يجيب استفسارات المستفيدين من ملفات اللوائح والأنظمة.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/gov-portal run dev` — run the web portal (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `GEMINI_API_KEY` — Google Gemini API key (used by the chatbot)
- Optional env: `GEMINI_MODEL` — Gemini model name (defaults to `gemini-2.0-flash`)
- Optional env: `NVIDIA_API_KEY` — NVIDIA NIM API key (fallback AI provider)
- Optional env: `NVIDIA_MODEL` — NVIDIA NIM model name (defaults to `meta/llama-3.1-8b-instruct`)
- Optional env: `NVIDIA_BASE_URL` — NVIDIA NIM base URL (defaults to `https://integrate.api.nvidia.com/v1`)
- Optional env: `CHAT_MODE` — `ai` (default) tries NVIDIA NIM first, then Gemini, then falls back to direct Excel answers; `direct` returns answers straight from the Excel knowledge base only
- Optional env: `DATABASE_URL` — Postgres connection string (not currently used by the chatbot)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
