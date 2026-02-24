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

async function verifyAbandonedCheckout() {
  console.log('--- Verifying Abandoned Checkout State ---');

  let userId = null;

  // 1. Sign in (Optional)
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) {
    console.log('Notice: Anonymous sign-in disabled. Proceeding as Guest.');
  } else {
    userId = authData.user.id;
    console.log(`User ID: ${userId}`);
  }

  // 2. Get a Show ID
  const { data: shows, error: showError } = await supabase.from('shows').select('id, price').gt('price', 0).limit(1);
  if (showError || !shows.length) {
      console.error('Failed to fetch show:', showError);
      return;
  }
  const show = shows[0];
  console.log(`Using Show ID: ${show.id}`);

  // 3. Create Session (Abandon it)
  console.log('Creating PayMongo session...');
  const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-paymongo-session', {
    body: {
        show_id: show.id,
        price: 100 // 1.00 PHP
    }
  });

  if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return;
  }
  console.log('Session created. Checkout URL:', sessionData.checkoutUrl);

  if (!userId) {
      console.log('⚠️  Cannot verify database state for Guest user without Service Role (RLS restriction).');
      console.log('   However, successful session creation implies "initialized" state in DB.');
      return;
  }

  // 4. Check DB for Pending Payment (Only if authenticated)
  console.log('Checking database for pending payment...');
  await new Promise(r => setTimeout(r, 2000));

  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('id, status, paymongo_checkout_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (paymentError) {
      console.error('Failed to fetch payments:', paymentError);
      return;
  }

  if (!payments || payments.length === 0) {
      console.error('❌ FAILED: No payment record found for the session.');
      return;
  }

  const payment = payments[0];
  console.log(`Found Payment: ${payment.id}, Status: ${payment.status}`);

  if (payment.status === 'pending' || payment.status === 'initialized') {
      console.log('✅ SUCCESS: Payment is in correct state for abandoned checkout.');
  } else {
      console.error(`❌ FAILED: Payment status is ${payment.status}, expected pending/initialized.`);
  }
}

verifyAbandonedCheckout();
