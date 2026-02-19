import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Time-Traveler Logic: fetch interceptor to handle clock skew
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let attempt = 0;
  const MAX_RETRIES = 3;

  while (true) {
    try {
      // Perform the request
      const response = await fetch(input, init);

      // Check for specific error indicating clock skew
      if (!response.ok) {
        const clone = response.clone();
        let isClockSkew = false;

        try {
          const body = await clone.json();
          const errorMsg = body?.error_description || body?.msg || body?.message || '';

          const isFunctionsError = typeof errorMsg === 'string' && errorMsg.includes("FunctionsFetchError");
          const isSessionFuture = typeof errorMsg === 'string' && errorMsg.includes("Session in the future");
          const isSessionNotFound = typeof errorMsg === 'string' && errorMsg.includes("session_not_found");

          // Safe Auth Reset: Only reload for specific session errors, never for function errors
          if (!isFunctionsError && ((response.status === 401 && isSessionFuture) || isSessionNotFound)) {
            console.error("Critical session error detected. Clearing session.");
            // Clear all sb- keys to kill the bad session
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
            // Return error so app can handle it (e.g. redirect to login)
            return new Response(JSON.stringify({ error: "Session reset" }), { status: 401 });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }

        if (isClockSkew) {
          if (attempt < MAX_RETRIES) {
            console.warn(`Clock skew detected (Attempt ${attempt + 1}/${MAX_RETRIES}). Waiting 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempt++;
            continue; // Retry loop
          } else {
            console.error("Max retries reached for clock skew.");
            if (typeof window !== 'undefined') {
              window.alert("Check your device clock. It seems to be out of sync with the server.");
            }
            return response; // Return the error response
          }
        }
      }

      return response;
    } catch (err) {
      throw err;
    }
  }
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  },
});
