#!/bin/bash
pkill -f vite || true
pnpm install
pnpm exec playwright install
pnpm dev --port 5173 > /tmp/server.log 2>&1 &
echo "Waiting for server..."
sleep 15
npx playwright test verification/verify_profile.spec.ts
