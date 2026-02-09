# 📋 Pending Tasks & Fixes Checklist

The following items have been identified as necessary fixes or pre-launch requirements for StageLink.

## 🔴 Critical / High Priority

- [ ] **Environment Configuration (PayMongo)**
    -   **Issue**: The application is currently configured with PayMongo **Test Keys** (`sk_test_...`, `pk_test_...`) in `.env.local` (or equivalent).
    -   **Action**: Replace these with **Live Keys** (`sk_live_...`, `pk_live_...`) in the production environment variables before official launch.
    -   **Verification**: Ensure successful real-money transactions can be processed (or verify keys are loaded).

- [ ] **User Identity (Audience)**
    -   **Issue**: Audience users (and non-Producer users) currently have **no way to set a username or display name**. The `Settings` page only allows editing `group_name` for Producers. Comments display as "User" fallback.
    -   **Action**: Add a `username` input field to the `Settings` page available to all user roles.
    -   **Status**: In Progress.

## 🟡 Maintenance / Technical Debt

- [ ] **Hardcoded Pricing**
    -   **Issue**: Subscription pricing (`₱399`) is hardcoded in multiple places (`useSubscription.ts`, `PricingSection.tsx`).
    -   **Action**: Centralize pricing configuration into a single config file (`src/config/pricing.ts`).
    -   **Status**: In Progress.

- [ ] **Auth Signup Fields**
    -   **Issue**: The signup form (`AuthForm.tsx`) only collects Email and Password. It does not ask for a Name.
    -   **Action**: Consider adding a "Name" field to the signup form, or rely on the `Settings` page update (above) to allow users to set it post-signup.

## 🟢 Enhancements (Post-Launch)

- [ ] **Profile Customization**
    -   Allow Audience users to set a `description` or `bio`.
-   **Email Templates**
    -   Verify all email templates use the correct dynamic variables for user names once the `username` field is active.
