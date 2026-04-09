# StageLink Data Architecture & Flow

This document outlines the data scheme, entity relationships, and critical data flows for the StageLink application. It serves as a reference for what needs to be configured in Supabase to support the website's functionality.

## 1. Core Data Entities (Schema)

StageLink uses a relational model hosted on Supabase (PostgreSQL). Below are the primary tables and their purposes.

### Identity & Profiles
*   **`auth.users`** (Supabase Managed): Handles authentication (Email/Password, OAuth).
*   **`public.profiles`**: Extends user data.
    *   **Link**: `user_id` references `auth.users(id)`.
    *   **Key Fields**: `role` ('audience' | 'producer' | 'admin'), `username`, `xp`, `rank`, `niche`.
    *   **Purpose**: Stores application-specific user data and gamification stats.

### Content
*   **`public.shows`**: The core content entity.
    *   **Link**: `producer_id` references `public.profiles(id)`.
    *   **Key Fields**: `title`, `description`, `status` ('pending' | 'approved' | 'rejected'), `price`, `video_url`.
    *   **Purpose**: Stores show metadata. Producers create these; Admins approve them.

### Commerce
*   **`public.payments`**: Records financial transactions.
    *   **Link**: `user_id` references `public.profiles(id)`.
    *   **Key Fields**: `amount`, `status` ('pending' | 'paid' | 'failed'), `paymongo_checkout_id`.
    *   **Note**: This table exists in migrations (`20260221000000_paymongo_payments.sql`) but may be missing from `src/integrations/supabase/types.ts`.
*   **`public.tickets`**: Grants access to a show.
    *   **Link**: `user_id` references `public.profiles(id)`, `show_id` references `public.shows(id)`, `payment_id` references `public.payments(id)`.
    *   **Purpose**: Proof of purchase. Existence of a record here grants the user access to watch the show.

### Social & Engagement
*   **`public.favorites`**: User bookmarks for shows.
*   **`public.activities`**: Timeline events for the "Feed" (e.g., "User X reviewed Show Y").
*   **`public.badges`** & **`public.user_badges`**: Gamification system.
*   **`public.groups`** & **`public.group_members`**: Theater groups management.

---

## 2. Critical Data Flows

### A. User Signup & Initialization
1.  **Auth**: User signs up via Email or Google. Supabase creates a record in `auth.users`.
2.  **Profile Creation**:
    *   **Mechanism**: The frontend (`AuthContext.tsx`) calls `ensureProfile` to check for a `public.profiles` record.
    *   **Fallback**: If not found, it inserts a new row into `public.profiles` with default values (Role: 'audience').
    *   **Email**: An Edge Function (`send-welcome-email`) is invoked to welcome the user.

### B. Show Creation & Approval
1.  **Submission**: A Producer submits a show via the Dashboard.
2.  **State**: A record is created in `public.shows` with `status: 'pending'`.
3.  **Review**: An Admin reviews the show in the Admin Panel.
4.  **Approval**: Admin updates `status` to `'approved'`. The show becomes visible in the public directory and search.

### C. Ticket Purchase (Commerce Flow)
1.  **Initiation**: User clicks "Buy Ticket". Frontend calls PayMongo API to create a checkout session.
2.  **Record Keeping**: A record is created in `public.payments` with `status: 'pending'`.
3.  **Completion**: User completes payment on PayMongo's hosted page.
4.  **Verification**:
    *   **Option A (Webhook)**: PayMongo calls a Supabase Edge Function (`paymongo-webhook`) which verifies the event and updates `public.payments` to `'paid'` and inserts a row into `public.tickets`.
    *   **Option B (Client - Less Secure)**: Frontend receives success callback, updates payment status, and creates ticket. *Note: Webhook is recommended for production security.*

---

## 3. What to Give Supabase

To support this architecture, your Supabase project requires:

### 1. Database Schema (Migrations)
Run the migration files located in `supabase/migrations/` in order. Crucial files include:
*   `init_profiles_groups_analytics.sql` (Base structure)
*   `20260221000000_paymongo_payments.sql` (Commerce)
*   `20260224000000_tickets_and_price.sql` (Ticketing)

### 2. Row Level Security (RLS) Policies
You must define policies to secure data:
*   **Profiles**: Users can update their own profile. Everyone can read public profiles.
*   **Shows**:
    *   Public can read `status = 'approved'`.
    *   Producers can CRUD their own shows.
    *   Admins can CRUD all shows.
*   **Tickets**: Users can read their own tickets.

### 3. Edge Functions
Deploy these functions to handle server-side logic:
*   `send-welcome-email`: For onboarding.
*   `send-show-reminder`: Cron job for engagement.
*   `paymongo-webhook`: (If implemented) To securely handle payment callbacks.

### 4. Storage Buckets
Create public buckets for media:
*   `avatars`: User profile pictures.
*   `show-posters`: Show promotional images.

---

## Maintenance Note
The TypeScript types in `src/integrations/supabase/types.ts` should be periodically regenerated to match the current database schema, especially regarding the `payments` table which appears to be missing in the current type definition.
