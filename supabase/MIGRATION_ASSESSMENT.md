# Migration Assessment - Phase 4 Clean Sweep

## Status: Squashing Deferred

### Assessment
As part of the "Clean Sweep" for Phase 4, we evaluated the possibility of squashing the existing 40+ migration files into a single `init_schema.sql` to speed up local development.

**Decision:** We have decided **not** to squash the migrations at this time.

### Reasoning
1.  **Safety & Data Integrity:** Squashing migrations without a verified database dump of the current production schema carries a high risk of schema drift or data loss. Since we do not have a direct dump of the production database state to verify against, manually concatenating or reconstructing the schema from migration files is error-prone.
2.  **Supabase Compatibility:** Supabase local development relies on the migration history to apply changes correctly. Removing old migrations without a perfect replacement `init` script would break local environments that attempt to reset.
3.  **Future Action:** This task should be revisited when a full database dump can be obtained from the production environment (e.g., via `supabase db dump`). Once a verified schema dump is available, it can be used to create a reliable `init_schema.sql`, and old migrations can be safely archived.

### Current State
-   All existing migration files (2024-2026) remain in `supabase/migrations/`.
-   No changes have been made to the database schema definition as part of this cleanup.
