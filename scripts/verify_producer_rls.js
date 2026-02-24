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

async function verifyProducerRLS() {
  console.log('--- Verifying Producer RLS Policies ---');

  // 1. Create a test user (Regular User, not Producer)
  const email = `test_user_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`Creating test user: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Failed to create test user:', authError);
    return;
  }

  const user = authData.user;
  console.log(`User created: ${user.id}`);

  // 2. Attempt to fetch ALL tickets
  // RLS should restrict this to:
  // - Tickets belonging to the user (none yet)
  // - Tickets for shows produced by the user (none, as they are not a producer)

  console.log('Attempting to fetch tickets (should be empty)...');
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('*');

  if (ticketError) {
    console.error('Error fetching tickets:', ticketError);
  } else {
    console.log(`Fetched ${tickets.length} tickets.`);
    if (tickets.length > 0) {
      console.error('❌ RLS FAILURE: Regular user can see tickets they do not own!');
      console.log('First ticket:', tickets[0]);
    } else {
      console.log('✅ RLS SUCCESS: Regular user cannot see any tickets.');
    }
  }

  // 3. Attempt to fetch ALL shows (Should be visible, shows are public)
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, title')
    .limit(1);

  if (showError) {
      console.error("Error fetching shows:", showError);
  } else {
      console.log(`Fetched ${shows.length} shows (Expected, shows are public).`);
  }

  // Clean up (optional, but good practice if we had delete permissions)
  // We can't delete the user easily without admin key.
}

verifyProducerRLS();
