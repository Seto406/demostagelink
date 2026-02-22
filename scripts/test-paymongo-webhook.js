import crypto from 'crypto';

/**
 * Verification Script for PayMongo Webhook
 *
 * Usage:
 * 1. Ensure your local Supabase Edge Functions are running:
 *    supabase functions serve
 *
 * 2. Set environment variables (optional, defaults provided):
 *    export WEBHOOK_URL="http://localhost:54321/functions/v1/paymongo-webhook"
 *    export PAYMONGO_WEBHOOK_SECRET="testing"
 *    export MOCK_USER_ID="<VALID_AUTH_USER_ID>"
 *    export MOCK_SHOW_ID="<VALID_SHOW_ID>"
 *
 * 3. Run this script:
 *    node scripts/test-paymongo-webhook.js
 *
 * Note: You must provide a valid MOCK_USER_ID and MOCK_SHOW_ID that exist in your local database
 * for the ticket creation logic to fully succeed. If they don't exist, you should see a 400 error
 * as per the "Profile Resolution" logic.
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:54321/functions/v1/paymongo-webhook';
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || 'testing';

// Test Data
// Replace these defaults with IDs that actually exist in your database if you want 200 OK.
const MOCK_USER_ID = process.env.MOCK_USER_ID || '00000000-0000-0000-0000-000000000000';
const MOCK_SHOW_ID = process.env.MOCK_SHOW_ID || '00000000-0000-0000-0000-000000000000';
const MOCK_PAYMENT_ID = 'pay_test_' + Date.now();
const CHECKOUT_ID = 'ch_' + Date.now();

const payload = {
  data: {
    attributes: {
      type: 'checkout_session.payment.paid',
      data: {
        id: CHECKOUT_ID,
        attributes: {
          payments: [
            {
              id: MOCK_PAYMENT_ID,
              attributes: {
                amount: 10000,
                status: 'paid'
              }
            }
          ],
          metadata: {
            user_id: MOCK_USER_ID,
            show_id: MOCK_SHOW_ID,
            type: 'ticket'
          }
        }
      }
    }
  }
};

async function runTest() {
  console.log(`Sending webhook to: ${WEBHOOK_URL}`);
  console.log(`Using Secret: ${PAYMONGO_WEBHOOK_SECRET}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  // Create Signature
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${rawBody}`;

  const signature = crypto
    .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  const signatureHeader = `t=${timestamp},te=${signature},li=${signature}`;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paymongo-signature': signatureHeader
      },
      body: rawBody
    });

    const data = await response.text();
    console.log(`Response Status: ${response.status}`);
    console.log('Response Body:', data);

    if (response.ok) {
      console.log('✅ Webhook sent successfully! Check your database tables (tickets, notifications, payments).');
    } else {
      console.error('❌ Webhook failed (as expected if IDs are invalid). Check logs.');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('Ensure Supabase Edge Functions are running locally via `supabase functions serve`.');
  }
}

runTest();
