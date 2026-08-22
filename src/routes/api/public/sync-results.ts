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
          const location = body.location || 'rio'; // 'rio' ou 'capital'
          
          const auto = body.auto || false; // Se true, sincroniza ambos se necessário
          
          console.log(`[SYNC] Request received. Date: ${dateParam}, Days: ${daysToSync}, Location: ${location}, Auto: ${auto}`);
          
          // Se auto=true e location=rio, vamos garantir que Capital também seja atualizada em sequência se for uma chamada via cron
          // A lógica abaixo já itera sobre locationsToSync no handler de else.



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
              // A tabela draw_results não tem coluna location, capital_results também não precisa filtrar
              const apiUrl = `${EXTERNAL_REST_URL}/${externalTable}?select=*&order=draw_date.desc&limit=${batchSize}&offset=${offset}`;
              
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
                
                const groupStr = res.prize_1_group !== null && res.prize_1_group !== undefined 
                  ? String(res.prize_1_group).padStart(2, '0') 
                  : null;

                // Mapeamento de horários para Capital e Rio
                let drawTime = res.draw_time;
                let drawTimeValue = res.draw_time_value;

                if (location === 'capital') {
                  // Mapear horários da Capital da tabela capital_results
                  const capMap: Record<string, { type: string, value: string }> = {
                    'LCAP_09': { type: 'L-09', value: '09:00' },
                    'LCAP_10': { type: 'L-10', value: '10:00' },
                    'LCAP_11': { type: 'L-11', value: '11:00' },
                    'PTSP_13': { type: 'L-13', value: '13:00' }, // PTSP as L-13
                    'LCAP_13': { type: 'L-13', value: '13:00' },
                    'CAP_14': { type: 'L-14', value: '14:00' },
                    'BAND_15': { type: 'L-15', value: '15:00' },
                    'LCAP_16': { type: 'L-16', value: '16:00' },
                    'CAP_18': { type: 'L-18', value: '18:00' },
                    'LCAP_19': { type: 'L-19', value: '19:00' },
                    'LCAP_20': { type: 'L-20', value: '20:30' },
                    'PTNSP_20': { type: 'L-20', value: '20:30' },
                    'LCAP_2230': { type: 'L-22', value: '22:30' }
                  };
                  
                  if (capMap[drawTime]) {
                    const mapped = capMap[drawTime]!;
                    drawTime = mapped.type;
                    drawTimeValue = mapped.value;
                  } else if (drawTime.startsWith('L-')) {
                     // Caso já esteja no formato L-XX
                     drawTimeValue = drawTime.replace('L-', '') + ':00';
                  }
                } else {
                  // Mapeamento Rio
                  drawTimeValue = drawTimeValue || (
                    drawTime === 'PPT' ? '09:20' :
                    drawTime === 'PTM' ? '11:20' :
                    drawTime === 'PT' ? '14:20' :
                    drawTime === 'PTV' ? '16:20' :
                    drawTime === 'PTN' ? '18:20' :
                    drawTime === 'COR' ? '21:20' : null
                  );
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
                    location: location,
                    created_at: new Date().toISOString()
                  }, { onConflict: 'date,time_type,location' });

                totalSynced++;
              }
              offset += batchSize;
              // Permitir sincronização de todo o 2026 (aprox 365 dias * 11 horários = ~4000 registros)
              if (offset > 10000) break; 
            }
          } else {
            const locationsToSync = auto ? ['rio', 'capital'] : [location];
            for (const loc of locationsToSync) {
              for (let i = 0; i < daysToSync; i++) {
                const currentSyncDate = new Date(dateParam);
                currentSyncDate.setDate(currentSyncDate.getDate() - i);
                const dateStr = currentSyncDate.toISOString().split('T')[0]!;
                
                // Busca resultados da data específica e localização
                const apiUrl = `${EXTERNAL_REST_URL}/draw_results?draw_date=eq.${dateStr}&location=eq.${loc}&select=*`;
                
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
                      const recordLocation = res.location || loc;
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
                        res.draw_time === 'COR' ? '21:20' : 
                        res.draw_time.startsWith('L-') ? res.draw_time.replace('L-', '') + ':00' : null
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
                          location: recordLocation
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
