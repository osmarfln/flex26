import { createFileRoute } from '@tanstack/react-router'

const EXTERNAL_REST_URL = 'https://tembxrechkrpabvrfrmk.supabase.co/rest/v1';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc';

// Data atual no fuso de Brasília (UTC-3), evita "virar o dia" antes da hora.
function brasiliaToday(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]!;
}

export const Route = createFileRoute('/api/public/sync-results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Cliente de serviço no servidor: não depende de header enviado pelo cron.
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const supabase = supabaseAdmin as any;

        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const dateParam = body.date || brasiliaToday();
          const daysToSync = body.daysToSync || 2;
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
          
          if (syncAll) {
            console.log(`[SYNC] Starting FULL sync from external source`);
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
              const apiUrl = `${EXTERNAL_REST_URL}/draw_results?select=*&order=draw_date.desc,draw_time.asc&limit=${batchSize}&offset=${offset}`;
              console.log(`[SYNC] Fetching batch from offset ${offset}`);
              
              const response = await fetch(apiUrl, {
                headers: {
                  'apikey': EXTERNAL_ANON_KEY,
                  'Authorization': `Bearer ${EXTERNAL_ANON_KEY}`
                }
              });

              if (!response.ok) {
                console.error(`[SYNC] Batch fetch failed: ${response.status}`);
                break;
              }

              const externalResults = await response.json();
              if (!Array.isArray(externalResults) || externalResults.length === 0) {
                hasMore = false;
                break;
              }

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

                const drawTimeValue = res.draw_time_value || (
                  res.draw_time === 'PPT' ? '09:20' :
                  res.draw_time === 'PTM' ? '11:20' :
                  res.draw_time === 'PT' ? '14:20' :
                  res.draw_time === 'PTV' ? '16:20' :
                  res.draw_time === 'PTN' ? '18:20' :
                  res.draw_time === 'COR' ? '21:20' : null
                );

                await supabase
                  .from('lottery_results')
                  .upsert({
                    date: res.draw_date,
                    time_type: res.draw_time,
                    time_value: drawTimeValue,
                    results: results,
                    animal: res.prize_1_bicho,
                    animal_group: groupStr,
                    created_at: new Date().toISOString()
                  }, { onConflict: 'date,time_type' });


                
                totalSynced++;
              }

              console.log(`[SYNC] Synced ${totalSynced} records so far...`);
              offset += batchSize;
              // Safety break for sandbox environment if taking too long
              if (offset > 10000) break; 
            }
          } else {
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

                    const drawTimeValue = res.draw_time_value || (
                      res.draw_time === 'PPT' ? '09:20' :
                      res.draw_time === 'PTM' ? '11:20' :
                      res.draw_time === 'PT' ? '14:20' :
                      res.draw_time === 'PTV' ? '16:20' :
                      res.draw_time === 'PTN' ? '18:20' :
                      res.draw_time === 'COR' ? '21:20' : null
                    );

                    await supabase
                      .from('lottery_results')
                      .upsert({
                        date: res.draw_date,
                        time_type: res.draw_time,
                        time_value: drawTimeValue,
                        results: results,
                        animal: res.prize_1_bicho,
                        animal_group: groupStr
                      }, { onConflict: 'date,time_type' });

                    
                    totalSynced++;
                  }
                }
              }
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
