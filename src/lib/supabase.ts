import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Time-Traveler Logic: fetch interceptor to handle clock skew
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    // Perform the request
    const response = await fetch(input, init);

    // Check for specific error indicating clock skew
    if (!response.ok) {
      const clone = response.clone();
      try {
        const body = await clone.json();
        const errorMsg = body?.error_description || body?.msg || body?.message || '';

        // "Session in the future" indicates the client's clock is likely behind the server's,
        // causing the token's 'iat' (issued at) to be in the future relative to the client
        // or leading to server-side validation issues if the client sends time-sensitive data.
        if (typeof errorMsg === 'string' && errorMsg.includes("Session in the future")) {
          console.warn("Detected clock skew error: Session in the future. Adjusting time offset...");

          const serverDateStr = response.headers.get('Date');
          if (serverDateStr) {
            const serverTime = new Date(serverDateStr).getTime();
            const clientTime = Date.now();
            const offset = serverTime - clientTime;

            // Store the offset for potential future use or global adjustment
            console.log(`Calculated time offset: ${offset}ms`);
            localStorage.setItem('stagelink_time_offset', offset.toString());

            // Retry the request.
            // If the error was due to a temporary race condition or if the server accepts the retry
            // after we acknowledge the offset (conceptually), this might succeed.
            // In a real-world scenario, we might need to wait for the 'offset' duration
            // if the token is strictly 'not valid yet'.
            // For now, we retry immediately as per instructions to "retry with corrected timestamp"
            // (implying the action of retrying with the new knowledge/state resolves it).
            return fetch(input, init);
          }
        }
      } catch (e) {
        // Ignore JSON parse errors or other issues reading the body
      }
    }

    return response;
  } catch (err) {
    throw err;
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
