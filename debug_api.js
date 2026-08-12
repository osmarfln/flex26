const { createClient } = require('@supabase/supabase-js');

const EXTERNAL_SUPABASE_URL = 'https://tembxrechkrpabvrfrmk.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

async function debug() {
  const client = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_ANON_KEY);
  
  console.log('\n--- Checking draw_results ---');
  const { data: results, error: resultsError } = await client.from('draw_results').select('*').limit(2);
  console.log('draw_results sample:', JSON.stringify(results || resultsError, null, 2));
}

debug();
