# Playwright Browser Unblock Guide

When `pnpm test:e2e` fails with missing Chromium executable or browser download errors (e.g. CDN 403), use one of these options.

## Option 1 (recommended in CI): Playwright Docker image

```bash
docker run --rm -it \
  -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.58.2-jammy \
  bash -lc "pnpm install --frozen-lockfile && pnpm test:e2e"
```

## Option 2: Alternate download host for Playwright-managed browser

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net pnpm exec playwright install chromium
```

If needed, try:

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.download.prss.microsoft.com pnpm exec playwright install chromium
```

## Option 3: Use system Chromium and point Playwright to it

Install Chromium with your OS package manager, then run:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e
```

The Playwright config now supports this env var and will use the provided executable path for the `chromium` project.
