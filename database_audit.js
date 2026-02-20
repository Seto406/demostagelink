
import fs from 'fs';
import path from 'path';

// Simple .env parser
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local');
    process.exit(1);
}

async function fetchSupabase(endpoint, options = {}, key = SERVICE_ROLE_KEY) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) return null;

  try {
      const data = await response.json();
      if (!response.ok) {
          return { error: data, status: response.status };
      }
      return { data, status: response.status };
  } catch (e) {
      return { error: 'Failed to parse JSON', status: response.status };
  }
}

async function runAudit() {
  console.log('🚀 Starting Database Health Audit (Fetch)...');
  const report = {
    deadWood: [],
    roleSync: {},
    integrity: {},
    redundancy: {},
    rls: {}
  };

  // 1. Dead Wood Scan
  console.log('\n🔍 1. Dead Wood Scan...');
  const tables = ['membership_applications', 'theater_groups'];
  for (const table of tables) {
      const { data, error, status } = await fetchSupabase(`/rest/v1/${table}?select=*&limit=1`);
      if (status === 404) {
          console.log(`✅ Table '${table}' does not exist (Clean).`);
          report.deadWood.push({ table, status: 'Missing (Clean)' });
      } else if (error) {
          console.log(`❓ Table '${table}' error: ${JSON.stringify(error)}`);
          report.deadWood.push({ table, status: 'Error', error });
      } else {
          console.log(`⚠️ Table '${table}' EXISTS! It might be dead wood.`);
          report.deadWood.push({ table, status: 'Exists (In Use/Legacy)', action: 'Refactor before deletion' });
      }
  }

  // 2. Role Sync Check
  console.log('\n🔍 2. Role Sync Check...');
  const { data: userData, error: userError } = await fetchSupabase('/auth/v1/admin/users', {}, SERVICE_ROLE_KEY);

  if (userError) {
      console.error('Error fetching users:', userError);
      report.roleSync.error = userError;
  } else {
      const users = userData.users || [];
      const targetUser = users.find(u => u.email === 'sethalvarez2001@gmail.com');

      if (!targetUser) {
          console.log('❌ User sethalvarez2001@gmail.com not found.');
          report.roleSync.status = 'User Not Found';
      } else {
          console.log(`Found User ID: ${targetUser.id}`);
          const { data: profiles, error: profileError } = await fetchSupabase(`/rest/v1/profiles?user_id=eq.${targetUser.id}&select=*`);

          if (profileError || !profiles || profiles.length === 0) {
               console.log('❌ Profile not found.');
               report.roleSync.status = 'Profile Not Found';
          } else {
              const profile = profiles[0];
              console.log(`Profile: Role=${profile.role}, Group=${profile.group_name}`);

              const needsUpdate = profile.role !== 'producer' || profile.group_name !== 'MUGNA PRODUCTIONS';
              if (needsUpdate) {
                  console.log('⚠️ Profile needs update!');
                  report.roleSync.status = 'Needs Update';
                  report.roleSync.details = {
                      current: { role: profile.role, group_name: profile.group_name },
                      target: { role: 'producer', group_name: 'MUGNA PRODUCTIONS' },
                      userId: targetUser.id
                  };
              } else {
                  console.log('✅ Profile is correct.');
                  report.roleSync.status = 'Clean';
              }
          }
      }
  }

  // 3. Integrity Audit
  console.log('\n🔍 3. Integrity Audit...');
  const { data: profileIds, error: pidError } = await fetchSupabase('/rest/v1/profiles?select=id');
  if (pidError) {
      console.error('Error fetching profiles:', pidError);
      return;
  }
  const validIds = new Set(profileIds.map(p => p.id));

  const { data: members, error: memError } = await fetchSupabase('/rest/v1/group_members?select=id,user_id');
  if (memError) console.error('Error fetching group_members:', memError);
  else {
      const { data: profileUserIds, error: puidError } = await fetchSupabase('/rest/v1/profiles?select=user_id');
      const validUserIds = new Set(profileUserIds.map(p => p.user_id));

      const orphans = members.filter(m => m.user_id && !validUserIds.has(m.user_id));

      if (orphans.length > 0) {
          console.log(`❌ Found ${orphans.length} orphan group_members (user_id not in profiles).`);
          report.integrity.groupMembers = orphans.map(o => o.id);
      } else {
           console.log('✅ group_members clean.');
      }
  }

  const { data: reqs, error: reqError } = await fetchSupabase('/rest/v1/collaboration_requests?select=id,sender_id,receiver_id');
  if (reqError) console.error('Error fetching requests:', reqError);
  else {
      const orphans = reqs.filter(r => !validIds.has(r.sender_id) || !validIds.has(r.receiver_id));
      if (orphans.length > 0) {
          console.log(`❌ Found ${orphans.length} orphan collaboration_requests.`);
          report.integrity.collaborationRequests = orphans.map(o => o.id);
      } else {
          console.log('✅ collaboration_requests clean.');
      }
  }

  // 4. Redundancy Check
  console.log('\n🔍 4. Redundancy Check...');
  // Check if theater_groups exists
  const { status: tgStatus } = await fetchSupabase('/rest/v1/theater_groups?select=*&limit=1');
  if (tgStatus === 404) {
      console.log('ℹ️ Table theater_groups does not exist. Skipping check.');
      report.redundancy = { status: 'Skipped (Table missing)', table: 'theater_groups' };
  } else {
      // If it exists, check group_name match
      // We need to fetch all producers from profiles and all groups from theater_groups
      // Assuming theater_groups has a link to producer (e.g., user_id or profile_id)
      // Since I don't know the schema if it existed, I can't write the logic perfectly,
      // but since it DOES NOT EXIST, this block is hypothetical.
      console.log('⚠️ Table theater_groups EXISTS! Checking redundancy...');
      // Logic would go here...
      report.redundancy = { status: 'Exists (Logic needed)', table: 'theater_groups' };
  }

  // 5. RLS Verification
  console.log('\n🔍 5. RLS Verification...');
  const { data: rlsData, error: rlsError, status } = await fetchSupabase('/rest/v1/collaboration_requests?select=*&limit=5', {}, PUBLISHABLE_KEY);

  if (status === 200 && rlsData && rlsData.length > 0) {
      console.log('❌ RLS FAILURE: Anon user could read collaboration_requests!');
      report.rls.collaboration_requests = 'INACTIVE (Data Leaked)';
  } else if (status === 200 && rlsData && rlsData.length === 0) {
       if (reqs && reqs.length > 0) {
           console.log('✅ RLS likely active (Data hidden).');
           report.rls.collaboration_requests = 'Active (Hidden)';
       } else {
           console.log('❓ Table empty, cannot verify RLS.');
           report.rls.collaboration_requests = 'Unknown (Empty Table)';
       }
  } else {
      console.log('✅ RLS likely active (Error/Restricted):', status);
      report.rls.collaboration_requests = 'Active (Restricted)';
  }

  console.log('\n\n================ AUDIT REPORT ================');
  console.log(JSON.stringify(report, null, 2));
}

runAudit().catch(console.error);
