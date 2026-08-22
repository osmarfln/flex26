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
          const daysToSync = body.daysToSync || 3;
          const syncAll = body.syncAll || false;
          const location = body.location; // Pode ser undefined para auto-sync ambos
          
          const auto = body.auto || false; // Se true, sincroniza ambos se necessário
          
          console.log(`[SYNC] Request received. Date: ${dateParam}, Days: ${daysToSync}, Location: ${location}, Auto: ${auto}`);
          
          // Fecha execuções travadas (sem finished_at) de tentativas anteriores
          await supabase
            .from('sync_logs')
            .update({
              status: 'error',
              finished_at: new Date().toISOString(),
              error_message: 'Execução interrompida antes de finalizar',
            })
            .eq('status', 'running')
            .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

          // Log sync attempt
          const { data: logEntry } = await supabase
            .from('sync_logs')
            .insert({ 
              status: 'running', 
              date_range_start: dateParam, 
              date_range_end: dateParam,
              location: location
            })
            .select()
            .single();

          let totalSynced = 0;
          
          if (syncAll) {
            console.log(`[SYNC] Starting FULL sync from external source for ${location}`);
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;
            
            // Define a tabela correta na origem baseada na localização solicitada
            const externalTable = location === 'capital' ? 'capital_results' : 'draw_results';

            while (hasMore) {
              const apiUrl = `${EXTERNAL_REST_URL}/${externalTable}?select=*&order=draw_date.desc,draw_time.desc&limit=${batchSize}&offset=${offset}`;
              
              const response = await fetch(apiUrl, {
                headers: {
                  'apikey': EXTERNAL_ANON_KEY,
                  'Authorization': `Bearer ${EXTERNAL_ANON_KEY}`
                }
              });

              if (!response.ok) {
                console.error(`[SYNC] API error: ${response.status}`);
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
                
                // Ignorar resultados incompletos (precisamos dos 5 prêmios)
                if (results.length < 5) continue;

                const groupStr = res.prize_1_group !== null && res.prize_1_group !== undefined 
                  ? String(res.prize_1_group).padStart(2, '0') 
                  : null;

                let drawTime = res.draw_time;
                let drawTimeValue = res.draw_time_value;

                if (location === 'capital') {
                  const capMap: Record<string, { type: string, value: string }> = {
                    'LCAP_09': { type: 'L-09', value: '09:00' },
                    'LCAP_10': { type: 'L-10', value: '10:00' },
                    'LCAP_11': { type: 'L-11', value: '11:00' },
                    'LCAP_13': { type: 'L-13', value: '13:00' },
                    'PTSP_13': { type: 'L-13', value: '13:00' },
                    'LCAP_14': { type: 'L-14', value: '14:00' },
                    'CAP_14':  { type: 'L-14', value: '14:00' },
                    'LCAP_15': { type: 'L-15', value: '15:00' },
                    'PTSP_15': { type: 'L-15', value: '15:00' }, // Added PTSP_15
                    'LCAP_16': { type: 'L-16', value: '16:00' },
                    'LCAP_18': { type: 'L-18', value: '18:00' },
                    'CAP_18':  { type: 'L-18', value: '18:00' },
                    'LCAP_19': { type: 'L-19', value: '19:00' },
                    'LCAP_20': { type: 'L-20', value: '20:30' },
                    'PTNSP_20': { type: 'L-20', value: '20:30' },
                    'LCAP_2230': { type: 'L-22', value: '22:30' }
                  };
                  
                  const mapped = capMap[drawTime];
                  if (!mapped) continue;
                  
                  drawTime = mapped.type;
                  drawTimeValue = mapped.value;
                } else {
                  // Mapeamento preciso para o Rio
                  const rioMap: Record<string, string> = {
                    'PPT': '09:20',
                    'PTM': '11:20',
                    'PT': '14:20',
                    'PTV': '16:20',
                    'PTN': '18:20',
                    'COR': '21:30'
                  };
                  drawTimeValue = rioMap[drawTime] || drawTimeValue;
                }

                if (!drawTimeValue) continue;

                await supabase
                  .from('lottery_results')
                  .upsert({
                    date: res.draw_date,
                    time_type: drawTime,
                    time_value: drawTimeValue,
                    results: results,
                    animal: res.prize_1_bicho,
                    animal_group: groupStr,
                    location: location === 'capital' || location === 'rio' ? location : 'rio',
                    created_at: new Date().toISOString()
                  }, { onConflict: 'date,time_type,location' });

                // Correção manual solicitada para LCAP 15:00 (7977)
                if (location === 'capital' && res.draw_date === '2026-08-22' && drawTime === 'L-15') {
                  await supabase
                    .from('lottery_results')
                    .update({ 
                      results: ['7977', '4166', '0339', '0722', '9190'],
                      animal: 'Peru',
                      animal_group: '20'
                    })
                    .match({ date: '2026-08-22', time_type: 'L-15', location: 'capital' });
                }

                totalSynced++;
              }
              offset += batchSize;
              if (offset > 100000) break;
            }
          } else {
            const locationsToSync = location ? [location] : ['rio', 'capital'];
            for (const loc of locationsToSync) {
              for (let i = 0; i < daysToSync; i++) {
                const currentSyncDate = new Date(dateParam);
                currentSyncDate.setDate(currentSyncDate.getDate() - i);
                const dateStr = currentSyncDate.toISOString().split('T')[0]!;
                
                const externalTable = loc === 'capital' ? 'capital_results' : 'draw_results';
                const apiUrl = `${EXTERNAL_REST_URL}/${externalTable}?draw_date=eq.${dateStr}&select=*`;
                
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
                      
                      if (results.length < 5) continue;

                      const groupStr = res.prize_1_group !== null && res.prize_1_group !== undefined 
                        ? String(res.prize_1_group).padStart(2, '0') 
                        : null;

                      let drawTime = res.draw_time;
                      let drawTimeValue = res.draw_time_value;

                      if (loc === 'capital') {
                        const capMap: Record<string, { type: string, value: string }> = {
                          'LCAP_09': { type: 'L-09', value: '09:00' },
                          'LCAP_10': { type: 'L-10', value: '10:00' },
                          'LCAP_11': { type: 'L-11', value: '11:00' },
                          'LCAP_13': { type: 'L-13', value: '13:00' },
                          'PTSP_13': { type: 'L-13', value: '13:00' },
                          'LCAP_14': { type: 'L-14', value: '14:00' },
                          'CAP_14':  { type: 'L-14', value: '14:00' },
                          'LCAP_15': { type: 'L-15', value: '15:00' },
                          'PTSP_15': { type: 'L-15', value: '15:00' }, // Added PTSP_15
                          'LCAP_16': { type: 'L-16', value: '16:00' },
                          'LCAP_18': { type: 'L-18', value: '18:00' },
                          'CAP_18':  { type: 'L-18', value: '18:00' },
                          'LCAP_19': { type: 'L-19', value: '19:00' },
                          'LCAP_20': { type: 'L-20', value: '20:30' },
                          'PTNSP_20': { type: 'L-20', value: '20:30' },
                          'LCAP_2230': { type: 'L-22', value: '22:30' }
                        };
                        
                        const mapped = capMap[drawTime];
                        if (!mapped) continue;
                        
                        drawTime = mapped.type;
                        drawTimeValue = mapped.value;
                      } else {
                        const rioMap: Record<string, string> = {
                          'PPT': '09:20',
                          'PTM': '11:20',
                          'PT': '14:20',
                          'PTV': '16:20',
                          'PTN': '18:20',
                          'COR': '21:30'
                        };
                        drawTimeValue = rioMap[drawTime] || drawTimeValue;
                      }

                      if (!drawTimeValue) continue;

                      await supabase
                        .from('lottery_results')
                        .upsert({
                          date: res.draw_date,
                          time_type: drawTime,
                          time_value: drawTimeValue,
                          results: results,
                          animal: res.prize_1_bicho,
                          animal_group: groupStr,
                          location: loc === 'capital' || loc === 'rio' ? loc : 'rio'
                        }, { onConflict: 'date,time_type,location' });
                      
                      totalSynced++;
                    }
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
