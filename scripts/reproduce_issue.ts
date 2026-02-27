
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

async function reproduce() {
  console.log("Checking for pending edit requests...");

  // This query matches what the AdminPanel fetches for "Edit Requests"
  const { count, error } = await supabase
    .from("shows")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null)
    .eq("is_update", true);

  if (error) {
    console.error("Error fetching pending edits:", error);
    return;
  }

  console.log(`Pending Edit Requests (status='pending' AND is_update=true): ${count}`);

  if (count === 0) {
      console.log("Verified: No edit requests found.");
      console.log("Root Cause Analysis: Admin edits are auto-approved by the frontend, so they never enter 'pending' state.");
  } else {
      console.log("Found pending edits. The UI might be filtering them out incorrectly.");
  }
}

reproduce();
