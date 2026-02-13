import { createClient } from "@supabase/supabase-js";

// This script triggers a schema reload in PostgREST.
// It requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in the environment.
// Usage: node --loader ts-node/esm scripts/trigger-schema-reload.ts
// Or if compiled: node scripts/trigger-schema-reload.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function reloadSchema() {
  console.log("Triggering schema reload...");
  const { error } = await supabase.rpc("reload_schema_cache");

  if (error) {
    console.error("Failed to reload schema cache:", error);
    process.exit(1);
  }

  console.log("Schema cache reload triggered successfully.");
}

reloadSchema();
