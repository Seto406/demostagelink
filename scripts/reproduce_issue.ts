
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEditRequests() {
  console.log("Checking for pending edit requests...");

  const { data: shows, error } = await supabase
    .from("shows")
    .select("*")
    .eq("status", "pending")
    .eq("is_update", true);

  if (error) {
    console.error("Error fetching edit requests:", error);
    return;
  }

  console.log(`Found ${shows.length} pending edit requests.`);
  if (shows.length > 0) {
    console.log("Sample show:", shows[0]);
  } else {
    console.log("Verified: No edit requests found.");
  }

  // Check if we can insert a show and update it to simulate an edit request
  // Note: We need a producer user to create a show. We might not have one easily available without auth.
  // So we will just inspect existing data or rely on code analysis.
}

testEditRequests();
