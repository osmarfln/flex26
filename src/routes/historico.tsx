import { createFileRoute, Link } from "@tanstack/react-router";
import { getResults } from "@/lib/lottery.functions";
import { supabase } from "@/integrations/supabase/client";
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

export const Route = createFileRoute("/historico")({
  head: () => ({
    title: "Histórico de Resultados — Flex Gerenciador",
    meta: [
      { name: "description", content: "Pesquise o histórico completo de resultados do Jogo do Bicho Rio por dia, mês e ano." },
    ],
  }),
  component: Historico,
});

const ANIMAL_GROUPS: Record<string, string> = {
  "01": "🦩", "02": "🦅", "03": "🫏", "04": "🦋", "05": "🐕",
  "06": "🐐", "07": "🦁", "08": "🐒", "09": "🐍", "10": "🐰",
  "11": "🐎", "12": "🐘", "13": "🐓", "14": "🐈", "15": "🐊",
  "16": "🐆", "17": "🐖", "18": "🦉", "19": "🦚", "20": "🦃",
  "21": "🐂", "22": "🐅", "23": "🐻", "24": "🦌", "25": "🐄",
};

function Historico() {
  const [date, setDate] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ["history-results", date, offset],
    queryFn: () => getResults({ data: { date, offset, limit } }),
  });

  useEffect(() => {
    const channel = supabase
      .channel('history-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lottery_results' },
        (payload: any) => {
          // Só atualiza se o novo resultado for da data selecionada
          if (payload.new && payload.new.date === date) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, refetch]);


  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group mr-4">
            <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
          </Link>
          <div className="flex flex-col flex-1">
            <span className="text-lg font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">Flex Gerenciador</span>
            <span className="text-[9px] text-primary/60 font-bold tracking-[0.2em]">HISTÓRICO RIO</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/portal" className="text-xs font-bold text-white/40 hover:text-white transition-colors">Portal</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12">
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
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Selecione a Data</label>
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
              
              <Button 
                onClick={() => refetch()}
                className="h-[52px] px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-xl gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10"
              >
                <Search className="w-5 h-5" /> Filtrar
              </Button>

              <Button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/public/sync-results', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ syncAll: true })
                    });
                    if (res.ok) {
                      alert('Sincronização completa iniciada com sucesso!');
                      refetch();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                variant="outline"
                className="h-[52px] px-6 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-primary" /> Sincronizar Tudo
              </Button>
            </div>
          </Card>

        </section>

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
                          {res.time_type} RIO
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
                            <span className="font-mono tracking-widest text-sm">{num}</span>
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
        Flex Gerenciador © 2026 • Dados automatizados via robô soresultados.info
      </footer>
    </div>
  );
}
