
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching shows:', error)
  } else {
    console.log('Successfully fetched shows:', data)
  }
}

testFetch()
