import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/public/sync-results')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate with apikey
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
          const body = await request.json().catch(() => ({}));
          const dateParam = body.date || new Date().toISOString().split('T')[0];
          
          console.log(`Iniciando sincronização para a data: ${dateParam}`);
          
          // Registrar início no log
          const { data: logEntry, error: logError } = await supabase
            .from('sync_logs')
            .insert({ status: 'running', date_range_start: dateParam, date_range_end: dateParam })
            .select()
            .single();

          // Buscar dados do soresultados.info
          // Nota: Em um ambiente de worker real, faríamos fetch().
          // Como estamos em um worker, usaremos fetch().
          const response = await fetch('https://soresultados.info', {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
          });
          
          if (!response.ok) throw new Error(`Falha ao buscar site: ${response.statusText}`);
          
          const html = await response.text();
          
          // Lógica de parsing simplificada para RIO
          // Procuramos por blocos de RIO e extraímos os dados
          // Isso é um mock da lógica de extração real baseada no dump anterior
          const results = parseRioResults(html, dateParam);
          
          let syncedCount = 0;
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
            
            if (!upsertError) syncedCount++;
          }

          // Atualizar log
          if (logEntry) {
            await supabase
              .from('sync_logs')
              .update({ status: 'success', finished_at: new Date().toISOString(), records_synced: syncedCount })
              .eq('id', logEntry.id);
          }

          return new Response(JSON.stringify({ success: true, synced: syncedCount }), { 
            headers: { 'Content-Type': 'application/json' } 
          });

        } catch (error: any) {
          console.error('Erro no sync:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
  }
})

// Função auxiliar de parsing (Regex based para RIO)
function parseRioResults(html: string, date: string) {
  const results: any[] = [];
  
  // Mapeamento de horários comuns do RIO
  const schedules = [
    { type: 'PPT', time: '09:20' },
    { type: 'PTM', time: '11:20' },
    { type: 'PT', time: '14:20' },
    { type: 'PTV', time: '16:20' },
    { type: 'PTN', time: '18:20' },
    { type: 'Corujinha', time: '21:20' }
  ];

  // Em um cenário real, analisaríamos o HTML com regex mais complexo
  // Aqui estamos simulando o sucesso da extração para os dados que vimos no dump
  // O dump mostrou blocos como: "PPT 09h HOJE 1º PRÊMIO 5953 GATO GRUPO 14"
  
  schedules.forEach(schedule => {
    // Tenta encontrar o bloco do horário no HTML
    const regex = new RegExp(`${schedule.type}.*?1º PRÊMIO.*?(\\d{4})\\s+([A-ZÇÃÊÍÓÚ-]+)\\s+GRUPO\\s+(\\d{2})`, 'si');
    const match = html.match(regex);
    
    if (match) {
      // Se encontrou o 1º prêmio, tenta buscar os outros (geralmente vêm em sequência)
      // Para o exemplo, vamos gerar resultados simulados baseados no 1º prêmio
      // Em produção, o regex extrairia os 5 ou 7 números.
      results.push({
        date: date,
        time_type: schedule.type,
        time_value: schedule.time,
        results: [match[1], "----", "----", "----", "----"],
        animal: match[2],
        animal_group: match[3]
      });
    }
  });

  return results;
}
