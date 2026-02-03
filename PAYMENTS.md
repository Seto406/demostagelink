# Payment Integration Guide

This application uses a secure payment architecture designed with **Stripe** and **Supabase**.

## Architecture Overview

1.  **Database**: A `subscriptions` table tracks user subscription status (`active`, `past_due`, etc.), current period end, and Stripe Customer ID.
2.  **Frontend**:
    - The `useSubscription` hook (`src/hooks/useSubscription.ts`) fetches the subscription status from Supabase.
    - The UI (`PricingSection.tsx`, `Settings.tsx`) adapts based on this status.
    - **Security**: The frontend *never* updates the subscription status directly. It only reads it.
3.  **Backend (Edge Functions)**:
    - `create-checkout-session`: Creates a Stripe Checkout session.
    - `create-portal-session`: Creates a Stripe Customer Portal session.
    - `stripe-webhook`: Listens for Stripe events (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`) and updates the Supabase `subscriptions` table using the **Service Role Key**.

## Safest Method Implementation

To complete the "safest method" implementation, you must deploy the backend logic.

### Prerequisites
- A Stripe Account.
- Supabase Project.

### Steps to Enable Payments

1.  **Stripe Setup**:
    - Create a Product in Stripe (e.g., "Pro Producer") and a Price (e.g., `price_pro_monthly`).
    - Get your Secret Key (`sk_test_...`) and Publishable Key (`pk_test_...`).
    - Configure a Webhook Endpoint in Stripe pointing to your Supabase Function URL (`.../functions/v1/stripe-webhook`).

2.  **Environment Variables**:
    - Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SIGNING_SECRET` in your Supabase Edge Functions secrets.
    - Set `VITE_STRIPE_PUBLISHABLE_KEY` in your frontend `.env` (if using Stripe Elements, though Checkout doesn't strictly need it if redirected).

3.  **Deploy Edge Functions**:
    - You need to create the functions in `supabase/functions/`.
    - `stripe-webhook/index.ts`:
      ```typescript
      // Pseudo-code
      const sig = req.headers.get('stripe-signature');
      const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

      if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId, // Metadata from checkout
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000),
          stripe_customer_id: subscription.customer
        });
      }
      ```

4.  **Update Frontend Hook**:
    - In `src/hooks/useSubscription.ts`, uncomment the Edge Function calls in `subscribe` and `manageSubscription`.

## Why this is the safest method?

- **PCI Compliance**: Credit card data never touches your server or client code; it goes directly to Stripe.
- **Source of Truth**: The database is only updated by verifying the cryptographic signature of the Stripe Webhook. A user cannot "fake" a payment by manipulating local storage or API calls.
