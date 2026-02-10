# Application Routing Map

This document outlines the current active routes in the application, including public and protected paths, and specific user flows.

## 1. Public Routes (Accessible to Guests)

These pages are accessible to anyone without logging in.

| Route | Component | Description | Redirects (if logged in) |
| :--- | :--- | :--- | :--- |
| `/` | `Index` | The Landing Page showing mission, features, pricing, etc. | Redirects to `/feed` |
| `/login` | `Login` | Login/Signup page. | Redirects to `/feed` (Audience) or `/dashboard` (Producer) |
| `/directory` | `Directory` | List of theater groups. | None |
| `/shows` | `Shows` | List of all productions with filters. | None |
| `/show/:id` | `ShowDetailsPage` | Detailed view of a specific show (Ticketing). | None |
| `/producer/:id` | `ProducerProfile` | **Active** dynamic profile page for a theater group. Shows "Follow" button and productions. | None |
| `/group/:id` | `GroupProfile` | **Legacy/Demo** static profile page (e.g., for `demo-1`). Not used for real users. | None |
| `/about` | `About` | About page. | None |
| `/privacy` | `Privacy` | Privacy Policy. | None |
| `/terms` | `Terms` | Terms of Service. | None |
| `/verify-email` | `VerifyEmail` | Email verification landing page. | None |
| `/reset-password` | `ResetPassword` | Password reset page. | None |

## 2. Protected Routes (Requires Login)

These pages require an authenticated session. Accessing them while logged out typically redirects to `/login`.

| Route | Component | Description |
| :--- | :--- | :--- |
| `/feed` | `UserFeed` | The main user feed showing posts from followed producers. |
| `/dashboard` | `Dashboard` | The Producer Dashboard for managing shows and profile. |
| `/settings` | `Settings` | User settings (profile, account). |
| `/notifications` | `Notifications` | User notifications. |
| `/favorites` | `Favorites` | List of favorited shows. |
| `/profile` | `Profile` | The current user's profile (Audience view). |
| `/profile/:id` | `Profile` | Viewing another user's profile (Audience view). |
| `/admin` | `AdminPanel` | Admin dashboard (requires 'admin' role). |

## 3. The 'Social Ticketing' Flow Audit

### Feed
*   **Route:** `/feed`
*   **Content:** Displays `FeedPost` components for approved shows.
*   **Status:** Active.
*   **Fixes Applied:** Links to producer profiles now correctly point to `/producer/:id` (Dynamic) instead of `/group/:id` (Static Demo).

### Show Details (Ticketing)
*   **Route:** `/show/:id`
*   **Features:**
    *   Displays Show Poster, Title, Description, Cast.
    *   **"Get Tickets" Button:**
        *   If `price > 0`: Initiates PayMongo checkout.
        *   If `ticket_link` exists: Opens external link.
        *   Else: Shows "Tickets Coming Soon".
*   **Video Player:** **None.** Confirmed absence of video player/streaming interface.
*   **Status:** Active and aligned with Ticketing Pivot.

### Group Profile
*   **Route:** `/producer/:id` (Note: User queried `/u/[group_name]`, which does not exist).
*   **Features:**
    *   Displays Group Name, Avatar, Description, Niche.
    *   **"Follow" Button:** Active. Allows users to subscribe to the group.
    *   **Productions:** Lists Current and Past productions.
*   **Status:** Active. This is the correct route for real theater groups.

## 4. Notable Findings

*   **`/u/[group_name]`**: This route **does not exist**. The application uses UUID-based routing: `/producer/[uuid]`.
*   **Dead Ends Fixed**: The "Suggested Producers" widget in the Feed and the Producer links in Feed Posts previously linked to `/group/[uuid]`, which resulted in a 404/Not Found on the static Group Profile page. These have been updated to link to `/producer/[uuid]`.
*   **Video Player**: No video player components were found in the Show Details page, confirming the removal of streaming features.
