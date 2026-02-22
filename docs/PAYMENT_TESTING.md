# Payment Testing Guide

StageLink uses PayMongo for payments. This guide outlines how to perform end-to-end tests for ticket purchases and webhook processing.

## Pre-Flight Verification Status

| Check | Status | Notes |
|-------|--------|-------|
| **Deployment** | ✅ Verified | `.github/workflows/deploy-functions.yml` correctly targets project `dssbduklgbmxezpjpuen`. |
| **Webhook Logic** | ✅ Verified | Handles `checkout_session.payment.paid` and ensures idempotency. |
| **Availability** | ⚠️ Limitation | **No "decrement availability" logic exists** because the `shows` table currently lacks a `capacity` column. Overbooking prevention relies on manual monitoring or future implementation. |
| **Success Flow** | ✅ Verified | `CheckoutPage` passes a success URL, though the Edge Function prioritizes the `FRONTEND_URL` environment variable for security. |

---

## 1. Ticket Purchase Test (End-to-End)

Perform this test to verify the user experience from checkout to ticket issuance.

1.  **Log In** to the application as a user (not the producer of the show, if possible).
2.  Navigate to **Shows** and select a show.
3.  Click **"Buy Ticket"** or **"Reserve Seat"**.
4.  Proceed to the checkout page.
5.  Click **"Pay Now"**. You will be redirected to PayMongo.
6.  Enter the following test credentials:

    | Field | Value |
    |-------|-------|
    | **Card Number** | `4343 4343 4343 4345` |
    | **Expiration** | Any future date (e.g., `12/30`) |
    | **CVC** | Any 3 digits (e.g., `123`) |
    | **Name** | Any Name |

7.  Click **Pay**.
8.  **Verify Success**:
    *   You should be redirected to the `/payment/success` page.
    *   Go to **Profile** > **My Tickets**. The new ticket should appear there.
    *   (Optional) The producer should receive a notification.

## 2. Webhook Simulation (Cloud Test)

Use the provided script to simulate a successful payment event directly against the deployed Edge Function. This verifies the backend logic without needing a real transaction.

**Prerequisites:**
*   You need the `PAYMONGO_WEBHOOK_SECRET` from your Supabase Dashboard or Vault.
*   You need a valid `user_id` (from `auth.users`) and `show_id` (from `public.shows`) to avoid foreign key errors.

**Command:**

```bash
# Replace values with real IDs from your production database
PAYMONGO_WEBHOOK_SECRET="your_secret_here" \
MOCK_USER_ID="valid_user_uuid" \
MOCK_SHOW_ID="valid_show_uuid" \
node scripts/test-paymongo-webhook.js --live
```

**Expected Output:**
*   The script should report `✅ SUCCESS: Webhook accepted.`
*   In the database, a new record in `tickets` and `payments` should appear.

## 3. Monitoring & Logs

To confirm successful processing or diagnose errors, check the Supabase Edge Function logs:

1.  Go to the **Supabase Dashboard**.
2.  Navigate to **Edge Functions**.
3.  Click on `paymongo-webhook`.
4.  Click on the **Logs** tab.
5.  Look for:
    *   `[Background] Processing paid webhook for checkout...`
    *   `[Background] Ticket created successfully.`
    *   Any `Error` logs.

## 4. Troubleshooting

*   **401 Unauthorized**: The `paymongo-signature` header didn't match. Check that your `PAYMONGO_WEBHOOK_SECRET` matches the one set in the Edge Function secrets.
*   **400 Bad Request**: Likely invalid `metadata`. Ensure `user_id` and `show_id` exist in the database.
*   **Ticket not appearing**: Check the logs. If the payment was processed but ticket creation failed, the logs will show the specific database error.
