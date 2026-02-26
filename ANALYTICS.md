# Analytics Dashboard

The Analytics Dashboard provides producers with insights into their profile and show performance. It is integrated into the main Dashboard.

## Overview

The dashboard displays the following key metrics:
1.  **Total Profile Views**: The number of times your profile or shows have been viewed.
2.  **Total Ticket Clicks**: The number of clicks on ticket links.
3.  **Click-Through Rate (CTR)**: The percentage of viewers who clicked on a ticket link.
4.  **Ticket Clicks Chart**: A line chart showing ticket clicks over the last 7 days.
5.  **Pending Ticket Verifications**: A warning banner if there are tickets awaiting manual payment verification (admin approval).

## How It Works

### Data Sources
The dashboard fetches data from two primary sources:

1.  **`get_analytics_summary` RPC Function**:
    -   This is a custom Postgres function in Supabase.
    -   It aggregates data from `analytics_events` table (or similar tracking tables) to calculate views, clicks, and CTR.
    -   It returns a JSON object containing `views`, `clicks`, `ctr`, and `chartData`.

2.  **`tickets` Table**:
    -   It queries the `tickets` table to count tickets with `status='pending'` associated with the producer's shows.
    -   This is used to alert producers about pending manual payments that need admin attention.

### Access Control (Pro Tier)
-   The detailed analytics are restricted to users with an active **Pro Subscription**.
-   The frontend checks the subscription status using the `useSubscription` hook.
-   **If Pro**: The dashboard fetches and displays the data.
-   **If Free**: The dashboard displays a "Locked" overlay with an "Upgrade to Pro" call-to-action.

## How to Trigger

1.  **Navigate to Dashboard**: Log in as a Producer and go to `/dashboard`.
2.  **Scroll to Analytics**:
    -   The analytics section is located below the profile header ("Zone 2: Stats").
    -   You can quickly jump to it by clicking the **"Analyze Production"** button in the "Quick Actions" panel.
3.  **View Data**:
    -   If you have data, it will appear automatically.
    -   If you are a new user with no activity, it may show a placeholder message ("Your stats will appear once...").

## Troubleshooting

-   **No Data Showing**: Ensure you have active shows and traffic. If the account is new, this is normal.
-   **Locked Overlay**: Verify your subscription status in `Settings` -> `Subscription`.
-   **Pending Tickets Warning**: This appears only if guests have requested manual payments (e.g., cash/transfer) that haven't been marked as paid by an admin yet.
