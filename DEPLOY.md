# Deployment Guide (Vercel + pnpm)

This project is intended to be deployed on Vercel.

## 1) Build settings
- **Framework Preset:** Vite
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`

## 2) Environment variables
Set these in **Vercel → Project Settings → Environment Variables**.

### Client variables (exposed to browser)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional)

### Server-only variables (never use `VITE_` prefix)
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACTION_KEY`

### Supabase Edge Function variables (`send-collab-proposal`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (required if email delivery is enabled)

## 3) Admin flow
- Frontend calls `/api/admin/*` endpoints.
- Vercel API routes validate the admin session and `ADMIN_ACTION_KEY`.
- Privileged operations run only on the server using `SUPABASE_SERVICE_ROLE_KEY`.

## 4) Security reminders
- Do **not** commit `.env` files.
- Use `.env.example` as a safe template.
- Rotate any key that may have been committed previously.


## 5) Supabase migrations and function config
- Apply new SQL migrations in Supabase (SQL Editor or `supabase db push`) before production deploys.
- `send-collab-proposal` is configured with `verify_jwt = false` in `supabase/config.toml`; the function validates user auth internally via `supabase.auth.getUser()`.
