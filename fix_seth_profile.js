
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
    'Prefer': 'return=representation',
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) return { status: 204 };

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

async function fixProfile() {
  console.log('🚀 Starting Profile Fix for Seth...');

  // 1. Get User ID
  const { data: userData, error: userError } = await fetchSupabase('/auth/v1/admin/users', {}, SERVICE_ROLE_KEY);
  if (userError) {
      console.error('Error fetching users:', userError);
      return;
  }
  const targetUser = userData.users.find(u => u.email === 'sethalvarez2001@gmail.com');
  if (!targetUser) {
      console.error('❌ User sethalvarez2001@gmail.com not found in Auth!');
      return;
  }
  const userId = targetUser.id;
  console.log(`✅ Found User ID: ${userId}`);

  // 2. Check for existing profile by user_id
  console.log('🔍 Checking for existing profile by user_id...');
  const { data: profiles, error: profileError } = await fetchSupabase(`/rest/v1/profiles?user_id=eq.${userId}&select=*`);

  if (profiles && profiles.length > 0) {
      console.log('⚠️ Profile already exists! Updating...');
      const profile = profiles[0];
      const profileId = profile.id;

      const updateData = {
          role: 'producer',
          group_name: 'MUGNA PRODUCTIONS',
          updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error: updateError } = await fetchSupabase(`/rest/v1/profiles?id=eq.${profileId}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData)
      });

      if (updateError) {
          console.error('❌ Error updating profile:', updateError);
      } else {
          console.log('✅ Profile updated successfully:', updatedProfile);
      }
  } else {
      // 3. Create Profile
      console.log('🛠️ Creating new profile...');
      const newProfile = {
          id: userId,
          user_id: userId,
          email: 'sethalvarez2001@gmail.com',
          username: 'sethalvarez2001',
          role: 'producer',
          group_name: 'MUGNA PRODUCTIONS',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await fetchSupabase('/rest/v1/profiles', {
          method: 'POST',
          body: JSON.stringify(newProfile)
      });

      if (createError) {
           console.error('❌ Error creating profile:', createError);
      } else {
           console.log('✅ Profile created successfully!', createdProfile);
      }
  }
}

fixProfile().catch(console.error);
