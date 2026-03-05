# Theater Groups vs Profiles: Domain Analysis and Forward Recommendations

## Executive Summary

You currently have **two partially-overlapping models for producer identity**:

- `profiles`: user/account-level record that still carries group-facing fields (`group_name`, `group_logo_url`, `group_banner_url`).
- `theater_groups`: organization-level record with near-identical fields (`name`, `logo_url`, `banner_url`, `description`) and ownership to `profiles.id`.

This overlap creates source-of-truth ambiguity, synchronization risk, and policy complexity. A durable fix is to make `profiles` the **person/account** aggregate and `theater_groups` the **organization/brand** aggregate, then migrate read/write paths in phases.

---

## Current-State Logic Findings

## 1) Field overlap is real and structural

`profiles` currently stores group-like fields (`group_name`, `group_logo_url`, `group_banner_url`, `description`).【F:full_schema.sql†L30-L44】

`theater_groups` stores equivalent group-brand fields (`name`, `logo_url`, `banner_url`, `description`) with separate lifecycle timestamps and owner relation.【F:full_schema.sql†L53-L62】

A migration explicitly copied producer profile fields into `theater_groups`, confirming duplication was intentionally introduced for backward compatibility.【F:supabase/migrations/20260408000000_infrastructure_build.sql†L21-L33】

## 2) Mixed identifiers increased policy fragility

Initial theater-group policies compared `auth.uid()` directly to `owner_id` (where `owner_id` is `profiles.id`), which are different identifier domains.【F:supabase/migrations/20260408000000_infrastructure_build.sql†L52-L54】

Later fixes remapped auth user to profile via `profiles.user_id = auth.uid()` before checking ownership, which is correct and reveals prior mismatch risk.【F:supabase/migrations/20260616000000_fix_theater_groups_insert_rls.sql†L7-L15】

## 3) Group relations are still profile-centric in other tables

`group_members.group_id` references `profiles(id)`, not `theater_groups(id)`. This means the “group” identity in membership logic still points at profile records rather than org records.【F:full_schema.sql†L291-L301】

## 4) Shows now support org linkage, but ownership semantics are dual

`shows` got `theater_group_id` and backfill from `producer_id` via `theater_groups.owner_id`, while keeping `producer_id` checks for compatibility.【F:supabase/migrations/20260409000000_link_shows_to_groups.sql†L1-L14】

This is operationally safe short-term, but semantically means both person and organization can be treated as owner dimensions.

---

## Root Cause (Conceptual)

Your model evolved from **“a producer is the group”** to **“a producer can own/operate a group”**, but schema and policies still support both mental models simultaneously.

That “dual ontology” is what causes confusion:

- same business concept represented in two tables;
- same UI fields backed by different columns depending on code path;
- same permission intent implemented with multiple relation chains.

---

## Recommended Target Domain Model

## A) Clear bounded contexts

1. **Profile (`profiles`) = person/account identity**
   - login-linked (`user_id`), display username/avatar, personal bio, personal links.
2. **Theater Group (`theater_groups`) = organization identity**
   - brand name, org description, logos/banners, org links, premium status, discovery metadata.
3. **Membership (`group_members` or `group_memberships`) = relationship**
   - profile ↔ theater_group with role, permission, status, and invitation lifecycle.

## B) Source-of-truth rules

- Group-facing fields live only in `theater_groups`.
- Person-facing fields live only in `profiles`.
- Derived copies (if any) should be explicitly denormalized cache columns, never primary writable columns.

## C) Ownership cardinality decision (must choose explicitly)

Pick one and enforce it with constraints:

- **Option 1: one owner profile per group (current shape)** + members for collaborators.
- **Option 2: many-to-many admins via membership roles**, with `owner_id` optional or immutable bootstrap value.

If product direction includes co-founders and staff-admin workflows, Option 2 is usually future-proof.

---

## Schema Recommendations (Future-Proof)

## 1) Normalize group identity

- Keep (or add) `theater_groups.slug` unique for routing.
- Add `theater_groups.updated_at` trigger if not globally guaranteed.
- Add optional contact/public fields to `theater_groups` (`website_url`, `facebook_url`, `instagram_url`, `x_url`, `tiktok_url`, address fields) so org social presence does not stay in profiles.

## 2) Re-point memberships to organizations

- Migrate `group_members.group_id` FK from `profiles(id)` to `theater_groups(id)`.
- Rename to `theater_group_id` for semantic clarity.

## 3) Decommission duplicated profile columns

After rollout and parity checks:

- deprecate `profiles.group_name`, `profiles.group_logo_url`, `profiles.group_banner_url`.
- evaluate whether `profiles.description` should remain personal bio only.

## 4) Add invariants

- `theater_groups.owner_id` should reference an active profile.
- Unique active membership constraint: one active row per (`theater_group_id`, `user_id`).
- Optional soft-delete columns (`archived_at`) for groups and memberships.

---

## RLS/Authorization Recommendations

1. Standardize all ownership checks through one helper pattern:
   - `auth.uid()` → `profiles.user_id` → `profiles.id`.
2. Introduce reusable SQL helper function(s), e.g. `is_group_admin(group_id uuid)` to avoid repeated policy fragments.
3. Prefer membership-role-based permissions over owner-only checks for update/delete once staff roles are required.
4. Keep public `SELECT` permissive only for intended public columns/views.

---

## Read/Write Path Strategy (Phased, Low-Risk)

## Phase 0: Observe

- Instrument where app reads `profiles.group_*` vs `theater_groups.*`.
- Build drift report query for mismatched values.

## Phase 1: Dual-write with theater_groups primary

- UI writes group edits to `theater_groups` first.
- Temporary trigger or app-level sync writes old profile columns for compatibility.

## Phase 2: Read-switch

- Migrate all read paths (public pages, dashboards, admin exports) to `theater_groups`.
- Keep profile fallback only for legacy null records.

## Phase 3: Contract tighten

- Block writes to deprecated profile group columns (trigger or API validation).
- Backfill remaining null groups.

## Phase 4: Remove legacy columns

- Drop deprecated `profiles.group_*` fields after one stable release window and backup snapshot.

---

## Practical SQL Worklist (Suggested)

1. Add new org-level columns and indexes in `theater_groups`.
2. Create migration to map `group_members.group_id` → `theater_groups.id`.
3. Add compatibility view for legacy queries:
   - `producer_group_view` exposing canonical group data by profile.
4. Add drift-detection check in CI/admin script.
5. Decommission profile group columns once zero legacy readers remain.

---

## Data Governance & Product Recommendations

- Publish a short **data contract doc**: “What lives in Profile vs Theater Group”.
- Add schema-level comments and naming conventions (`*_profile_id`, `*_group_id`) to prevent identifier confusion.
- Require migration PR template section: “source of truth impact”.
- Add regression tests for RLS on group create/update using auth-user-to-profile mapping.

---

## Decision Checklist (for your next planning meeting)

- Do you support one group per producer or multiple groups per user?
- Can a group have multiple admins with equal rights?
- Are public social links person-level, org-level, or both?
- Should shows belong to a group, a producer, or always both?
- Do you need historical ownership/audit trail when owner changes?

Answering these five explicitly will eliminate most of the long-term schema confusion.

---

## Direct Answer: “If we do this now, will it break the current system?”

Short answer: **not if you execute as an additive, phased migration**.

The highest-risk actions are:

- changing existing FKs in-place;
- removing legacy columns too early;
- switching RLS logic in one shot without compatibility checks.

To avoid breakage, do this as **expand → migrate → contract**:

1. **Expand (non-breaking):** add new columns/tables/policies first; keep legacy reads/writes intact.
2. **Migrate (controlled):** dual-write and backfill in batches; compare old/new values for parity.
3. **Contract (after evidence):** remove legacy paths only after telemetry confirms no readers.

If you follow this sequence, the current product should continue operating while architecture improves.

## “Can we make it run better now and for the future?”

Yes. You can improve reliability/performance immediately while preparing the long-term model.

## Immediate wins (low risk, high value)

1. **Canonical read view**
   - Add a view that resolves canonical group info from `theater_groups`, with legacy fallback from `profiles`.
   - Move app reads to the view first to reduce branchy query logic.

2. **Drift detector job**
   - Daily/CI query that reports mismatches between profile-group legacy fields and theater-group canonical fields.
   - This gives objective migration readiness.

3. **RLS helper function**
   - Centralize auth-to-profile mapping and group-admin checks in helper SQL functions.
   - Reduces policy bugs and duplicated policy SQL.

4. **Targeted indexes**
   - Ensure indexes exist on membership and ownership paths used by RLS and dashboards:
     - `theater_groups(owner_id)`
     - `group_members(theater_group_id, user_id, status)` (post-rename)

## Chosen Direction Confirmed: “Theater group for many (FB Page style admins)”

Given your decision, the recommended end-state is:

- `theater_groups` is the **single org identity source**.
- `profiles` stays **person/account identity**.
- admins/editors are represented in membership rows + role/permission fields.
- `owner_id` can remain as bootstrap/primary owner, but day-to-day authorization should be role-based (multiple admins).

### Suggested membership role model

- `owner` (1 minimum, transfer-capable)
- `admin` (manage profile, shows, members)
- `editor` (manage content/shows, limited member management)
- `member` (basic association)

### Authorization rule-of-thumb

- Replace “owner only” checks with `is_group_admin_or_owner(group_id)` for updates/deletes.
- Keep owner-only for destructive actions like ownership transfer or archive.

## Safe Rollout Blueprint (Zero-Downtime Lean Version)

### Phase A (week 1): Additive schema + compatibility
- Add membership role/permission columns needed for multi-admin behavior.
- Add compatibility view(s) and helper auth functions.
- Keep existing app behavior unchanged.

### Phase B (week 1–2): Dual-write + read migration
- Group settings writes go to `theater_groups` and legacy profile fields.
- Read paths switch to canonical view.
- Track drift and endpoint error rates.
- Implement DB-level sync trigger from `theater_groups` to legacy `profiles.group_*` during transition.
- Keep `profiles.description` out of sync scope unless you explicitly decide org description should overwrite personal bios.

### Phase C (week 2): Membership/RLS migration
- Repoint group membership semantics to `theater_groups` identifiers.
- Roll out role-based RLS policies behind feature flag where possible.
- Verify via policy tests for owner/admin/editor/member personas.
- Add helper functions such as `is_group_editor_or_above(group_id)` and `can_manage_group_members(group_id)` to keep policy SQL centralized.
- Add explicit policies on `group_members.theater_group_id` for select/insert/update/delete with role-aware checks.

### Phase D (week 3+): Legacy removal
- Freeze legacy profile group fields (reject writes).
- Remove fallback logic.
- Drop deprecated columns in a separate migration window.

## Release Readiness Gates (must pass before destructive changes)

- Drift report = zero unresolved mismatches for agreed window (e.g., 7 days).
- All group-facing API endpoints reading canonical source.
- RLS regression tests green for all roles.
- Dashboard/admin queries no longer depend on deprecated profile-group fields.
- Rollback script prepared for latest migration step.

With these gates, you can improve the system **now** (less confusion, safer policies) while building a multi-admin group model that scales cleanly.

## Operational Verification (after applying Phase A)

Run the post-apply checklist SQL at:

- `scripts/verify_phase_a_group_model.sql`

It validates presence of additive columns, constraints, indexes, helper functions, compatibility/drift views, and gives a backfill coverage snapshot plus unresolved mapping diagnostics.

## Operational Verification (after applying Phase C)

- `scripts/verify_phase_c_rls.sql`
