import { createFileRoute } from "@tanstack/react-router";
import { ANIMAL_ICONS } from "@/lib/animals";
import { getResults } from "@/lib/lottery.functions";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import {
  drawLabel,
  drawTimeValue,
  getScheduleForDate,
  brasiliaDateISO,
} from "@/lib/draw-order";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Calendar as CalendarIcon,
  History as HistoryIcon,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    title: "Histórico de Resultados — Flex Gerenciador",
    meta: [
      { name: "description", content: "Pesquise o histórico completo de resultados Rio e Capital por dia, mês e ano." },
    ],
  }),
  component: Historico,
});

type Location = 'rio' | 'capital';

function Historico() {
  const [date, setDate] = useState<Date>(parseISO(brasiliaDateISO()));
  const [isSyncing, setIsSyncing] = useState(false);

  const dateISO = format(date, "yyyy-MM-dd");

  const rioQuery = useQuery({
    queryKey: ["history-results", "rio", dateISO],
    queryFn: () => getResults({ data: { date: dateISO, location: 'rio', limit: 50 } }),
  });
  const capitalQuery = useQuery({
    queryKey: ["history-results", "capital", dateISO],
    queryFn: () => getResults({ data: { date: dateISO, location: 'capital', limit: 50 } }),
  });

  // Novos resultados entram automaticamente no histórico
  useLotteryRealtime("history-db-changes");

  const isLoading = rioQuery.isLoading || capitalQuery.isLoading;

  const sortBySchedule = (results: any[] | undefined, location: Location) => {
    const schedule = getScheduleForDate(location, dateISO);
    const order = new Map(schedule.map((s: any, i: number) => [s.timeType, i]));
    return (results ?? [])
      .slice()
      .sort((a, b) => (order.get(a.time_type) ?? 999) - (order.get(b.time_type) ?? 999));
  };

  const rioResults = sortBySchedule(rioQuery.data, 'rio');
  const capitalResults = sortBySchedule(capitalQuery.data, 'capital');

  const refetchAll = () => {
    rioQuery.refetch();
    capitalQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      <SiteHeader subtitle="HISTÓRICO" />

      <main className="container mx-auto px-4 py-6 md:py-12 overflow-hidden">

        <section className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <HistoryIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Histórico de Resultados</h1>
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Escolha uma data e veja Rio e Capital lado a lado</p>
            </div>
          </div>

          <Card className="dashboard-card p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[220px]">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Data do Sorteio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-[52px] justify-start text-left font-bold bg-white/5 border-white/10 rounded-xl hover:border-primary/30 text-white",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Escolha a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      locale={ptBR}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={refetchAll}
                className="h-[52px] px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-xl gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10"
              >
                <RefreshCw className="w-5 h-5" /> Atualizar
              </Button>

              <Button
                onClick={async () => {
                  if (!confirm('Deseja sincronizar os resultados de Rio e Capital agora? Isso pode levar alguns segundos.')) return;
                  setIsSyncing(true);
                  try {
                    for (const location of ['rio', 'capital'] as const) {
                      await fetch('/api/public/sync-results', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ syncAll: false, location })
                      });
                    }
                    refetchAll();
                    alert('Sincronização concluída!');
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
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </Card>

          <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-white/30">
            Exibindo resultados de <span className="text-primary">{format(date, "dd/MM/yyyy")}</span>
          </p>
        </section>

        <AvisoObrigatorio />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <LotteryColumn
              title="RIO DE JANEIRO"
              location="rio"
              dateISO={dateISO}
              results={rioResults}
            />
            <LotteryColumn
              title="CAPITAL & LCAP"
              location="capital"
              dateISO={dateISO}
              results={capitalResults}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-12 bg-[#080B14] text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Resultados diários automatizados via robô automatizado sem intervenção humana
      </footer>
    </div>
  );
}

function LotteryColumn({
  title,
  location,
  dateISO,
  results,
}: {
  title: string;
  location: Location;
  dateISO: string;
  results: any[];
}) {
  const byTime = new Map<string, any>();
  for (const r of results) byTime.set(r.time_type, r);
  const schedule = getScheduleForDate(location, dateISO);
  const extra = results.filter((r) => !schedule.some((s: any) => s.timeType === r.time_type));
  const entries = [
    ...schedule.map((s: any) => ({ timeType: s.timeType, label: location === 'capital' ? s.label : `${s.timeType} RIO`, timeValue: s.timeValue, res: byTime.get(s.timeType) })),
    ...extra.map((r) => ({ timeType: r.time_type, label: location === 'capital' ? drawLabel('capital', r.time_type, r.date) : `${r.time_type} RIO`, timeValue: r.time_value || drawTimeValue(location, r.time_type), res: r })),
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-white/10" />
        <h2 className="text-lg font-black italic tracking-tighter uppercase text-white/90">{title}</h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {entries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl">
          <HistoryIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Sem programação nesta data</p>
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={`${location}-${entry.timeType}`}
            >
              <Card className="dashboard-card overflow-hidden bg-card">
                <CardHeader className="p-4 pb-2 bg-white/[0.01] border-b border-white/5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-black italic tracking-tighter uppercase">
                      {entry.label}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-mono font-black text-white">
                        {entry.res?.time_value || entry.timeValue}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {entry.res ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        {entry.res.results.map((num: string, idx: number) => (
                          <div key={idx} className="flex gap-3 text-xs font-bold items-baseline">
                            <span className="text-white/20 w-4">{idx + 1}º</span>
                            <span className="font-mono tracking-widest text-sm">{num.padStart(4, '0')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        <div className="text-4xl mb-2">{ANIMAL_ICONS[entry.res.animal_group || ""] || "✨"}</div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                        <p className="text-2xl font-black text-primary tracking-tighter leading-none">{entry.res.animal_group || '--'}</p>
                        <p className="text-[10px] font-bold mt-2 text-white/80 uppercase tracking-tight">{entry.res.animal || '...'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-red-500 font-black uppercase tracking-widest text-xs animate-pulse">
                      Aguardando resultado...
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
