import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

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
          
          console.log(`Syncing date: ${dateParam}, days: ${daysToSync}`);
          
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
            
            const formattedDate = dateStr.split('-').reverse().join('-');
            // If it's today, we check the home page, otherwise the specific date URL
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const url = isToday 
              ? 'https://soresultados.info/' 
              : `https://soresultados.info/resultado-jogo-bicho-rio/${formattedDate}`;
            
            console.log(`Fetching: ${url}`);
            
            const response = await fetch(url, {
               headers: { 
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
               }
            });
            
            if (response.ok) {
              const html = await response.text();
              const results = parseRioResults(html, dateStr);
              
              for (const res of results) {
                const { error: upsertError } = await supabase
                  .from('lottery_results')
                  .upsert({
                    date: res.date,
                    time_type: res.time_type,
                    time_value: res.time_value,
                    results: res.results,
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

function parseRioResults(html: string, date: string) {
  const results: any[] = [];
  
  const schedules = [
    { type: 'PPT', time: '09:20' },
    { type: 'PTM', time: '11:20' },
    { type: 'PT', time: '14:20' },
    { type: 'PTV', time: '16:20' },
    { type: 'PTN', time: '18:20' },
    { type: 'Corujinha', time: '21:20' }
  ];

  schedules.forEach(schedule => {
    // Flexible regex for the draw block
    const regex = new RegExp(schedule.type + "\\s+\\d{2}h.*?1º PRÊMIO\\s+(\\d{4})\\s+([A-ZÇÃÊÍÓÚ-]+)\\s+GRUPO\\s+(\\d{2})", 'si');
    const match = html.match(regex);
    
    if (match && match.index !== undefined) {
      const otherPrizes: string[] = [match[1] || '----'];
      
      // Prizes regex to catch subsequent numbers
      // We look for patterns like "2º G11 2243" or just the group and number sequence
      const prizesRegex = /(\d+)º\s+G\d{2}\s+(\d{4})/gi;
      prizesRegex.lastIndex = match.index + match[0].length;
      
      let pMatch;
      let count = 0;
      while ((pMatch = prizesRegex.exec(html)) !== null && count < 4) {
        otherPrizes.push(pMatch[2] || '----');
        count++;
      }

      while (otherPrizes.length < 5) otherPrizes.push("----");

      results.push({
        date: date,
        time_type: schedule.type,
        time_value: schedule.time,
        results: otherPrizes,
        animal: match[2] || 'Aguardando',
        animal_group: match[3] || '--'
      });
    }
  });

  return results;
}
