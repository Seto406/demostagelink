const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        if (key && !key.startsWith('#')) {
            envVars[key] = value;
        }
      }
    });
  }
  return envVars;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing keys');
  process.exit(1);
}

async function check() {
    console.log("Checking verify-paymongo-payment...");
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-paymongo-payment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: 'test-connectivity' })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Body: ${text}`);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

check();
