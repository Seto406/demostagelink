import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPriceTampering() {
  console.log('--- Verifying Price Tampering Vulnerability ---');
  console.log(`Target: ${supabaseUrl}/functions/v1/create-paymongo-session`);

  // 1. Get a valid show ID (any show with price > 0)
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, title, price')
    .gt('price', 0)
    .limit(1);

  if (showError || !shows || shows.length === 0) {
    console.error('Failed to fetch a valid show for testing:', showError);
    return;
  }

  const show = shows[0];
  console.log(`Using Show: "${show.title}" (ID: ${show.id}, Original Price: ${show.price})`);

  // 2. Attempt to create a session with a tampered price (1 PHP = 100 cents, but min is 20 PHP)
  // Let's try 20 PHP (minimum allowed by validation) vs original price
  const tamperedPrice = 20;
  console.log(`Attempting to create session with tampered price: ${tamperedPrice} PHP`);

  try {
    const { data, error } = await supabase.functions.invoke('create-paymongo-session', {
      body: {
        show_id: show.id,
        price: tamperedPrice, // malicious payload
        description: `Tampered Ticket for ${show.title}`,
        redirect_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel'
      }
    });

    if (error) {
      console.log('Function returned error (GOOD if validation blocked the request):', error);
    } else {
      console.log('Function returned success:', data);
      if (data.checkoutUrl) {
        console.warn('⚠️ Checkout URL generated. Verify the amount manually!');
        console.log('Checkout URL:', data.checkoutUrl);
        console.log('If the amount on the checkout page matches the REAL price (not 20 PHP), then the fix is WORKING.');
        console.log('If the amount is 20 PHP, then the vulnerability is CONFIRMED.');
      }
    }

  } catch (err) {
    console.error('Unexpected error during invocation:', err);
  }
}

verifyPriceTampering();
