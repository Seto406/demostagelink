# QA Report – Full Website Check

Date: 2026-03-03

## Scope
- Static checks (lint, typecheck, production build)
- End-to-end suite execution
- Manual browser smoke test across key routes

## Checks run
1. `pnpm install`
2. `pnpm lint`
3. `pnpm exec tsc --noEmit`
4. `pnpm build`
5. `pnpm test:e2e`
6. `pnpm exec playwright install chromium`
7. Manual Playwright browser script against local dev server (`/`, `/shows`, `/about`, `/pricing`, `/login`, `/directory`)

## Results

### ✅ Passing
- Lint passed with no reported ESLint issues.
- TypeScript compile check passed with no type errors.
- Production build succeeded.
- Route smoke checks for `/shows`, `/about`, `/pricing`, `/login`, and `/directory` returned 200 and did not render a 404 state.

### ⚠️ Issues found
1. **Supabase client is not configured in local environment**
   - Browser console repeatedly logs:
     - `Missing Supabase client configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)...`
   - Impact:
     - Any features requiring Supabase are expected to be non-functional in this environment.
   - Likely fix:
     - Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through `.env` or `window.__APP_CONFIG__`.

2. **Automated E2E tests cannot run due missing Playwright browser binary**
   - `pnpm test:e2e` failed because Chromium executable is absent.
   - Attempting to install with `pnpm exec playwright install chromium` failed with HTTP 403 from Playwright CDN in this environment.
   - Impact:
     - Full automated browser QA is blocked by environment/browser provisioning.

3. **External resources DNS resolution failures in browser session**
   - Console contains `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`.
   - Impact:
     - Some third-party assets or endpoints are unreachable from this runtime, potentially affecting analytics/images/scripts depending on the host.

## Overall assessment
- The app compiles and serves correctly for core public routes.
- The biggest blockers to a truly "full" QA in this environment are:
  1) missing Supabase environment variables, and
  2) inability to install Playwright browser binaries (CDN 403).

## Recommended next actions
1. Add valid Supabase env vars for local/dev CI.
2. Configure a mirror/cache for Playwright browser downloads or pre-bake the browser into CI images.
3. Re-run `pnpm test:e2e` once browser provisioning works.
