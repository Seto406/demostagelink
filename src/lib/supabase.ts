import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create a custom fetch wrapper to handle clock skew errors
const customFetch = async (url: string, options: RequestInit | undefined) => {
  try {
    const response = await fetch(url, options);

    // Clone response to read text without consuming the stream
    const clone = response.clone();

    // We only care about errors, and usually text/json
    try {
        const text = await clone.text();

        // "issued in the future" is the specific error message for clock skew
        if (text.includes("issued in the future")) {
          console.error("Time-Traveler Fix: Clock skew detected (token issued in the future). Syncing session...");

          // Force a session refresh
          // We use the exported supabase instance.
          // Note: This relies on the module being fully evaluated,
          // which it should be by the time a request is made.
          if (supabase) {
              await supabase.auth.refreshSession();
          }
        }
    } catch (e) {
        // Ignore JSON/text parsing errors
    }

    return response;
  } catch (error) {
     throw error;
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch
  }
});
