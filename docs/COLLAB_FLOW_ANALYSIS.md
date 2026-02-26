# Collaboration Feature Analysis: Producer-to-Producer Flow

This document details the current implementation of the "Producer-to-Producer" collaboration feature, identifying the flow and highlighting the "hallucination" (unintended behavior).

## Overview

The feature allows a Producer (Sender) to send a collaboration request to another Producer (Receiver). The intended outcome is likely a partnership or co-production relationship. However, the current implementation results in the Sender being assimilated into the Receiver's group.

## Detailed Flow

### 1. Initiation (Frontend)
- **Location:** `src/pages/ProducerProfile.tsx`
- **Action:** A logged-in Producer (Sender) visits another Producer's (Receiver) profile page and clicks the "Request Collab" button.
- **Payload:** Calls the `send-collab-proposal` Edge Function with `{ recipient_profile_id: producer.id }`.

### 2. Request Processing (Backend - Edge Function)
- **Location:** `supabase/functions/send-collab-proposal/index.ts`
- **Steps:**
    1.  **Authentication:** Verifies the request is from an authenticated user.
    2.  **Sender Verification:** Fetches Sender's profile. Requires `role` to be `'producer'` or `'admin'`.
    3.  **Receiver Verification:** Fetches Receiver's profile.
    4.  **Self-Check:** Prevents self-collaboration.
    5.  **Pending Check:** Checks `collaboration_requests` for existing pending requests.
    6.  **Creation:** Inserts a new record into `collaboration_requests` with:
        -   `sender_id`: Auth User ID of Sender.
        -   `receiver_id`: Auth User ID of Receiver.
        -   `status`: `'pending'`.
    7.  **Notification:** Creates an in-app notification for the Receiver.
    8.  **Email:** Sends an email to the Receiver via Resend API.

### 3. Request Management (Frontend - Dashboard)
- **Location:** `src/pages/Dashboard.tsx`
- **Action:** Receiver logs into their Dashboard and views the "Incoming Collaboration Requests" section.
- **Display:** Fetches `collaboration_requests` where `receiver_id` matches the current user.

### 4. Request Acceptance (The "Hallucination")
- **Location:** `handleApproveCollab` in `src/pages/Dashboard.tsx`
- **Logic:** When the Receiver clicks "Accept Collab":
    1.  **Group Membership:** The Sender is added to the Receiver's `group_members` table as a `'producer'`.
    2.  **Request Status:** The `collaboration_requests` record is updated to `'accepted'`.
    3.  **Profile Update (CRITICAL FLAW):**
        -   The Sender's `profiles` record is updated.
        -   `role` is set to `'producer'` (redundant).
        -   **`group_name` is updated to the Receiver's `group_name`.**

## The "Hallucination" (Identified Issue)

The current implementation treats "collaboration" as "joining the group". Specifically, step 4.3 overwrites the Sender's identity (`group_name`) with the Receiver's group name.

**Consequence:**
If "Producer A" (from "Group A") collaborates with "Producer B" (from "Group B"), the result is that "Producer A" becomes a member of "Group B", and their profile now says they belong to "Group B". "Group A" effectively loses its primary user association.

**Expected vs. Actual:**
-   **Expected:** Two independent producers form a link (e.g., via a `partnerships` table or `show_producers` table) without losing their individual group identities.
-   **Actual:** The Sender is merged/assimilated into the Receiver's group.
