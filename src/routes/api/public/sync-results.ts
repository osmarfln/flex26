import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

const EXTERNAL_SUPABASE_URL = 'https://tembxrechkrpabvrfrmk.supabase.co';
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
          
          console.log(`Syncing from external API for date: ${dateParam}, days: ${daysToSync}`);
          
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
          
          // Fetch from external Supabase
          const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_ANON_KEY);
          
          for (let i = 0; i < daysToSync; i++) {
            const currentSyncDate = new Date(dateParam);
            currentSyncDate.setDate(currentSyncDate.getDate() - i);
            const dateStr = currentSyncDate.toISOString().split('T')[0]!;
            
            console.log(`Fetching results for ${dateStr} from external API...`);
            
            const { data: externalResults, error: externalError } = await externalSupabase
              .from('rio_results')
              .select('*')
              .eq('draw_date', dateStr);
            
            if (externalError) {
              console.error(`External fetch error for ${dateStr}:`, externalError);
              continue;
            }

            if (externalResults && externalResults.length > 0) {
              for (const res of externalResults) {
                // Map external schema to our schema
                // External: draw_date, draw_time, p1, p2, p3, p4, p5, animal, animal_group, etc.
                const mappedResults = [res.p1, res.p2, res.p3, res.p4, res.p5].filter(p => !!p);
                
                const { error: upsertError } = await supabase
                  .from('lottery_results')
                  .upsert({
                    date: res.draw_date,
                    time_type: res.draw_time_label || res.draw_time,
                    time_value: res.draw_time,
                    results: mappedResults,
                    animal: res.animal,
                    animal_group: res.animal_group
                  }, { onConflict: 'date,time_type' });
                
                if (!upsertError) totalSynced++;
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
          console.error('Sync error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
  }
})
