import { createClient } from '@supabase/supabase-js';
import process from 'process';

const EXTERNAL_SUPABASE_URL = 'https://tembxrechkrpabvrfrmk.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

async function testSync() {
  const dateStr = new Date().toISOString().split('T')[0];
  console.log(`Checking date: ${dateStr}`);

  const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_ANON_KEY);
  const { data, error } = await externalSupabase
    .from('draw_results')
    .select('*')
    .eq('draw_date', dateStr);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} results.`);
  if (data.length > 0) {
    console.log('Sample result:', JSON.stringify(data[0], null, 2));
  } else {
    // Try yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    console.log(`Checking yesterday: ${yStr}`);
    const { data: yData } = await externalSupabase
      .from('draw_results')
      .select('*')
      .eq('draw_date', yStr);
    console.log(`Found ${yData?.length || 0} results for yesterday.`);
    if (yData && yData.length > 0) {
      console.log('Sample result (yesterday):', JSON.stringify(yData[0], null, 2));
    }
  }
}

testSync();
