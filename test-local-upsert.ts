import { createClient } from '@supabase/supabase-js';
import process from 'process';

const EXTERNAL_SUPABASE_URL = 'https://tembxrechkrpabvrfrmk.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

async function testSync() {
  const dateStr = '2026-08-11';
  const supabase = createClient(
    process.env['VITE_SUPABASE_URL']!,
    process.env['VITE_SUPABASE_ANON_KEY']!,
    { auth: { persistSession: false } }
  );
  
  const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_ANON_KEY);
  const { data: externalResults } = await externalSupabase
    .from('draw_results')
    .select('*')
    .eq('draw_date', dateStr);

  console.log(`Checking local insertion for ${dateStr}. Found ${externalResults?.length} external results.`);
  
  if (externalResults && externalResults.length > 0) {
    for (const res of externalResults) {
      const results = [
        res.prize_1_milhar,
        res.prize_2_milhar,
        res.prize_3_milhar,
        res.prize_4_milhar,
        res.prize_5_milhar
      ].filter(p => !!p);
      
      const groupStr = res.prize_1_group !== null && res.prize_1_group !== undefined 
        ? String(res.prize_1_group).padStart(2, '0') 
        : null;

      const { data, error } = await supabase
        .from('lottery_results')
        .upsert({
          date: res.draw_date,
          time_type: res.draw_time,
          results: results,
          animal: res.prize_1_bicho,
          animal_group: groupStr
        }, { onConflict: 'date,time_type' })
        .select();
      
      if (error) {
        console.error('Local Upsert Error:', JSON.stringify(error));
      } else {
        console.log(`Local Upsert Success: ${res.draw_date} ${res.draw_time}`, data);
      }
    }
  }
}

testSync();
