import { createFileRoute, Link } from "@tanstack/react-router";
import { ANIMAL_ICONS } from "@/lib/animals";
import { getResults } from "@/lib/lottery.functions";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  History as HistoryIcon,
  Sparkles,
  ArrowLeft,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { SiteHeader } from "@/components/layout/SiteHeader";


export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    title: "Histórico de Resultados — Flex Gerenciador",
    meta: [
      { name: "description", content: "Pesquise o histórico completo de resultados do Jogo do Bicho Rio por dia, mês e ano." },
    ],
  }),
  component: Historico,
});

const ANIMAL_GROUPS = ANIMAL_ICONS;

function Historico() {
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');
  const [offset, setOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const limit = 20;

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ["history-results", date, dateEnd, offset, location],
    queryFn: () => getResults({ data: { date, dateEnd, offset, limit, location } }),
  });


  // Novos resultados entram automaticamente no histórico
  useLotteryRealtime("history-db-changes");



  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      <SiteHeader subtitle={location === 'rio' ? 'HISTÓRICO RIO' : 'HISTÓRICO CAPITAL'} />

      <main className="container mx-auto px-4 py-6 md:py-12 overflow-hidden">

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <HistoryIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Histórico de Resultados</h1>
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Pesquisa detalhada por data e banca</p>
            </div>
          </div>

          <Card className="dashboard-card p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Localização</label>
                <select 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all text-sm font-bold text-white outline-none"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value as any); setOffset(0); }}
                >
                  <option value="rio">Rio de Janeiro</option>
                  <option value="capital">Capital (Florianópolis)</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Início</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setOffset(0); }}
                    className="bg-transparent border-none outline-none text-sm font-bold w-full text-white color-scheme-dark"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Fim (Opcional)</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => { setDateEnd(e.target.value); setOffset(0); }}
                    className="bg-transparent border-none outline-none text-sm font-bold w-full text-white color-scheme-dark"
                  />
                </div>
              </div>

              
              <Button 
                onClick={() => refetch()}
                className="h-[52px] px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-xl gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10"
              >
                <Search className="w-5 h-5" /> Filtrar
              </Button>

              <Button 
                onClick={async () => {
                  if (!confirm(`Deseja iniciar a sincronização completa de 2026 para a banca ${location === 'rio' ? 'Rio' : 'Capital'}? Isso pode levar alguns segundos.`)) return;
                  
                  setIsSyncing(true);
                  try {
                    const res = await fetch('/api/public/sync-results', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ syncAll: true, location })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      alert(`Sincronização concluída! ${data.synced} registros foram atualizados.`);
                      refetch();
                    } else {
                      alert('Erro ao sincronizar. Tente novamente mais tarde.');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Erro de conexão ao tentar sincronizar.');
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                variant="outline"
                className="h-[52px] px-6 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : ''}`} /> 
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
              </Button>
            </div>
          </Card>

        </section>

        <AvisoObrigatorio />


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            ))
          ) : results?.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <HistoryIcon className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold uppercase tracking-widest">Nenhum resultado encontrado para esta data</p>
            </div>
          ) : (
            results?.map((res) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={res.id}
              >
                <Card className="dashboard-card overflow-hidden hover:border-primary/40 transition-all group bg-card">
                  <CardHeader className="p-5 pb-2 bg-white/[0.01] border-b border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-black italic tracking-tighter uppercase mb-1">
                          {res.time_type} {res.location === 'capital' ? 'CAPITAL' : 'RIO'}
                        </CardTitle>

                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase">
                          <Calendar className="w-3 h-3" />
                          {res.date ? format(parseISO(res.date), "dd/MM/yyyy") : "Data não disponível"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-mono font-black text-white">
                            {res.time_value || (
                              res.time_type === 'PPT' ? '09:20' :
                              res.time_type === 'PTM' ? '11:20' :
                              res.time_type === 'PT' ? '14:20' :
                              res.time_type === 'PTV' ? '16:20' :
                              res.time_type === 'PTN' ? '18:20' :
                              res.time_type === 'COR' ? '21:20' : '--:--'
                            )}
                          </span>

                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        {res.results.map((num, idx) => (
                          <div key={idx} className="flex gap-3 text-xs font-bold items-baseline">
                            <span className="text-white/20 w-4">{idx + 1}º</span>
                            <span className="font-mono tracking-widest text-sm">{num.padStart(4, '0')}</span>
                          </div>
                        ))}

                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        <div className="text-4xl mb-2">{ANIMAL_GROUPS[res.animal_group || ""] || "✨"}</div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                        <p className="text-2xl font-black text-primary tracking-tighter leading-none">{res.animal_group || '--'}</p>
                        <p className="text-[10px] font-bold mt-2 text-white/80 uppercase tracking-tight">{res.animal || '...'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {results && results.length >= limit && (
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="border-white/10 bg-white/5 rounded-xl hover:bg-white/10 gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + limit)}
              className="border-white/10 bg-white/5 rounded-xl hover:bg-white/10 gap-2"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-12 bg-[#080B14] text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Resultados diários automatizados via robô automatizado sem intervenção humana
      </footer>

    </div>
  );
}
