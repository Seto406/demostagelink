# RLS Policy Audit

**Date:** 2026-03-12
**Auditor:** Jules

## Scope
Verified Row-Level Security (RLS) policies for the following tables:
- `notifications`
- `favorites`
- `subscriptions`

## Findings

### Notifications (`public.notifications`)
- **Status:** RLS Enabled
- **Policies:**
  - `Users can view their own notifications`: Enforced via `USING (auth.uid() = user_id)`.
  - Insertions are typically handled by system triggers or admin functions (bypassing RLS via Service Role or Security Definer), or via explicit Admin policies (as seen in `20260311000000_fix_schema_and_fk.sql`).

### Favorites (`public.favorites`)
- **Status:** RLS Enabled
- **Policies:**
  - `Users can add their own favorites`: Enforced via `WITH CHECK (auth.uid() = user_id)`.
  - `Users can remove their own favorites`: Enforced via `USING (auth.uid() = user_id)`.
  - `Anyone can view favorites`: Publicly readable (`USING (true)`).

### Subscriptions (`public.subscriptions`)
- **Status:** RLS Enabled
- **Policies:**
  - `Users can view own subscription`: Enforced via `USING (auth.uid() = user_id)`.
  - Creation/Updates usually handled by Payment Webhooks (Edge Functions) using Service Role.

## Actions Taken
- Created migration `supabase/migrations/20260312000001_ensure_rls_and_cache.sql` to re-assert these policies and force a Schema Cache reload (`NOTIFY pgrst, 'reload config'`).

## Recommendations
- Run the schema cache reload migration whenever new tables or columns are added to ensure PostgREST is aware of them immediately.
- Regularly verify that `user_id` columns reference `auth.users` correctly to avoid orphan records or foreign key issues.
