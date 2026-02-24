import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LIVE_URL = 'https://dssbduklgbmxezpjpuen.supabase.co/functions/v1/paymongo-webhook';
const WEBHOOK_URL = process.env.WEBHOOK_URL || LIVE_URL;
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

async function getTestData() {
  console.log('Fetching test data...');
  const { data: shows, error: showError } = await supabase.from('shows').select('id').limit(1);
  if (showError || !shows || shows.length === 0) {
    throw new Error('Could not fetch a valid Show ID.');
  }
  const showId = shows[0].id;

  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  let userId = authData?.user?.id;

  if (!userId) {
      console.log('Could not sign in anonymously. Using random UUID (Guest). Verification might be limited.');
      userId = crypto.randomUUID();
  } else {
      console.log(`Signed in anonymously as ${userId}`);
  }

  return { showId, userId };
}

function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return {
    header: `t=${timestamp},te=${signature},li=${signature}`,
    rawBody
  };
}

async function sendWebhook(payload, description) {
  console.log(`\n--- Test Case: ${description} ---`);

  if (!PAYMONGO_WEBHOOK_SECRET) {
    console.warn('⚠️  SKIPPING HTTP REQUEST: PAYMONGO_WEBHOOK_SECRET is not set.');
    return false;
  }

  const { header, rawBody } = generateSignature(payload, PAYMONGO_WEBHOOK_SECRET);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paymongo-signature': header
      },
      body: rawBody
    });

    const text = await response.text();
    console.log(`Status: ${response.status} ${response.statusText}`);
    return response.ok;
  } catch (err) {
    console.error('Network Error:', err.message);
    return false;
  }
}

async function verifyTicket(userId, showId) {
    if (!userId) return;
    console.log('Verifying ticket creation...');
    // Allow DB propagation
    await new Promise(r => setTimeout(r, 2000));

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('user_id', userId)
        .eq('show_id', showId)
        .eq('status', 'confirmed'); // Assuming 'confirmed' is the success status based on other files

    if (error) {
        console.error('Error checking tickets:', error);
    } else if (tickets && tickets.length > 0) {
        console.log(`✅ SUCCESS: Ticket found! ID: ${tickets[0].id}`);
        return true;
    } else {
        console.error('❌ FAILED: Ticket not found in DB.');
        return false;
    }
}

async function runTests() {
  try {
    const { showId, userId } = await getTestData();
    const checkoutId = 'ch_' + crypto.randomUUID();
    const paymentId = 'pay_' + crypto.randomUUID();

    // Test Case A: Success
    const successPayload = {
      data: {
        attributes: {
          type: 'checkout_session.payment.paid',
          data: {
            id: checkoutId,
            type: 'checkout_session',
            attributes: {
              payments: [{ id: paymentId, attributes: { status: 'paid' } }],
              metadata: { user_id: userId, show_id: showId, type: 'ticket' }
            }
          }
        }
      }
    };

    const sent = await sendWebhook(successPayload, 'Success (payment.paid)');
    if (sent) {
        await verifyTicket(userId, showId);
    }

    // Test Case B: Failure (payment.failed)
    const failedPaymentId = 'pay_fail_' + crypto.randomUUID();
    const failurePayload = {
      data: {
        attributes: {
          type: 'checkout_session.payment.failed',
          data: {
            id: 'ch_fail_' + crypto.randomUUID(),
            type: 'checkout_session',
            attributes: {
              payments: [{ id: failedPaymentId, attributes: { status: 'failed' } }],
              metadata: { user_id: userId, show_id: showId }
            }
          }
        }
      }
    };

    const sentFailure = await sendWebhook(failurePayload, 'Failure (payment.failed)');
    if (sentFailure) {
        console.log('Payment failure event sent. Verification requires checking "payments" table for status="failed".');
        // Note: Without Service Role, we can only check if we own the record.
        // If we created the payment via webhook, we might not own it directly unless user_id matches.
    }

    // Test Case C: Idempotency
    if (sent) {
        console.log('\n--- Test Case: Idempotency ---');
        await sendWebhook(successPayload, 'Duplicate payment.paid');
        // Check ticket count
        const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('show_id', showId);

        if (count === 1) {
            console.log('✅ SUCCESS: Only 1 ticket exists (Idempotency working).');
        } else {
            console.error(`❌ FAILED: Found ${count} tickets.`);
        }
    }

  } catch (err) {
    console.error('Test Suite Failed:', err);
  }
}

runTests();
