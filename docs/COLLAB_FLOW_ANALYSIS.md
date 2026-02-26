# Collaboration Feature Analysis: Producer-to-Producer Flow

This document details the current implementation of the "Producer-to-Producer" collaboration feature, identifying the flow and highlighting the "hallucination" (unintended behavior) and the applied fix.

## Overview

The feature allows a Producer (Sender) to send a collaboration request to another Producer (Receiver). The intended outcome is a partnership or co-production relationship ("Business Card Exchange").

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

### 4. Request Response (Business Card Exchange)
- **Location:** `handleCollabResponse` in `src/pages/Dashboard.tsx`
- **Logic:** When the Receiver responds, they choose one of four options:
    1.  **"Send Interest Back"** -> Status: `interested`
    2.  **"We will think about it"** -> Status: `considering`
    3.  **"Not available now"** -> Status: `busy`
    4.  **"Sorry we can't"** -> Status: `declined`
- **Outcome:**
    -   The `collaboration_requests` record status is updated.
    -   An in-app notification is sent to the Sender with the specific response message.
    -   **NO** assimilation occurs. The groups remain independent.

## The "Hallucination" (Fixed Issue)

**Previous Behavior:**
The implementation previously treated "collaboration" as "joining the group". Accepting a request would overwrite the Sender's identity (`group_name`) with the Receiver's group name and add them as a member.

**Fix Applied:**
The "Assimilation" logic has been removed. The feature now functions as a "poke" or introduction, allowing producers to signal intent without merging their accounts or data.
