import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

const EXTERNAL_REST_URL = 'https://tembxrechkrpabvrfrmk.supabase.co/rest/v1';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

export const Route = createFileRoute('/api/public/sync-results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get('apikey') || request.headers.get('authorization')?.replace('Bearer ', '');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const supabase = createClient(
          process.env['VITE_SUPABASE_URL']!,
          authHeader,
          { auth: { persistSession: false } }
        );

        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const dateParam = body.date || new Date().toISOString().split('T')[0];
          const daysToSync = body.daysToSync || 1;
          
          console.log(`[SYNC] Starting sync for ${dateParam}, days: ${daysToSync}`);
          
          const { data: logEntry, error: logError } = await supabase
            .from('sync_logs')
            .insert({ 
              status: 'running', 
              date_range_start: dateParam, 
              date_range_end: dateParam 
            })
            .select()
            .single();

          if (logError) console.error('[SYNC] Log entry error:', logError);

          let totalSynced = 0;
          
          for (let i = 0; i < daysToSync; i++) {
            const currentSyncDate = new Date(dateParam);
            currentSyncDate.setDate(currentSyncDate.getDate() - i);
            const isoString = currentSyncDate.toISOString();
            const dateStr = isoString.split('T')[0]!;
            
            const apiUrl = `${EXTERNAL_REST_URL}/draw_results?draw_date=eq.${dateStr}&select=*`;
            console.log(`[SYNC] Fetching from external: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
              headers: {
                'apikey': EXTERNAL_ANON_KEY,
                'Authorization': `Bearer ${EXTERNAL_ANON_KEY}`
              }
            });
            
            console.log(`[SYNC] External API Status: ${response.status}`);
            
            if (response.ok) {
              const externalResults = await response.json();
              console.log(`[SYNC] Received ${Array.isArray(externalResults) ? externalResults.length : 0} results from external.`);
              
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

                  console.log(`[SYNC] Upserting: ${res.draw_date} ${res.draw_time}`);
                  const { error: upsertError } = await supabase
                    .from('lottery_results')
                    .upsert({
                      date: res.draw_date,
                      time_type: res.draw_time,
                      time_value: null,
                      results: results,
                      animal: res.prize_1_bicho,
                      animal_group: groupStr
                    }, { onConflict: 'date,time_type' });
                  
                  if (upsertError) {
                    console.error('[SYNC] Upsert error:', upsertError);
                  } else {
                    totalSynced++;
                  }
                }
              }
            } else {
              const errText = await response.text();
              console.error(`[SYNC] External API Error: ${errText}`);
            }
          }

          console.log(`[SYNC] Total synced: ${totalSynced}`);

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
          console.error('[SYNC] Fatal error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
  }
})
