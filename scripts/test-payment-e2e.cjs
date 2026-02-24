const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Helper to read .env manually ---
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        if (key && !key.startsWith('#')) {
            envVars[key] = value;
        }
      }
    });
  }
  return envVars;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log('--- Starting E2E Payment Test (Anonymous) ---');
  let userId = null;
  let showId = 'd04c4f03-6880-4c4f-b98a-5942730628e9';

  try {
    // 1. Sign In Anonymously
    console.log(`Attempting anonymous sign in...`);
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
        console.warn(`Anonymous sign in failed: ${authError.message}`);
        console.log("Trying to proceed as guest (unauthenticated)...");
        // Proceed as guest
    } else {
        userId = authData.user.id;
        console.log(`User signed in anonymously. ID: ${userId}`);
    }

    // 2. Get a Show
    const { data: shows, error: showError } = await supabase.from('shows').select('id, price').limit(1);
    if (showError) console.warn("Could not fetch shows:", showError);
    if (shows && shows.length > 0) {
        showId = shows[0].id;
        console.log(`Using Show ID: ${showId}`);
    }

    // 3. Invoke create-paymongo-session
    console.log('Invoking create-paymongo-session...');
    const payload = {
        show_id: showId,
        amount: 100, // 1.00 PHP
    };
    if (userId) payload.user_id = userId;

    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-paymongo-session', {
        body: payload
    });

    if (sessionError) throw new Error(`create-paymongo-session failed: ${sessionError.message}`);
    console.log('Session created:', sessionData);

    // Get Payment ID
    await new Promise(r => setTimeout(r, 1000));

    let paymentId = null;

    // We can't query payments table easily if unauthenticated (guest).
    // RLS usually prevents listing payments unless you own them.
    // If anonymous, we own them.
    if (userId) {
        const { data: payments } = await supabase
            .from('payments')
            .select('id, status')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (payments && payments.length > 0) {
            paymentId = payments[0].id;
            console.log(`Found Payment ID: ${paymentId}`);
        }
    }

    if (!paymentId) {
        console.warn("Could not retrieve Payment ID from DB (likely due to RLS or Guest mode).");
        // We can't proceed to verify without Payment ID.
        // Wait! The sessionData might contain the checkout ID or something we can use?
        // create-paymongo-session returns { checkoutUrl }.
        // It doesn't return payment ID.

        // This makes guest checkout verification hard if we can't query the payment!
        // But the frontend usually gets the payment ID from the URL param `ref` upon redirection?
        // No, the `create-paymongo-session` appends `?ref=<paymentRef>` to the `success_url`.
        // So the PayMongo session knows it.
        // But WE don't know it here unless we parse the checkout URL (unlikely to be there) or query DB.

        console.log("Aborting test due to missing Payment ID.");
        return;
    }

    // 4. Invoke verify-paymongo-payment
    console.log(`Invoking verify-paymongo-payment for ${paymentId}...`);
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-paymongo-payment', {
        body: { ref: paymentId }
    });

    if (verifyError) {
        console.error('Function invocation failed:', verifyError);
    } else {
        console.log('Verification Response:', verifyData);
    }

  } catch (err) {
    console.error('TEST FAILED:', err);
  }
}

runTest();
