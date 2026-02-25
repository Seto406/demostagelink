# Implementation Report: Producer Tier Locking (Feature Gating)

## Overview
This report details the implementation of the "Feature Gating" phase for StageLink. The goal was to restrict certain Producer capabilities to the Premium Tier (₱399/month) while keeping the Basic Tier free, encouraging upselling via the `UpsellModal`.

## 1. Database Changes
*   **Migration**: Created `supabase/migrations/20260424000000_add_external_links_to_shows.sql` (renamed to avoid timestamp collision).
*   **Schema Update**: Added a new JSONB column named `external_links` to the `public.shows` table. This allows storing multiple external links per show (e.g., ticket links, streaming links).
*   **Data Backfill**: The migration includes a script to migrate existing `ticket_link` values into the new `external_links` array to prevent data loss.
*   **Types**: Updated `src/integrations/supabase/types.ts` to reflect the new column in the `Database` type definition.

## 2. Frontend Components & Logic

### A. Ticketing & Monetization Gating
*   **File**: `src/components/dashboard/ProductionModal.tsx`
*   **Implementation**:
    *   Used `useSubscription` hook to determine `isPro` status.
    *   **Lock**: The "Ticket Price" input field is visually disabled and interactive elements are intercepted for Basic users (`!isPro`).
    *   **Interceptor**: Clicking the locked input triggers the `UpsellModal` with the message: "Selling tickets directly through StageLink requires a Premium subscription."
    *   **Logic**: Since monetization is derived from a price > 0, locking the input effectively prevents Basic users from creating paid tickets.

### B. Content Gating (Multiple Links)
*   **File**: `src/components/dashboard/ProductionModal.tsx`
*   **Implementation**:
    *   Replaced the single `ticket_link` input with a dynamic list backed by the `external_links` state.
    *   **Lock**: Basic users can add only one link.
    *   **Interceptor**: The "Add another link" button checks if the user is Basic and already has one link. If so, it prevents the action and triggers the `UpsellModal` with: "Adding multiple links requires a Premium subscription."

### C. Analytics Gating
*   **Files**:
    *   `src/components/dashboard/DashboardSidebar.tsx`
    *   `src/pages/Dashboard.tsx`
    *   `src/components/dashboard/AnalyticsDashboard.tsx`
*   **Implementation**:
    *   **Sidebar**: Added a dedicated "Analytics" navigation item.
        *   **Lock**: Displays a lock icon if `!isPro`.
        *   **Interceptor**: Clicking the link triggers the `UpsellModal` instead of navigating.
    *   **Route Guard**: Added a `useEffect` in `Dashboard.tsx` to protect the `/dashboard/analytics` route.
        *   **Race Condition Fix**: Added an `!isLoading` check to ensure the redirect only happens after the subscription status is fully loaded, preventing premature kicks for Premium users.
    *   **View**: If an authorized Pro user accesses the route, the `AnalyticsDashboard` component is rendered.

### D. Guest List Gating
*   **File**: `src/pages/Dashboard.tsx`
*   **Implementation**:
    *   Added a "Guest List" button to each show card in the dashboard list.
    *   **Lock**: The button is visible to all but functions differently based on tier.
    *   **Interceptor**: For Basic users, clicking "Guest List" triggers the `UpsellModal` with: "Accessing guest lists requires a Premium subscription." Pro users are navigated to `/dashboard/guests/:showId`.

### E. Upsell Modal Enhancements
*   **File**: `src/components/dashboard/UpsellModal.tsx`
*   **Implementation**:
    *   Updated the component to accept optional props: `featureName`, `title`, and `description`.
    *   This allows for context-aware messaging (e.g., "Unlock Direct Ticketing with Premium") rather than a generic upsell message.

## 3. Verification
*   **Manual Testing**: Verified that all locks function correctly for Basic users and that features remain accessible for Premium users (simulated via `isPro` flag).
*   **Database**: Confirmed the migration runs successfully and the `external_links` column is available.
*   **Race Conditions**: Confirmed the route guard waits for `useSubscription` to load.

## 4. Next Steps
*   Ensure the `useSubscription` hook is fully integrated with the live payment/subscription backend (PayMongo/Stripe) when moving to production, as it currently may have hardcoded values for testing purposes.
