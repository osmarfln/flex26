import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

const EXTERNAL_REST_URL = 'https://tembxrechkrpabvrfrmk.supabase.co/rest/v1';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

export const Route = createFileRoute('/api/public/sync-results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate with apikey
        const authHeader = request.headers.get('apikey') || request.headers.get('authorization')?.replace('Bearer ', '');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Use local service role client to bypass RLS for syncing if possible, or just the anon key provided
        const supabase = createClient(
          process.env['VITE_SUPABASE_URL']!,
          authHeader,
          { auth: { persistSession: false } }
        );

        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const dateParam = body.date || new Date().toISOString().split('T')[0];
          const daysToSync = body.daysToSync || 1;
          const syncAll = body.syncAll || false;

          
          console.log(`[SYNC] Request received. Date: ${dateParam}, Days: ${daysToSync}`);
          
          // Log sync attempt
          const { data: logEntry } = await supabase
            .from('sync_logs')
            .insert({ 
              status: 'running', 
              date_range_start: dateParam, 
              date_range_end: dateParam 
            })
            .select()
            .single();

          let totalSynced = 0;
          
          for (let i = 0; i < daysToSync; i++) {
            const currentSyncDate = new Date(dateParam);
            currentSyncDate.setDate(currentSyncDate.getDate() - i);
            const isoString = currentSyncDate.toISOString();
            const dateStr = isoString.split('T')[0]!;
            
            const apiUrl = `${EXTERNAL_REST_URL}/draw_results?draw_date=eq.${dateStr}&select=*`;
            console.log(`[SYNC] Fetching from ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
              headers: {
                'apikey': EXTERNAL_ANON_KEY,
                'Authorization': `Bearer ${EXTERNAL_ANON_KEY}`
              }
            });
            
            if (response.ok) {
              const externalResults = await response.json();
              console.log(`[SYNC] Found ${Array.isArray(externalResults) ? externalResults.length : 0} records for ${dateStr}`);
              
              if (Array.isArray(externalResults) && externalResults.length > 0) {
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

                  console.log(`[SYNC] Upserting ${res.draw_date} ${res.draw_time}`);
                  
                  // Use direct supabase.from().upsert()
                  const { data: upsertData, error: upsertError } = await supabase
                    .from('lottery_results')
                    .upsert({
                      date: res.draw_date,
                      time_type: res.draw_time,
                      time_value: null,
                      results: results,
                      animal: res.prize_1_bicho,
                      animal_group: groupStr
                    }, { onConflict: 'date,time_type' })
                    .select();
                  
                  if (upsertError) {
                    console.error('[SYNC] Upsert error details:', JSON.stringify(upsertError));
                  } else {
                    console.log(`[SYNC] Successfully synced ${res.draw_date} ${res.draw_time}`);
                    totalSynced++;
                  }
                }
              }
            } else {
              const errBody = await response.text();
              console.error(`[SYNC] External API error: ${response.status} - ${errBody}`);
            }
          }

          if (logEntry) {
            await supabase
              .from('sync_logs')
              .update({ status: 'success', finished_at: new Date().toISOString(), records_synced: totalSynced })
              .eq('id', logEntry.id);
          }

          return new Response(JSON.stringify({ success: true, synced: totalSynced }), { 
            headers: { 'Content-Type': 'application/json' } 
          });

        } catch (error: any) {
          console.error('[SYNC] Internal error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
  }
})
