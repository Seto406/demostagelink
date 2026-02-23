require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
    let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing keys in environment variables. Checking .env file...');
        try {
            if (fs.existsSync('.env')) {
                const envFile = fs.readFileSync('.env', 'utf8');
                const lines = envFile.split('\n');
                for (const line of lines) {
                    if (line.startsWith('SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
                    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceRoleKey = line.split('=')[1].trim();
                }
            }
        } catch (e) {
            console.error('Error reading .env:', e.message);
        }
    }

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Could not find SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
        process.exit(1);
    }

    console.log('Using Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('Fetching Profiles...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, user_id, group_name, username').limit(5);

    if (pError) {
        console.error('Error fetching profiles:', pError);
    } else {
        console.log(`Found ${profiles.length} profiles.`);
        profiles.forEach(p => console.log(`Profile: id=${p.id}, auth_id=${p.user_id}, name=${p.group_name || p.username}`));
    }

    console.log('\nFetching Tickets...');
    const { data: tickets, error: tError } = await supabase.from('tickets').select('id, user_id, status, created_at').order('created_at', { ascending: false }).limit(5);

    if (tError) {
        console.error('Error fetching tickets:', tError);
    } else {
        console.log(`Found ${tickets.length} tickets.`);
        tickets.forEach(t => console.log(`Ticket: id=${t.id}, user_id=${t.user_id}, status=${t.status}, created=${t.created_at}`));
    }
}

main();
