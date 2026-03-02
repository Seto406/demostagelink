# Full Website Scan Report (2026-03-02)

## Scope
Performed a full scan using available local quality checks and end-to-end test suite:

1. `pnpm lint`
2. `pnpm build`
3. `pnpm test:e2e`

## Findings

### 1) Lint warnings (non-blocking, but quality issues)
`pnpm lint` passed with **16 warnings** and **0 errors**.

Main warning categories:
- Unused `eslint-disable` directives across test and app files.
- React fast-refresh warning in files exporting non-component utilities from component files.

### 2) Production build
`pnpm build` succeeded. The app compiles and bundles without TypeScript/build-time errors.

### 3) E2E scan failures (blocking for browser-based validation)
`pnpm test:e2e` failed with **24/24 failing tests**.

Root causes observed:
- **Missing Playwright browser binary**: Chromium executable not installed in environment (`browserType.launch: Executable doesn't exist ...`).
- **Missing Supabase environment variables** in payment test (`Error: supabaseUrl is required`).

Because of these environment blockers, browser interaction coverage could not be executed end-to-end in this run.

## Error Summary

- Runtime E2E setup error:
  - Install browsers: `pnpm exec playwright install`
- Environment configuration error:
  - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` (or CI secrets) before running payment-related E2E tests.

## Recommended Next Steps

1. Install Playwright browsers in CI/dev scan environment.
2. Provide required Supabase test credentials via environment variables.
3. Re-run `pnpm test:e2e` after setup to collect actual UI/runtime regressions.
4. Optionally clean lint warnings (`pnpm lint --fix` + manual follow-up for React refresh exports).
