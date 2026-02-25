# Payment & Ticket Flow Documentation

This document outlines the end-to-end payment and ticketing flow for StageLink, from purchase to scanning.

## Overview

The flow consists of the following steps:
1.  **Purchase:** Audience buys a ticket (Manual Payment).
2.  **Approval:** Admin reviews and approves the payment.
3.  **Ticket:** Audience receives a digital pass.
4.  **Reminder:** Audience receives a show reminder.
5.  **Scan:** Producer scans the ticket at the venue.

## Detailed Steps & Components

### 1. Purchase (Audience)
-   **Page:** `src/pages/CheckoutPage.tsx`
-   **Action:** User selects a show, enters details, uploads proof of payment.
-   **Backend:** `supabase/functions/create-manual-payment`
    -   Creates a `payment` record with status `pending`.
    -   Creates a `ticket` record with status `pending`.
    -   Sends an email notification to the Admin.

### 2. Approval (Admin)
-   **Page:** `src/pages/AdminPanel.tsx` (Payment Approvals Tab)
-   **Action:** Admin reviews the proof of payment and clicks "Approve".
-   **Backend:** `supabase/functions/approve-manual-payment`
    -   Updates `payment` status to `paid`.
    -   Updates `ticket` status to `confirmed`.
    -   Sends a confirmation email to the User with the ticket link.

### 3. Ticket Receipt (Audience)
-   **Page:** `src/pages/ShowDetailsPage.tsx` (or Profile > Tickets)
-   **Component:** `src/components/profile/DigitalPass.tsx`
-   **Display:** Shows the ticket details and a QR code containing the `ticket_id`.
-   **Status:** Displays "Confirmed" once approved.

### 4. Reminder (System/Admin)
-   **Trigger:** Automated cron job (daily) or Manual Trigger (Admin).
-   **Backend:** `supabase/functions/send-show-reminder`
    -   Finds shows starting in ~24 hours.
    -   Sends reminder emails to all confirmed ticket holders.
-   **Manual Simulation:**
    -   Go to **Admin Panel** > **Show Approvals**.
    -   Find an approved show.
    -   Click the **"Send Reminder"** button (Bell icon).

### 5. Scanning (Producer)
-   **Access:**
    1.  Go to **Dashboard** (`src/pages/Dashboard.tsx`).
    2.  Select the relevant Show.
    3.  Click **"Guest List"** (`src/pages/GuestList.tsx`).
    4.  Click **"Scan Tickets"**.
-   **Page:** `src/pages/Scanner.tsx`
-   **Action:** Producer scans the audience member's QR code.
-   **Backend:** `supabase/functions/scan-ticket`
    -   Verifies producer permissions.
    -   Checks if the ticket is valid and unused.
    -   Updates ticket status to `used` and sets `checked_in_at`.
-   **Result:** The scanner displays "Verified!" (Green) or "Already Used/Invalid" (Red/Yellow).

## Simulation Guide

To simulate the full flow manually:

1.  **Buy a Ticket:**
    -   Go to a show page (e.g., `/shows/SHOW_ID`).
    -   Click "Get Tickets" -> "Manual Payment".
    -   Upload a dummy image as proof.
    -   Submit.

2.  **Approve Payment:**
    -   Log in as an **Admin**.
    -   Go to `/admin` -> **Payment Approvals**.
    -   Find the pending payment and click **Approve**.

3.  **View Ticket:**
    -   Log in as the **Audience** user (or check email).
    -   Go to the show page or your profile to see the "Confirmed" ticket with QR code.
    -   (Optional) Take a screenshot or keep the tab open.

4.  **Send Reminder:**
    -   As **Admin**, go to `/admin` -> **Show Approvals**.
    -   Find the show and click the **Reminder (Bell)** icon.
    -   Check the audience user's email for the reminder.

5.  **Scan Ticket:**
    -   Log in as the **Producer** of the show (or Admin).
    -   Go to `/dashboard`.
    -   Click **Guest List** for the show.
    -   Click **Scan Tickets**.
    -   Use the camera to scan the QR code from step 3 (or enter the code manually).
    -   Verify the success message.
