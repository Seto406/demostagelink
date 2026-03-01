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
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (required if email delivery is enabled)
- `SITE_URL` (optional; defaults to `https://www.stagelink.show`)
- `ADMIN_ACTION_KEY`

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
- Collaboration proposals now run through Vercel API route `POST /api/send-collab-proposal`; no Supabase Edge Function deployment is required for this flow.

## 6) Email smoke test (cloud-only)
This repo includes a consolidated production-safe smoke test endpoint at `POST /api/email-smoke-test`.

### Required environment variables
Set in **Vercel**:
- `ADMIN_ACTION_KEY`
- `RESEND_API_KEY`
- `SUPABASE_PROJECT_REF`
- `SMOKE_TEST_KEY`

Set in **Supabase Edge Function env** (`send-notification-email`):
- `RESEND_API_KEY`
- `SMOKE_TEST_KEY` (must exactly match the Vercel value)

### Safety guardrails
- The smoke test only accepts these recipients, mapped from `scenario`:
  - `delivered@resend.dev`
  - `bounced@resend.dev`
  - `complained@resend.dev`
  - `suppressed@resend.dev`
- Arbitrary emails are hard-blocked.

### Trigger from GitHub Actions
Run workflow **Email Smoke Test** (`.github/workflows/email-smoke.yml`) with:
- `scenario`: `delivered | bounced | complained | suppressed`
- `test`: `collab | notification | both`

Required GitHub secrets:
- `SITE_URL` (deployed base URL)
- `ADMIN_ACTION_KEY`

### Trigger with curl
```bash
curl -X POST "${SITE_URL}/api/email-smoke-test" \
  -H "Authorization: Bearer ${ADMIN_ACTION_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"scenario":"delivered","test":"both"}'
```
