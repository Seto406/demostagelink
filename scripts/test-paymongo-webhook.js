import crypto from 'crypto';

/**
 * Verification Script for PayMongo Webhook
 *
 * This script simulates a PayMongo 'checkout_session.payment.paid' event sent to your local
 * Supabase Edge Function or the deployed cloud function.
 *
 * PREREQUISITES:
 * 1. To test locally, you must have your Supabase Edge Functions running.
 *    Command: `supabase functions serve`
 *    Default URL: http://localhost:54321/functions/v1/paymongo-webhook
 *
 * 2. You must have a valid User ID (auth.users) and Show ID (public.shows) in your database.
 *    If these IDs are invalid, the webhook will return a 400 error (as per security logic).
 *
 * USAGE:
 * 1. Open a terminal.
 * 2. Run the script with Node.js:
 *    node scripts/test-paymongo-webhook.js [flags]
 *
 * FLAGS:
 *   --live    Use the deployed cloud function URL (https://dssbduklgbmxezpjpuen.supabase.co/functions/v1/paymongo-webhook)
 *   --help    Show this help message
 *
 * ENVIRONMENT VARIABLES (Optional):
 * You can override defaults using environment variables:
 * - WEBHOOK_URL: URL of the edge function (overrides --live flag if both present, but typically one or the other)
 * - PAYMONGO_WEBHOOK_SECRET: The secret used to sign the payload (default: 'testing' for local, MUST be set for live)
 * - MOCK_USER_ID: A valid UUID for an authenticated user.
 * - MOCK_SHOW_ID: A valid UUID for a show.
 *
 * Example (Live Test):
 * PAYMONGO_WEBHOOK_SECRET="your_live_secret" MOCK_USER_ID="valid-uuid" MOCK_SHOW_ID="valid-uuid" node scripts/test-paymongo-webhook.js --live
 */

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Usage: node scripts/test-paymongo-webhook.js [options]

Options:
  --live       Target the live cloud environment.
  --help       Show this help message.

Environment Variables:
  PAYMONGO_WEBHOOK_SECRET  (Required for live test)
  MOCK_USER_ID             (Required for successful test)
  MOCK_SHOW_ID             (Required for successful test)
  WEBHOOK_URL              (Optional override)
`);
  process.exit(0);
}

const LIVE_URL = 'https://dssbduklgbmxezpjpuen.supabase.co/functions/v1/paymongo-webhook';
const LOCAL_URL = 'http://localhost:54321/functions/v1/paymongo-webhook';

const USE_LIVE = args.includes('--live');
const DEFAULT_URL = USE_LIVE ? LIVE_URL : LOCAL_URL;

const WEBHOOK_URL = process.env.WEBHOOK_URL || DEFAULT_URL;
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || 'testing';

// Test Data
// Replace these defaults with IDs that actually exist in your database if you want 200 OK.
// If you don't change these, expect a 400 error response regarding missing profile.
const MOCK_USER_ID = process.env.MOCK_USER_ID || '00000000-0000-0000-0000-000000000000';
const MOCK_SHOW_ID = process.env.MOCK_SHOW_ID || '00000000-0000-0000-0000-000000000000';
const MOCK_PAYMENT_ID = 'pay_test_' + Date.now();
const CHECKOUT_ID = 'ch_' + Date.now();

// Construct Payload matching PayMongo structure
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
                amount: 10000, // 100.00 PHP (in cents)
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
  console.log(`\n--- PayMongo Webhook Dry Run Test ---`);
  console.log(`Target URL: ${WEBHOOK_URL}`);
  console.log(`Secret: ${PAYMONGO_WEBHOOK_SECRET}`);
  console.log(`Mock User ID: ${MOCK_USER_ID}`);
  console.log(`Mock Show ID: ${MOCK_SHOW_ID}`);
  console.log('Payload Preview:', JSON.stringify(payload, null, 2));
  console.log('-------------------------------------\n');

  if (USE_LIVE && PAYMONGO_WEBHOOK_SECRET === 'testing') {
      console.warn('⚠️  WARNING: You are targeting the LIVE environment but using the default secret "testing".');
      console.warn('   This will likely fail signature verification (401).');
      console.warn('   Set PAYMONGO_WEBHOOK_SECRET environment variable to your real webhook secret.\n');
  }

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
    console.log('Sending request...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paymongo-signature': signatureHeader
      },
      body: rawBody
    });

    const text = await response.text();
    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);

    try {
        const json = JSON.parse(text);
        console.log('Response Body:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.log('Response Body (Raw):', text);
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS: Webhook accepted. Logic verification complete.');
      console.log('Next Steps: Check your database tables (tickets, notifications, payments) to confirm records were created.');
    } else {
      console.error('\n❌ FAILED: The webhook returned an error status.');
      if (response.status === 400) {
          console.log('Reason: Likely invalid metadata (User ID or Show ID not found in DB). This confirms validation logic is working!');
      } else if (response.status === 401) {
          console.log('Reason: Invalid signature. Check PAYMONGO_WEBHOOK_SECRET.');
      }
    }
  } catch (error) {
    console.error('\n❌ NETWORK ERROR:', error.message);
    console.log('Is the Supabase Edge Function running? Run `supabase functions serve` in another terminal.');
  }
}

runTest();
