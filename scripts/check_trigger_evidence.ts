
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  // We can't query information_schema directly via supabase-js client usually,
  // unless we use rpc to execute sql, but we might not have a handy rpc for arbitrary sql.
  // However, we can check if the logic holds by inspecting a show that we update.

  // Since we can't update easily (auth), let's just checking if we can list triggers via rpc if one exists?
  // No generic sql runner.

  // But we can check if there are ANY shows with is_update = true.
  const { data: shows, error } = await supabase
    .from('shows')
    .select('id, title, is_update')
    .eq('is_update', true);

  if (error) {
    console.error(error);
  } else {
    console.log(`Shows with is_update=true: ${shows.length}`);
    if (shows.length > 0) {
        console.log("Trigger seems to have worked at least once (or manual update).");
    } else {
        console.log("No shows have is_update=true. This is suspicious if edits have happened.");
    }
  }
}

checkTriggers();
