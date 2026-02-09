# Payment Testing Guide

StageLink uses PayMongo for payments. In the current test environment, you must use PayMongo's test card numbers.

## How to Test

1. **Log In** to the application.
2. Navigate to **Settings**.
3. Scroll to the **Subscription** section.
4. Click **"Upgrade Pro"**.
5. You will be redirected to the PayMongo checkout page.
6. Enter the following test credentials:

| Field | Value |
|-------|-------|
| **Card Number** | `4343 4343 4343 4345` |
| **Expiration** | Any future date (e.g., `12/30`) |
| **CVC** | Any 3 digits (e.g., `123`) |
| **Name** | Any Name |

7. Click **Pay**.
8. You should be redirected back to the `Payment Success` page and awarded 100 XP.
