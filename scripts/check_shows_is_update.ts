
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// In this project .env, the key is named VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShows() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('id, title, status, is_update, created_at, updated_at');

  if (error) {
    console.error('Error fetching shows:', error);
    return;
  }

  console.log(`Total shows: ${shows.length}`);

  const nullIsUpdate = shows.filter(s => s.is_update === null);
  console.log(`Shows with is_update = NULL: ${nullIsUpdate.length}`);

  if (nullIsUpdate.length > 0) {
    console.log('Examples of NULL is_update:', nullIsUpdate.slice(0, 5));
  }

  const pendingNew = shows.filter(s => s.status === 'pending' && s.is_update === false);
  const pendingEdit = shows.filter(s => s.status === 'pending' && s.is_update === true);

  console.log(`Pending New (is_update=false): ${pendingNew.length}`);
  console.log(`Pending Edit (is_update=true): ${pendingEdit.length}`);

  // List pending edits if any
  if (pendingEdit.length > 0) {
      console.log("Pending Edits:", pendingEdit.map(s => s.title));
  }
}

checkShows();
