# StageLink - User Flows & Experience

This document outlines the core user flows and experiences within the StageLink platform, covering Onboarding, Audience, Producer, and Admin journeys.

## 1. Onboarding Experience (Global Tour)

New users (or those who restart the tour) are guided through the platform's key features via an interactive tour powered by `react-joyride`.

### Flow Steps:
1.  **Homepage (Central Exposure Hub):**
    -   Introduction to the feed where producers share updates.
    -   Highlight: **Producer Updates** (automatic visibility).
    -   Highlight: **Audience Engagement** (likes/comments boost visibility).
    -   Highlight: **Suggested Groups** (recommendations).
    -   **Basic vs Premium:** Feed Visibility comparison.

2.  **Shows Page (Explore Productions):**
    -   Highlight: **Search & Filters** (Title, City, Type, Date).
    -   Highlight: **Sort by Status** (Upcoming, Ongoing, Completed).
    -   **Basic vs Premium:** Search & Discovery comparison.

3.  **Directory Page (Explore Groups):**
    -   Highlight: **Filters** (Local vs University).
    -   Highlight: **Join Request** (Audience can request to join groups).
    -   Highlight: **Collab Button** (Producers can connect).
    -   **Basic vs Premium:** Group Visibility comparison.

4.  **Dashboard (Producers Only):**
    -   Overview of the "Command Center".
    -   Highlight: **Analytics** (Views, Clicks, CTR).

5.  **Group Profile (Final Destination):**
    -   Highlight: **Group Info** (Logo, Description, Type).
    -   Highlight: **Location** (Map & City).
    -   Highlight: **Ensemble** (Linked Members).
    -   Highlight: **Follow Button** (Notifications & Calendar).
    -   Highlight: **Seat Commitment** (RSVP).
    -   Highlight: **Ticket Button** (External Links).
    -   **Basic vs Premium:** Show Listings & Engagement comparison.

---

## 2. Audience Journey

### A. Discovery
1.  **Landing Page:** Users land on the `Index` page or `UserFeed`.
2.  **Browse:** Users navigate to `Shows` or `Directory` to find content.
3.  **Search/Filter:** Users use search bars and filters (City, Genre, Date) to narrow down results.
4.  **View Details:** Clicking a card takes them to `ShowDetailsPage` (`/shows/:id`) or `GroupProfile` (`/group/:id`).

### B. Ticket Purchase (Manual Flow)
*For detailed payment logic, see `PAYMENT_FLOW.md`.*

1.  **Initiate:** User clicks "Get Tickets" on a Show page.
2.  **Checkout:** Redirects to `/checkout/:showId`.
    -   **Guest:** Enters Name & Email.
    -   **Logged In:** Auto-fills user details.
3.  **Payment:** User scans the Global QR Code displayed on screen.
4.  **Proof:** User uploads a screenshot of the payment receipt.
5.  **Submit:** Creates a `pending` ticket and `payment` record.
6.  **Wait:** User sees a success message instructing them to wait for email confirmation.

### C. Ticket Receipt & Usage
1.  **Notification:** User receives an email once Admin approves the payment.
2.  **Access:**
    -   **Email Link:** Click link to view ticket.
    -   **Profile:** Go to `Profile` -> `Tickets` tab.
3.  **Digital Pass:** View the `DigitalPass` component containing:
    -   Event Details (Title, Date, Venue).
    -   **QR Code:** Unique code for entry.
    -   Status: "Confirmed".

---

## 3. Producer Workflow

### A. Dashboard Overview
-   **Route:** `/dashboard`
-   **Brand Zone:** View Group Logo, Banner, Stats.
-   **Quick Actions:** Post Show, Manage Ensemble, Analyze, Restart Tour.
-   **Tabs:**
    -   **Approved:** Active shows.
    -   **Pending:** Shows under review.
    -   **Rejected:** Drafts or rejected submissions (with admin feedback).
-   **Notifications:** Incoming Collaboration Requests, Member Applications.

### B. Create/Edit Show
1.  **Action:** Click "Post a Show" or "Edit" on an existing card.
2.  **Form (ProductionModal):**
    -   **Title & Description:** Basic info.
    -   **Schedule:** Single Date vs Multi-Date Range (Select Days).
    -   **Venue:** Select from list or create new + City.
    -   **Type:** Local vs University.
    -   **Tickets:** Price (Door Balance), Online Reservation Fee (Auto-calc), External Links (Up to 3).
    -   **Details:** Genre, Duration, Director, Cast Members (Name/Role).
    -   **Media:** Upload Poster (Cropped to 2:3).
3.  **Submit:**
    -   Status set to `approved` (auto) or `pending` (if configured).
    -   Updates Feed and Dashboard.

### C. Manage Group
1.  **Edit Profile:** Click "Settings" icon on Dashboard.
    -   Update Logo, Banner, Description, Founded Year, Address.
2.  **Member Applications:**
    -   View list of pending requests.
    -   **Approve:** Adds user to `group_members` as `active`.
    -   **Decline:** Sets status to `declined`.
3.  **Link Users:**
    -   Manually link "Unlinked Members" (text-only) to real User Accounts via search.

### D. Event Operations
1.  **Guest List:**
    -   **Route:** `/dashboard/guests/:showId`
    -   View all ticket holders (Confirmed, Pending, Used).
    -   Manual Check-in option.
2.  **Scanning:**
    -   **Route:** `/dashboard/scan/:showId` (Accessible via Guest List).
    -   **Action:** Camera opens to scan Audience QR Codes.
    -   **Result:**
        -   **Green:** Verified (Checked In).
        -   **Red:** Invalid / Already Used.

---

## 4. Admin Management

### A. Approvals
-   **Route:** `/admin` -> `Approvals` tab.
-   **Shows:** Review pending show submissions.
    -   **Approve:** Publishes show to public feed.
    -   **Reject:** Sends back to producer with feedback reason.

### B. Payment Processing
-   **Route:** `/admin` -> `Payment Approvals` tab.
-   **Action:** View pending manual payments.
    -   **Review:** Check uploaded proof image against amount.
    -   **Approve:** Marks payment `paid`, ticket `confirmed`. Triggers email.
    -   **Reject:** Marks payment `failed`.

### C. System Management
-   **Users:** View/Search all users.
-   **Payment Settings:** Update the Global QR Code image.

---

## 5. Subscription Features (Basic vs Pro)

| Feature | Basic (Free) | Premium (Pro) |
| :--- | :--- | :--- |
| **Feed Visibility** | Followers only | Followers + Interested Users (Boosted) |
| **Search Rank** | Standard | Priority Placement |
| **Show Listings** | Limited (2/mo) | Unlimited |
| **Links** | 1 Link | Multiple External Links |
| **Analytics** | Basic Counts | Detailed Views, Clicks, CTR |
| **Guest List** | No Access | Full Access |
| **Ticket Scanning** | No Access | Full Access |
| **Direct Ticketing**| No | Yes (Coming Soon) |

---
*Generated by Jules based on codebase analysis.*
