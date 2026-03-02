# Email + Notification Full Scan (Static + Local Checks)

Date: 2026-03-02

## Scope Reviewed

- Frontend notification insert + realtime handling:
  - `src/lib/notifications.ts`
  - `src/contexts/NotificationContext.tsx`
- Email test surfaces:
  - `src/pages/TestEmail.tsx`
  - `src/pages/TestNotifications.tsx`
  - `.github/workflows/email-smoke.yml`
- Supabase Edge email/notification functions:
  - `send-notification-email`
  - `send-show-notification`
  - `send-show-reminder`
  - plus all functions matching `api.resend.com/emails` usage for consistency checks.

## What I Checked

1. Invocation paths from app to edge functions.
2. Authorization paths for admin-only notification endpoints.
3. Resend API request/response handling patterns.
4. Realtime notification subscription wiring.
5. Existing smoke-test workflow coverage.

## Findings

### ✅ Working paths observed

- UI can create notifications without blocking user flow even if insert fails (safe failure behavior).
- Notification unread count + realtime subscription are wired to `notifications` table changes.
- There is a manual smoke workflow for email scenarios (`delivered`, `bounced`, `complained`, `suppressed`).

### ⚠️ Reliability gap fixed

- In `send-show-reminder`, the code previously marked `reminder_sent = true` even when one or more email sends failed.
- This could suppress retries and make reminders appear "sent" when they were only partially delivered.

## Fix Applied

Updated `supabase/functions/send-show-reminder/index.ts` to:

1. Fail fast when `RESEND_API_KEY` is missing.
2. Capture per-recipient send failures when Resend responds non-2xx.
3. Set `reminder_sent` only if all attempted sends for the show succeeded.
4. Return structured per-email results including `error` when applicable.

## Local Verification Run

- `pnpm -s eslint supabase/functions/send-show-reminder/index.ts` passed.
- `pnpm -s lint` passed with existing unrelated warnings.

## Overall Status

- Core notifications flow appears correctly wired.
- Email system is generally functional by design, with one reminder idempotency/retry reliability bug now fixed.
- Full end-to-end delivery confirmation still requires deployed env secrets and live function invocation (covered by existing smoke workflow).
