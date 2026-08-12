const { createClient } = require('@supabase/supabase-js');

const EXTERNAL_SUPABASE_URL = 'https://tembxrechkrpabvrfrmk.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

async def debug() {
  const client = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_ANON_KEY);
  
  console.log('--- Listing Tables ---');
  const { data: tables, error: tablesError } = await client.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
  console.log('Tables:', tables || tablesError);

  console.log('\n--- Checking draw_results ---');
  const { data: results, error: resultsError } = await client.from('draw_results').select('*').limit(5);
  console.log('draw_results sample:', results || resultsError);
  
  console.log('\n--- Checking capital_results ---');
  const { data: capResults, error: capError } = await client.from('capital_results').select('*').limit(5);
  console.log('capital_results sample:', capResults || capError);
}

debug();
