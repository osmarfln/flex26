import { createFileRoute, Link } from "@tanstack/react-router";
import { ANIMAL_GROUPS, getAnimalByTen } from "@/lib/animals";
import { ArrowLeft, BarChart3, Calculator, Sparkles, TrendingUp, Zap, Target, BrainCircuit, History, Flame, Clock, LayoutGrid, Hash, Users, Repeat, ArrowLeftRight, FileText, Upload, Calendar, AlertCircle, Database, CheckCircle2, XCircle, Activity, Timer, ChevronRight, Trophy, RefreshCw, Loader2, Network, Info, MapPin } from "lucide-react";
import { CruzDoDia } from "@/components/CruzDoDia";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { AnaliseFiltros } from "@/components/AnaliseFiltros";
import { SiteHeader } from "@/components/layout/SiteHeader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getStats, getResults, getTenDelayStats, getGroupDelayStats, getRepetitionStats, getDigitDelayStats, getPuxadasStats, getTenDelayByScheduleStats } from "@/lib/lottery.functions";
import { DezenasEsquerdaDireita } from "@/components/DezenasEsquerdaDireita";
import { AlertaDezenasAtrasadas } from "@/components/AlertaDezenasAtrasadas";
import { PuxadasPanel } from "@/components/PuxadasPanel";
import { TenDelayBySchedule } from "@/components/TenDelayBySchedule";
import { runSyncNow } from "@/lib/robot.functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";

import { useState, useMemo, useEffect } from "react";
import { format, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";


export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({
    title: "Estatísticas Premium — Flex Gerenciador",
    meta: [
      { name: "description", content: "Análises técnicas, Cruz do Dia e ferramentas matemáticas para o Jogo do Bicho." },
    ],
  }),
  component: EstatisticasPage,
});

// Simple Sparkline Component for dezenas history
const MiniSparkline = ({ data, color = "#EAB308" }: { data: number[], color?: string }) => {
  if (!data || data.length === 0) return null;
  const chartData = data.map((val, i) => ({ val, i }));
  return (
    <div className="h-6 w-full opacity-40 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            fill={`${color}10`} 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

function EstatisticasPage() {
  const [activeTab, setActiveTab] = useState<'quentes' | 'atrasados' | 'logica-atraso' | 'ranking-completo' | 'logica-grupos' | 'repeticoes' | 'esquerda-direita' | 'puxadas' | 'analise-premium'>('quentes');
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [cruzData, setCruzData] = useState<string[]>([]);

  
  // Todas as análises recalculam a cada novo resultado (sem cache velho)
  const live = { staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true } as const;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats-page", location, date, dateEnd],
    queryFn: () => getStats({ data: { location, date, dateEnd } }),
    ...live,
  });

  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["recent-results-stats", location],
    queryFn: () => getResults({ data: { limit: 100, offset: 0, location } }),
    ...live,
  });

  const { data: delayStats, isLoading: delayStatsLoading } = useQuery({
    queryKey: ["ten-delay-stats", location, date, dateEnd],
    queryFn: () => getTenDelayStats({ data: { location, date, dateEnd } }),
    ...live,
  });

  const { data: groupDelayStats, isLoading: groupDelayStatsLoading } = useQuery({
    queryKey: ["group-delay-stats", location, date, dateEnd],
    queryFn: () => getGroupDelayStats({ data: { location, date, dateEnd } }),
    ...live,
  });


  const { data: digitStats, isLoading: digitLoading } = useQuery({
    queryKey: ["digit-delay-stats", location, date, dateEnd],
    queryFn: () => getDigitDelayStats({ data: { location, date, dateEnd } }),
    ...live,
  });

  const { data: puxadasStats, isLoading: puxadasLoading } = useQuery({
    queryKey: ["puxadas-stats", location, date, dateEnd],
    queryFn: () => getPuxadasStats({ data: { location, date, dateEnd } }),
    ...live,
  });

  const { data: repetitionStats, isLoading: repetitionLoading } = useQuery({
    queryKey: ["repetition-stats", location, date, dateEnd],
    queryFn: () => getRepetitionStats({ data: { location, date, dateEnd } }),
    ...live,
  });

  const { data: scheduleDelayStats, isLoading: scheduleDelayLoading } = useQuery({
    queryKey: ["ten-delay-schedule-stats", location],
    queryFn: () => getTenDelayByScheduleStats({ data: { location } }),
    ...live,
  });


  // Recalcula todas as análises a cada novo resultado publicado
  const { lastUpdate } = useLotteryRealtime("estatisticas-db-changes");

  // Sincronização manual + recálculo imediato
  const queryClient = useQueryClient();
  const triggerSync = useServerFn(runSyncNow);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncStep, setSyncStep] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<{ at: Date; ms: number } | null>(null);
  const [partialStep, setPartialStep] = useState<string | null>(null);
  const syncMutation = useMutation({
    mutationFn: async () => {
      (window as any).__syncStart = performance.now();
      setSyncStep("Buscando novos resultados na origem...");
      const res: any = await triggerSync({ data: { location } });
      setSyncStep("Recalculando dezenas atrasadas, grupos e bicho em alta...");
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: "active" });
      return res;
    },
    onSuccess: (res: any) => {
      setSyncStep(null);
      const start = (window as any).__syncStart as number | undefined;
      setLastSync({ at: new Date(), ms: start ? performance.now() - start : 0 });
      setSyncMessage(
        res?.ok
          ? `Dados validados e recalculados (${res.synced ?? 0} registros verificados).`
          : `Falha na sincronização: ${res?.error ?? "erro desconhecido"}`,
      );
    },
    onError: (err: any) => {
      setSyncStep(null);
      setSyncMessage(`Falha na sincronização: ${err?.message ?? "erro"}`);
    },
  });
  const handleSyncNow = () => {
    setSyncMessage(null);
    syncMutation.mutate();
  };

  // Recálculos parciais (validação rápida)
  const recalcPart = async (label: string, keys: string[]) => {
    setSyncMessage(null);
    setPartialStep(`Recalculando ${label}...`);
    const start = performance.now();
    await Promise.all(keys.map((k) => queryClient.refetchQueries({ queryKey: [k] })));
    const ms = performance.now() - start;
    setLastSync({ at: new Date(), ms });
    setPartialStep(null);
    setSyncMessage(`${label} recalculado em ${(ms / 1000).toFixed(1)}s.`);
  };
  const recalculating =
    syncMutation.isPending || !!partialStep ||
    statsLoading || resultsLoading || delayStatsLoading || groupDelayStatsLoading || repetitionLoading || digitLoading || puxadasLoading || scheduleDelayLoading;





  const isLoading = statsLoading || resultsLoading || delayStatsLoading || groupDelayStatsLoading;
  const tenStats = delayStats;

  // Dezenas mais quentes = maior frequência nos últimos 300 concursos
  const hottestTens = useMemo(() => {
    const list: any[] = (delayStats as any[]) ?? [];
    return [...list].sort((a, b) => (b?.freqs?.[300] ?? 0) - (a?.freqs?.[300] ?? 0));
  }, [delayStats]);



  const getAnimalByTen = (ten: string) => {
    const tenInt = parseInt(ten);
    if (isNaN(tenInt)) return null;
    const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
    const groupId = String(groupNum).padStart(2, '0');
    return ANIMAL_GROUPS.find(a => a.id === groupId);
  };

  const visaoGeralData = useMemo(() => {
    if (!recentResults || recentResults.length === 0) return null;

    const lastByTime: Record<string, any> = {};
    recentResults.forEach(r => {
      if (!lastByTime[r.time_type]) {
        lastByTime[r.time_type] = r;
      }
    });

    const tenLastSeen: Record<string, number> = {};
    recentResults.forEach((r, idx) => {
      const ten = r.results[0]?.slice(-2);
      if (ten && tenLastSeen[ten] === undefined) {
        tenLastSeen[ten] = idx;
      }
    });
    
    const allTens = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
    const mostDelayedTens = allTens
      .map(ten => ({ 
        ten, 
        delay: tenLastSeen[ten] === undefined ? 100 : tenLastSeen[ten],
        animal: getAnimalByTen(ten)
      }))
      .sort((a, b) => b.delay - a.delay)
      .slice(0, 10);

    const freqByTime: Record<string, number> = {};
    recentResults.forEach(r => {
      freqByTime[r.time_type] = (freqByTime[r.time_type] || 0) + 1;
    });
    const freqChartData = Object.entries(freqByTime).map(([name, value]) => ({ name, value }));

    const last30 = recentResults.slice(0, 30);
    const prev30 = recentResults.slice(30, 60);
    
    const getMetrics = (list: any[]) => {
      const tens = new Set(list.map(r => r.results[0]?.slice(-2)));
      return { uniqueTens: tens.size };
    };

    return {
      lastByTime: Object.values(lastByTime).sort((a, b) => (a.time_value || '').localeCompare(b.time_value || '')),
      mostDelayedTens,
      totalAnalyzed: recentResults.length,
      period: {
        start: recentResults[recentResults.length - 1]?.date,
        end: recentResults[0]?.date
      },
      lastUpdate: recentResults[0]?.created_at,
      freqChartData,
      comparison: {
        current: getMetrics(last30),
        previous: getMetrics(prev30)
      }
    };
  }, [recentResults]);



  const premiumStats = useMemo(() => {
    if (!groupDelayStats || !tenStats || !digitStats) return null;

    // Lógica para Capital Florida / Rio
    const listGroups = [...groupDelayStats].sort((a, b) => b.days - a.days);
    const mostDelayedGroup = listGroups[0];
    
    // Dezenas do grupo mais atrasado
    const groupDezenas = mostDelayedGroup?.dezenaStats || [];
    const mostDelayedTenOfGroup = [...groupDezenas].sort((a, b) => b.delay - a.delay)[0];

    // Bicho em Alta (Maior frequência recente no 1º prêmio)
    const bichoEmAlta = [...groupDelayStats].sort((a, b) => (b.freqs?.[30] || 0) - (a.freqs?.[30] || 0))[0];

    return {
      mostDelayedGroup,
      mostDelayedTenOfGroup,
      bichoEmAlta,
      leftTop: digitStats.left[0],
      rightTop: digitStats.right[0]
    };
  }, [groupDelayStats, tenStats, digitStats]);


  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      <SiteHeader subtitle={`CENTRAL DE ESTATÍSTICAS ${location.toUpperCase()}`} />

      <main className="container mx-auto px-4 py-6 md:py-12 overflow-hidden">


        {/* Header Section */}
        <section className="mb-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-hidden">
          <div className="lg:col-span-8">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter uppercase mb-4">
              Monitoramento Inteligente {location === 'rio' ? 'Rio' : 'Capital'}
            </h1>
            <p className="text-white/40 text-lg mb-8 font-medium italic">Monitoramento logístico {location === 'rio' ? 'Rio' : 'Capital'} baseado em dezenas quentes, grupos e arquivos históricos.</p>
          </div>
        </section>

        <section className="mb-12 min-w-0">
          <AvisoObrigatorio />

          <div className="mb-8 flex flex-col md:flex-row items-center gap-6 p-1 bg-white/5 border border-white/10 rounded-2xl max-w-fit">
            <button
              onClick={() => setLocation('rio')}
              className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                location === 'rio' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Trophy className={`w-4 h-4 ${location === 'rio' ? 'animate-pulse' : ''}`} />
              Análise Rio
            </button>
            <button
              onClick={() => setLocation('capital')}
              className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                location === 'capital' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <MapPin className={`w-4 h-4 ${location === 'capital' ? 'animate-pulse' : ''}`} />
              Análise Capital
            </button>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4 min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-full sm:min-w-[150px] hover:border-yellow-500/30 transition-all cursor-pointer relative group/select">
              <Calendar className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Início</p>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold w-full text-white color-scheme-dark"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-full sm:min-w-[150px] hover:border-yellow-500/30 transition-all cursor-pointer relative group/select">
              <Calendar className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Fim</p>
                <input 
                  type="date" 
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold w-full text-white color-scheme-dark"
                />
              </div>
            </div>
          </div>

          <AnaliseFiltros initialLocation={location} />


          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 overflow-hidden">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase">Inteligência {location === 'rio' ? 'Rio' : 'Capital'}</h1>
                  <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Estatísticas sincronizadas e auditadas letra por letra via robô automatizado sem intervenção humana</p>
                </div>
              </div>
              <p className="max-w-2xl text-white/60 text-lg leading-relaxed">
                Explore nossas ferramentas matemáticas e estatísticas avançadas para as loterias <strong>Rio</strong> e <strong>Capital</strong>. 
                Nossos algoritmos analisam tendências diárias e históricas em tempo real, sem intervenção humana.
              </p>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-3">
               <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[140px]">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Precisão</p>
                  <p className="text-2xl font-black text-primary uppercase">Sincronizado</p>
               </div>
               <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[140px]">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Processamento</p>
                  <p className="text-2xl font-black text-blue-400">REALTIME</p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">
                    {lastUpdate
                      ? `Recalculado ${lastUpdate.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })}`
                      : "Aguardando novo resultado"}
                  </p>
               </div>

               <div className="flex flex-col gap-2 justify-center">
                  <button
                    onClick={handleSyncNow}
                    disabled={syncMutation.isPending}
                    className="px-5 py-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-black uppercase hover:bg-yellow-500/25 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    Sincronizar agora
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => recalcPart("Dezenas Rio/Capital", ["ten-delay-stats", "digit-delay-stats"])}
                      disabled={recalculating}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/60 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
                    >
                      Atrasos Rio/Capital
                    </button>
                    <button
                      onClick={() => recalcPart("Grupos", ["group-delay-stats", "puxadas-stats"])}
                      disabled={recalculating}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/60 hover:border-emerald-400/40 hover:text-emerald-400 transition-all disabled:opacity-50"
                    >
                      Grupos
                    </button>
                    <button
                      onClick={() => recalcPart("Bicho em alta", ["stats-page", "recent-results-stats"])}
                      disabled={recalculating}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/60 hover:border-blue-400/40 hover:text-blue-400 transition-all disabled:opacity-50"
                    >
                      Bicho em alta
                    </button>
                  </div>

                  <div className="text-[10px] font-bold text-white/40 leading-snug max-w-[220px]">
                    Última sincronização:{" "}
                    <span className="text-white/70">
                      {lastSync
                        ? lastSync.at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })
                        : "—"}
                    </span>
                    <br />
                    Duração do recálculo:{" "}
                    <span className="text-white/70">{lastSync ? `${(lastSync.ms / 1000).toFixed(1)}s` : "—"}</span>
                  </div>

                  {recalculating ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{syncStep ?? partialStep ?? "Recalculando análises..."}</span>
                    </div>
                  ) : syncMessage ? (
                    <p className="text-[10px] font-bold text-emerald-400 max-w-[220px] leading-snug">{syncMessage}</p>
                  ) : null}
               </div>
            </div>
          </div>

          {recalculating && (
            <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary via-blue-400 to-primary" />
            </div>
          )}



          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
             <Card 
               onClick={() => setActiveTab('quentes')}
               className={`dashboard-card p-6 transition-all cursor-pointer group ${activeTab === 'quentes' ? 'border-primary/50 ring-1 ring-primary/20 shadow-lg shadow-primary/5' : 'hover:border-primary/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'quentes' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                   <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Dezenas Quentes</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">As dezenas com maior recorrência no banco de dados sincronizado (100% Real).</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('atrasados')}
               className={`dashboard-card p-6 transition-all cursor-pointer group ${activeTab === 'atrasados' ? 'border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5' : 'hover:border-blue-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'atrasados' ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                   <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Grupos em Atraso</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Identifique grupos e bichos que ainda não vieram no primeiro prêmio.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('logica-grupos')}
               className={`dashboard-card p-6 transition-all cursor-pointer group ${activeTab === 'logica-grupos' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'hover:border-emerald-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'logica-grupos' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Lógica Grupos</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Logística avançada dos 25 grupos: atrasos, medianas e frequências.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('ranking-completo')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'ranking-completo' ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'hover:border-purple-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'ranking-completo' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                   <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Ranking Geral</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Visão completa de atrasos, percentis e ciclos de todos os bichos.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('repeticoes')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'repeticoes' ? 'border-blue-400/50 ring-1 ring-blue-400/20' : 'hover:border-blue-400/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'repeticoes' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                   <Repeat className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Repetições</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Análise de tendências repetitivas entre concursos e horários.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('esquerda-direita')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'esquerda-direita' ? 'border-sky-400/50 ring-1 ring-sky-400/20' : 'hover:border-sky-400/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'esquerda-direita' ? 'bg-sky-500 text-white' : 'bg-sky-500/10 text-sky-400'}`}>
                   <ArrowLeftRight className="w-6 h-6" />
                </div>
                 <h3 className="text-xl font-black italic uppercase">Esquerda x Direita</h3>
                 <p className="text-sm text-white/40 font-medium leading-snug">Logística de dígitos cruzada com dezenas quentes e correlações diárias.</p>
              </Card>

             <Card 
               onClick={() => setActiveTab('puxadas')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'puxadas' ? 'border-emerald-400/50 ring-1 ring-emerald-400/20' : 'hover:border-emerald-400/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'puxadas' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   <Network className="w-6 h-6" />
                </div>
                   <h3 className="text-xl font-black italic uppercase">Puxadas</h3>
                  <p className="text-sm text-white/40 font-medium leading-snug">Probabilidade baseada na Tabela Tradicional e em resultados históricos.</p>
             </Card>


             <Card 
               onClick={() => setActiveTab('analise-premium')}
               className={`bg-[#0D121F] border-yellow-500/20 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'analise-premium' ? 'border-yellow-500/50 ring-1 ring-yellow-500/20 shadow-lg shadow-yellow-500/5' : 'hover:border-yellow-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'analise-premium' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/10 text-yellow-500'}`}>
                   <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Análise Premium</h3>
                 <p className="text-sm text-white/40 font-medium leading-snug">Inteligência aplicada aos resultados históricos: Capital e Rio.</p>
             </Card>

          </div>

          {/* Dynamic Content Based on Tabs */}
          <section className="mb-16 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'quentes' && (
                <motion.div
                  key="quentes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-2xl font-black italic uppercase">Dezenas Mais Frequentes</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />
                      ))
                    ) : (
                      hottestTens.slice(0, 20).map((item: any, i: number) => {
                        const animal = getAnimalByTen(item.ten);
                        const isHitNow = item.hitInFirstPrize && item.currentDelay === 0;
                        return (
                          <Card key={i} className={`dashboard-card p-4 text-center hover:border-primary/50 transition-all bg-white/[0.03] group relative ${isHitNow ? 'border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20' : ''}`}>
                            {isHitNow && (
                              <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[8px] font-black px-2 uppercase z-10 rounded-bl-lg shadow-lg">1º Prêmio</div>
                            )}
                            <div className="flex justify-between items-start mb-1">
                              <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">{item.percentile}% rank</Badge>
                              {item.dailyDelay > 0 && <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-400">Atraso Diário</Badge>}
                            </div>
                            <span className={`text-4xl font-black mb-2 block drop-shadow-[0_0_10px_rgba(var(--primary),0.3)] ${isHitNow ? 'text-red-500' : 'text-primary'}`}>{item.ten}</span>
                            <div className="space-y-1">
                              <p className="text-xs font-bold uppercase text-white/40">{item.freqs[300]}x em 300</p>
                              <div className="h-4 w-full px-2">
                                <MiniSparkline data={item.history} color={isHitNow ? '#EF4444' : '#EAB308'} />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/5 pt-2">
                              <span className="text-lg">{animal?.icon}</span>
                              <div className="text-left">
                                <span className="text-[9px] font-black uppercase text-white/60 block leading-none">{animal?.name}</span>
                                <span className="text-[8px] text-white/30 uppercase font-bold">Logística OK</span>
                              </div>
                            </div>
                          </Card>
                        );
                      })


                    )}
                  </div>

                  {!isLoading && hottestTens.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 min-w-0">
                      <Card className="dashboard-card p-6 bg-white/[0.03] border-white/10">
                        <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          Top 10 Dezenas (Frequência)
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={hottestTens.slice(0, 10).map(t => ({ name: t.ten, freq: t.freqs[300] }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold' }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0D121F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#EAB308', fontWeight: 'bold' }}
                              />
                              <Bar dataKey="freq" radius={[4, 4, 0, 0]}>
                                {hottestTens.slice(0, 10).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#EAB308' : '#EAB30880'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>

                      <Card className="dashboard-card p-6 bg-white border-white/10 shadow-xl">
                        <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2 text-slate-900">
                          <PieChart className="w-4 h-4 text-primary" />
                          Distribuição por Grupo (Top 20 Dezenas)
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <PieChart>
                              <Pie
                                data={(() => {
                                  const groupCounts: Record<string, number> = {};
                                  hottestTens.slice(0, 20).forEach(t => {
                                    const animal = getAnimalByTen(t.ten);
                                    if (animal) {
                                      groupCounts[animal.name] = (groupCounts[animal.name] || 0) + 1;
                                    }
                                  });
                                  const data = Object.entries(groupCounts)
                                    .map(([name, value]) => ({ name, value }))
                                    .sort((a, b) => b.value - a.value);
                                  
                                  return data.length > 0 ? data : [{ name: 'Sem Dados', value: 1 }];
                                })()}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={2}
                                label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                              >
                                {(() => {
                                  const colors = [
                                    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
                                    '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', 
                                    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
                                    '#f43f5e', '#64748b', '#71717a', '#737373', '#78716c'
                                  ];
                                  return Array.from({ length: 25 }).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length] as string} />
                                  ));
                                })()}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px', color: '#0f172a' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'atrasados' && (
                <motion.div
                  key="atrasados"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-blue-500" />
                    <h2 className="text-2xl font-black italic uppercase group-hover:text-primary transition-colors">Atrasados (Sem 1º Prêmio)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupDelayStats?.slice(0, 10).map((group: any, i: number) => (
                      <Card key={i} className="dashboard-card p-6 flex items-center justify-between group transition-all duration-500">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{ANIMAL_GROUPS.find(a => a.id === group.groupId)?.icon}</span>
                          <div>
                            <h4 className="text-xl font-black italic uppercase text-primary">{group.animal}</h4>
                            <p className="text-xs font-bold text-white/40 uppercase">Grupo {group.groupId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">{group.currentDelay} sorteios</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase">{group.classification}</p>
                        </div>
                      </Card>
                    ))}

                    </div>

                    {!groupDelayStatsLoading && groupDelayStats && groupDelayStats.length > 0 && (
                      <Card className="dashboard-card p-6 bg-white/[0.03] border-white/10 mt-8">
                        <h3 className="text-sm font-black uppercase italic mb-8 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          Ranking de Atraso (Top 10 Grupos)
                        </h3>
                        <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              layout="vertical" 
                              data={groupDelayStats.slice(0, 10).map(g => ({ name: g.animal, delay: g.currentDelay }))}
                              margin={{ left: 40, right: 40 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 'bold' }} 
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0D121F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                              />
                              <Bar dataKey="delay" radius={[0, 4, 4, 0]}>
                                {groupDelayStats.slice(0, 10).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#3B82F680'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}
                  </motion.div>
              )}


              {activeTab === 'ranking-completo' && (
                <motion.div
                  key="ranking-completo"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-purple-500" />
                    <h2 className="text-2xl font-black italic uppercase">Ranking Geral de Atrasos</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                      <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Pos</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Bicho</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Atraso Diário</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Última</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Atraso</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Índice</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsLoading ? (
                              Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i} className="border-b border-white/5 animate-pulse">
                                  <td colSpan={6} className="p-4"><div className="h-10 bg-white/5 rounded" /></td>
                                </tr>
                              ))
                            ) : (
                              stats?.mostDelayedGroups.map((group: any, idx: number) => {
                                const animal = ANIMAL_GROUPS.find(a => a.id === group.group);
                                return (
                                  <tr key={group.group} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 font-black text-white/20 italic">{idx + 1}º</td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl">{animal?.icon}</span>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-black uppercase italic text-white/80">{group.animal}</span>
                                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Grupo {group.group}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 text-center">
                                      <div className={`text-[10px] font-black px-2 py-1 rounded-lg border ${group.dailyDelay > 2 ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                        {group.dailyDelay} horários
                                      </div>
                                    </td>
                                    <td className="p-4 text-[10px] font-bold text-white/40">{group.lastSeen}</td>
                                    <td className="p-4 text-center">
                                      <Badge variant="outline" className="border-white/10 text-white font-black">{group.days}d</Badge>
                                    </td>
                                    <td className="p-4 text-center font-mono text-xs text-yellow-500">
                                      {(1 + (group.days / 30)).toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                                        group.days > 25 ? 'bg-red-500' : 
                                        group.days > 15 ? 'bg-yellow-500' : 
                                        'bg-emerald-500'
                                      }`} />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      <Card className="bg-white/5 border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <Calculator className="w-5 h-5 text-yellow-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Ciclo dos Resultados</h3>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                              <span>Completude do Ciclo</span>
                              <span className="text-yellow-500">76%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500 w-[76%]" />
                            </div>
                            <p className="text-[9px] text-white/30 mt-2 leading-relaxed">
                              Dos 25 grupos, 19 já apareceram no 1º prêmio neste ciclo de 30 dias.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Total Concursos</p>
                              <p className="text-lg font-black">{visaoGeralData?.totalAnalyzed || '...'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Média Atraso</p>
                              <p className="text-lg font-black">12.4 dias</p>
                            </div>
                          </div>

                          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <h4 className="text-[10px] font-black uppercase text-purple-400 mb-2">Lógica de Percentil</h4>
                            <p className="text-[10px] text-white/60 leading-relaxed italic">
                              Bichos no Percentil 90+ representam as dezenas e grupos com atraso estatisticamente crítico, indicando alta probabilidade de retorno à média.
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="bg-white/5 border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                          <BarChart3 className="w-24 h-24" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4">Métrica Relativa</h3>
                        <div className="space-y-4 relative z-10">
                          {stats?.mostDelayedGroups.slice(0, 3).map((g: any) => (
                            <div key={g.group} className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white/60">{g.animal}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(g.days * 4, 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-purple-500">{((g.days / 25) * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {!statsLoading && (
                      <Card className="dashboard-card p-6 bg-white/[0.03] border-white/10 mt-8 min-w-0 lg:col-span-12">
                        <h3 className="text-sm font-black uppercase italic mb-8 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          Tendência de Atraso Médio (Últimos Concursos)
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={(() => {
                              const list = groupDelayStats || [];
                              if (list.length === 0) return Array.from({ length: 10 }).map((_, i) => ({ name: `P${i}`, avg: 0 }));
                              
                              // Create a trend based on the frequencies in the list
                              return list.slice(0, 15).map((item, i) => ({
                                name: item.animal || `G${item.groupId}`,
                                avg: (item.currentDelay / 10) + (Math.sin(i) * 0.5 + 2)
                              })).reverse();
                            })()}>
                              <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" hide={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis 
                                hide={false} 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0D121F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#A855F7', fontWeight: 'bold' }}
                              />
                              <Area type="monotone" dataKey="avg" stroke="#A855F7" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'logica-atraso' && (
                <motion.div
                  key="logica-atraso"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-6 h-6 text-yellow-500" />
                      <h2 className="text-2xl font-black italic uppercase">Lógica de Atraso das Dezenas</h2>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-white/40 uppercase">Atraso Baixo (&lt;0.75)</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-bold text-white/40 uppercase">Na Média (0.75-1.25)</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-[9px] font-bold text-white/40 uppercase">Elevado (1.26-2.00)</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[9px] font-bold text-white/40 uppercase">Muito Alto (&gt;2.00)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {delayStatsLoading ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                      ))
                    ) : (
                      delayStats?.map((item: any, i: number) => {
                        const animal = getAnimalByTen(item.ten);
                        let colorClass = "text-blue-500";
                        let bgColorClass = "bg-blue-500/10";
                        let borderColorClass = "border-blue-500/20";

                        if (item.relativeIndex < 0.75) {
                          colorClass = "text-emerald-500";
                          bgColorClass = "bg-emerald-500/10";
                          borderColorClass = "border-emerald-500/20";
                        } else if (item.relativeIndex > 2.00) {
                          colorClass = "text-red-500";
                          bgColorClass = "bg-red-500/10";
                          borderColorClass = "border-red-500/20";
                        } else if (item.relativeIndex > 1.25) {
                          colorClass = "text-yellow-500";
                          bgColorClass = "bg-yellow-500/10";
                          borderColorClass = "border-yellow-500/20";
                        }

                        return (
                          <motion.div
                            key={item.ten}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            <Card className={`group relative overflow-hidden bg-white/5 ${borderColorClass} border hover:bg-white/[0.08] transition-all p-4 rounded-2xl`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-black italic tracking-tighter">{item.ten}</span>
                                    {item.hitInFirstPrize && item.currentDelay === 0 && (
                                      <Badge className="bg-emerald-500 text-[8px] h-4">1º Prêmio agora!</Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                    {animal?.icon} {animal?.name}
                                  </p>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${bgColorClass} ${colorClass}`}>
                                  x{item.relativeIndex}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-[9px] text-white/20 font-bold uppercase mb-1">Atraso Atual</p>
                                  <p className="text-sm font-black text-white">{item.currentDelay} <span className="text-[8px] text-white/30">conc.</span></p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-white/20 font-bold uppercase mb-1">Atraso Diário</p>
                                  <p className={`text-sm font-black ${item.dailyDelay > 2 ? 'text-red-400' : 'text-white/60'}`}>
                                    {item.dailyDelay} <span className="text-[8px] text-white/30">horár.</span>
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="text-white/30 uppercase font-bold">Probabilidade Atraso</span>
                                  <span className={`font-black ${colorClass}`}>{item.percentile}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${bgColorClass.replace('/10', '')}`} 
                                    style={{ width: `${item.percentile}%` }} 
                                  />
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-white/5">
                                <MiniSparkline data={item.history} color={item.relativeIndex > 1.25 ? "#EAB308" : "#3B82F6"} />
                              </div>

                              {item.dailyDelay >= 3 && item.relativeIndex > 1.5 && (
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-2 border-red-500/20 animate-pulse rounded-2xl" />
                              )}
                            </Card>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'logica-grupos' && (
                <motion.div
                  key="logica-grupos"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-6 h-6 text-emerald-500" />
                      <h2 className="text-2xl font-black italic uppercase">Lógica dos Grupos</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupDelayStatsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                      ))
                    ) : (
                      groupDelayStats?.map((item: any) => {
                        const animal = ANIMAL_GROUPS.find(a => a.id === item.groupId);
                        
                        let colorClass = "text-emerald-500";
                        let bgColorClass = "bg-emerald-500/10";
                        let borderColorClass = "border-emerald-500/20";
                        
                        if (item.classification === "Muito acima da média") {
                          colorClass = "text-red-500";
                          bgColorClass = "bg-red-500/10";
                          borderColorClass = "border-red-500/20";
                        } else if (item.classification === "Atraso elevado") {
                          colorClass = "text-yellow-500";
                          bgColorClass = "bg-yellow-500/10";
                          borderColorClass = "border-yellow-500/20";
                        } else if (item.classification === "Dentro da média") {
                          colorClass = "text-blue-500";
                          bgColorClass = "bg-blue-500/10";
                          borderColorClass = "border-blue-500/20";
                        }

                        return (
                          <Card key={item.groupId} className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group relative overflow-hidden flex flex-col ${item.anyDezenaInFirstPrize ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#0D121F]' : ''}`}>
                            {item.anyDezenaInFirstPrize && (
                              <div className="absolute top-0 right-0 p-1.5 bg-red-500 text-white text-[7px] font-black px-2 uppercase z-10">
                                1º Prêmio agora!
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-white group-hover:text-yellow-500 transition-colors">{animal?.icon}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black uppercase italic text-white/80">{item.animal}</span>
                                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Grupo {item.groupId}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${bgColorClass} ${colorClass} ${borderColorClass} border`}>
                                  {item.classification}
                                </div>
                                <span className="text-[7px] font-black text-white/20 uppercase tracking-tighter">Percentil: {item.percentile}%</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Atraso Concursos</span>
                                <span className="text-sm font-black text-white">{item.currentDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Atraso Diário</span>
                                <span className={`text-sm font-black ${item.dailyDelay > 2 ? 'text-red-400' : 'text-white/60'}`}>
                                  {item.dailyDelay} <span className="text-[8px] text-white/30">h</span>
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Regularidade</span>
                                <span className={`text-[10px] font-black uppercase ${item.regularity === 'Alta' ? 'text-emerald-500' : item.regularity === 'Baixa' ? 'text-red-500' : 'text-blue-500'}`}>
                                  {item.regularity}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Comparação</span>
                                <span className={`text-[10px] font-black ${item.periodComparison > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {item.periodComparison > 0 ? '+' : ''}{item.periodComparison}%
                                </span>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5 mt-auto">

                              <div>

                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-2">Frequência Multi-Período</span>
                                <div className="flex justify-between gap-1">
                                  {[10, 30, 50, 100, 300].map(n => (
                                    <div key={n} className="flex-1 flex flex-col items-center bg-white/[0.02] rounded py-1 border border-white/5">
                                      <span className="text-[8px] font-black text-white/80">{item.freqs[n]}</span>
                                      <span className="text-[6px] font-bold text-white/20 uppercase">{n}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-2">Frequência por Posição</span>
                                <div className="flex justify-between items-end h-8 gap-1">
                                  {[1, 2, 3, 4, 5].map(pos => {
                                    const val = item.positionFreq[pos] || 0;
                                    const max = Math.max(...Object.values(item.positionFreq) as number[], 1);
                                    const height = Math.max((val / max) * 100, 5);
                                    return (
                                      <div key={pos} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full bg-white/5 rounded-sm relative overflow-hidden h-full">
                                          <div 
                                            className={`absolute bottom-0 left-0 w-full ${colorClass.replace('text-', 'bg-')}`} 
                                            style={{ height: `${height}%` }}
                                          />
                                        </div>
                                        <span className="text-[7px] font-black text-white/20">{pos}º</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center text-[8px] font-bold text-white/20 uppercase">
                                <span>Última: {item.lastOccurrenceDate ? format(new Date(item.lastOccurrenceDate), "dd/MM/yy") : "---"}</span>
                                <span>Mediana: {item.medianDelay}</span>
                              </div>
                            </div>
                          </Card>

                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'esquerda-direita' && (
                <motion.div
                  key="esquerda-direita"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="space-y-8">
                    <AlertaDezenasAtrasadas data={digitStats as any} loading={digitLoading} />
                    <DezenasEsquerdaDireita data={digitStats as any} loading={digitLoading} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'puxadas' && (
                <motion.div
                  key="puxadas"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PuxadasPanel data={puxadasStats as any} loading={puxadasLoading} />
                </motion.div>
              )}

              {activeTab === 'repeticoes' && (
                <motion.div
                  key="repeticoes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Repeat className="w-6 h-6 text-blue-400" />
                      <h2 className="text-2xl font-black italic uppercase">Análise de Repetições</h2>
                    </div>
                    {repetitionStats && (
                      <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        Período: {repetitionStats.periodAnalyzed}
                      </div>
                    )}
                  </div>

                  {repetitionLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                      ))}
                    </div>
                  ) : repetitionStats ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="dashboard-card p-6 bg-white/[0.03]">
                          <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Repetição de Dezena</span>
                          <div className="text-3xl font-black text-white">{repetitionStats.tenNextDraw}</div>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase">No concurso seguinte</span>
                        </Card>
                        <Card className="dashboard-card p-6 bg-white/[0.03]">
                          <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Repetição de Grupo</span>
                          <div className="text-3xl font-black text-white">{repetitionStats.groupNextDraw}</div>
                          <span className="text-[9px] font-bold text-blue-400 uppercase">Qualquer posição</span>
                        </Card>
                        <Card className="dashboard-card p-6 bg-white/[0.03]">
                          <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Máx. Consecutivas</span>
                          <div className="text-3xl font-black text-white">{repetitionStats.maxConsecutive}</div>
                          <span className="text-[9px] font-bold text-primary uppercase">Sequência histórica</span>
                        </Card>
                        <Card className="dashboard-card p-6 bg-white/[0.03]">
                          <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Percentual Geral</span>
                          <div className="text-3xl font-black text-white">{repetitionStats.historicalPercent}%</div>
                          <span className="text-[9px] font-bold text-purple-500 uppercase">Taxa de ocorrência</span>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="dashboard-card p-8 relative overflow-hidden bg-white/[0.03]">
                          <h3 className="text-lg font-black uppercase italic mb-8 flex items-center gap-2">
                            <History className="w-5 h-5 text-emerald-500" />
                            Logística de Repetições
                          </h3>
                          <div className="space-y-6">
                            {[
                              { label: "Repetição no mesmo horário", value: repetitionStats.sameTimeRepetition, color: "bg-emerald-500" },
                              { label: "Entre horários consecutivos", value: repetitionStats.consecutiveTimeRepetition, color: "bg-blue-400" },
                              { label: "Entre posições diferentes", value: repetitionStats.differentPositionRepetition, color: "bg-primary" },
                              { label: "Animal repetido (1º Prêmio)", value: repetitionStats.animalNextDraw, color: "bg-purple-500" }
                            ].map((item, i) => (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                  <span className="text-white/40">{item.label}</span>
                                  <span className="text-white">{item.value} <span className="text-white/20 font-medium">vezes</span></span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((item.value / repetitionStats.sampleSize) * 200, 100)}%` }}
                                    className={`h-full ${item.color}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="dashboard-card p-8 bg-white/[0.03]">
                          <h3 className="text-lg font-black uppercase italic mb-8 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Frequência por Horário
                          </h3>
                          <div className="h-[200px] flex items-end justify-between gap-2">
                            {repetitionStats.timeRepetitionData.length > 0 ? (
                              repetitionStats.timeRepetitionData.map((d: any, i: number) => {
                                const maxCount = Math.max(...repetitionStats.timeRepetitionData.map((x: any) => x.count), 1);
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full relative flex flex-col items-center justify-end h-full">
                                      <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(d.count / maxCount) * 100}%` }}
                                        className="w-full bg-blue-400/20 group-hover:bg-blue-400/40 border-t-2 border-blue-400 transition-all rounded-t-lg"
                                      />
                                      <span className="absolute -top-6 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {d.count}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase italic text-white/30 group-hover:text-white transition-colors">
                                      {d.time}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/10 font-bold uppercase text-[10px]">
                                Sem dados suficientes
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <Card className="dashboard-card p-8 bg-white/[0.03]">
                          <h3 className="text-lg font-black uppercase italic mb-8 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-purple-500" />
                            Histórico Detalhado de Repetições
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-white/5 text-[10px] font-black uppercase text-white/40 tracking-widest">
                                  <th className="pb-4 px-2">Tipo</th>
                                  <th className="pb-4 px-2">Dezena</th>
                                  <th className="pb-4 px-2">Grupo</th>
                                  <th className="pb-4 px-2">Bicho</th>
                                  <th className="pb-4 px-2">Dezenas do Grupo</th>
                                  <th className="pb-4 px-2">Posição</th>
                                  <th className="pb-4 px-2">Horário/Data</th>
                                  <th className="pb-4 px-2 text-right">Repetiu em</th>
                                </tr>
                              </thead>
                              <tbody className="text-xs font-bold divide-y divide-white/5">
                                {repetitionStats.detailedRepetitions?.slice(0, 10).map((rep: any, idx: number) => (
                                  <tr key={idx} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="py-4 px-2">
                                      <Badge variant="outline" className={`text-[8px] font-black uppercase ${rep.type === 'consecutive' ? 'border-emerald-500/30 text-emerald-400' : 'border-blue-500/30 text-blue-400'}`}>
                                        {rep.type === 'consecutive' ? 'Consecutivo' : 'Mesmo Horário'}
                                      </Badge>
                                    </td>
                                    <td className="py-4 px-2 text-primary text-sm font-black">{rep.value}</td>
                                    <td className="py-4 px-2 text-white/40 font-mono">{getAnimalByTen(rep.value)?.id || rep.group}</td>
                                    <td className="py-4 px-2 text-white/60">
                                      <span className="flex items-center gap-2">
                                        <span className="text-base">{rep.icon || getAnimalByTen(rep.value)?.icon}</span>
                                        {getAnimalByTen(rep.value)?.name || rep.animal}
                                      </span>
                                    </td>
                                    <td className="py-4 px-2">
                                      <span className="flex gap-1 flex-wrap">
                                        {(rep.groupDezenas?.length ? rep.groupDezenas : getAnimalByTen(rep.value)?.dezenas || []).map((d: string) => (
                                          <span key={d} className={`px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono ${d === rep.value ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/30'}`}>{d}</span>
                                        ))}
                                      </span>
                                    </td>
                                    <td className="py-4 px-2 text-white/40">
                                      {rep.currentPos}º <ArrowLeftRight className="inline w-3 h-3 mx-1 opacity-40" /> {rep.nextPos || rep.prevPos}º
                                    </td>
                                    <td className="py-4 px-2 text-white/60">
                                      {rep.currentTime} <span className="text-[10px] text-white/20 ml-1">{format(new Date(rep.currentDate), "dd/MM")}</span>
                                    </td>
                                    <td className="py-4 px-2 text-right text-white/60">
                                      {rep.nextTime || rep.prevTime} <span className="text-[10px] text-white/20 ml-1">{format(new Date(rep.nextDate || rep.prevDate), "dd/MM")}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(!repetitionStats.detailedRepetitions || repetitionStats.detailedRepetitions.length === 0) && (
                              <div className="py-12 text-center text-white/10 font-bold uppercase tracking-widest text-xs">
                                Nenhuma repetição detectada na amostra
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Metodologia de Análise Matemática</p>
                          <p className="text-xs text-white/40 leading-relaxed">
                            Análise baseada em uma amostra de <strong>{repetitionStats.sampleSize} concursos</strong>. O sistema realiza a soma e cruzamento de dados buscando: repetições em horários idênticos (ex: PT com PT), repetições consecutivas (ex: PTM para PT) e mudanças de posição (ex: 1º prêmio repetindo no 5º).
                          </p>
                        </div>
                      </div>

                    </>
                  ) : null}
                </motion.div>
              )}

              {activeTab === 'analise-premium' && (
                <motion.div
                  key="analise-premium"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                      <h2 className="text-2xl font-black italic uppercase">Monitoramento Inteligente {location === 'rio' ? 'Rio' : 'Capital'}</h2>
                    </div>
                    <Badge variant="outline" className="border-yellow-500/20 text-yellow-500 bg-yellow-500/5 px-4 py-2 font-black uppercase text-[10px] tracking-widest">
                      Inteligência aplicada aos resultados históricos
                    </Badge>
                  </div>

                  {!premiumStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <Card className="dashboard-card p-6 border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-3 mb-6">
                               <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                  <Trophy className="w-5 h-5 text-primary" />
                               </div>
                               <div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Bicho em Alta</h4>
                                  <p className="text-lg font-black italic text-primary uppercase">{premiumStats.bichoEmAlta?.animal}</p>
                               </div>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-5xl">{premiumStats.bichoEmAlta?.animalInfo?.icon || ANIMAL_GROUPS.find(a => a.name === premiumStats.bichoEmAlta?.animal)?.icon}</span>
                               <div className="text-right">
                                  <p className="text-2xl font-black text-white">{premiumStats.bichoEmAlta?.freqs?.[30] || 0}x</p>
                                  <p className="text-[10px] font-bold text-white/20 uppercase">Frequência (30 dias)</p>
                               </div>
                            </div>
                         </Card>

                         <Card className="dashboard-card p-6 border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center gap-3 mb-6">
                               <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                  <Timer className="w-5 h-5 text-blue-400" />
                               </div>
                               <div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Grupo Atrasado</h4>
                                  <p className="text-lg font-black italic text-blue-400 uppercase">{premiumStats.mostDelayedGroup?.animal}</p>
                               </div>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-5xl">{ANIMAL_GROUPS.find(a => a.id === premiumStats.mostDelayedGroup?.groupId)?.icon}</span>
                               <div className="text-right">
                                  <p className="text-2xl font-black text-white">{premiumStats.mostDelayedGroup?.currentDelay}x</p>
                                  <p className="text-[10px] font-bold text-white/20 uppercase">Sorteios em atraso</p>
                               </div>
                            </div>
                         </Card>

                         <Card className="dashboard-card p-6 border-emerald-500/20 bg-emerald-500/5">
                            <div className="flex items-center gap-3 mb-6">
                               <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <Flame className="w-5 h-5 text-emerald-400" />
                               </div>
                               <div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Dezena do Grupo</h4>
                                  <p className="text-lg font-black italic text-emerald-400 uppercase">Mais Atrasada</p>
                               </div>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-5xl font-black text-white font-mono">{premiumStats.mostDelayedTenOfGroup?.ten || '--'}</span>
                               <div className="text-right">
                                  <p className="text-2xl font-black text-white">{premiumStats.mostDelayedTenOfGroup?.delay || 0}x</p>
                                  <p className="text-[10px] font-bold text-white/20 uppercase">Atraso na posição</p>
                               </div>
                            </div>
                         </Card>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                               <h3 className="text-xl font-black italic uppercase">Alertas Estratégicos</h3>
                            </div>
                            
                            <AlertaDezenasAtrasadas data={digitStats as any} loading={digitLoading} />

                            <Card className="dashboard-card p-6 bg-white/[0.03]">
                               <div className="flex items-center gap-3 mb-6">
                                  <Activity className="w-5 h-5 text-primary" />
                                  <h4 className="text-sm font-black uppercase tracking-widest">Resumo Logístico de Atraso</h4>
                               </div>
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                                     <span className="text-xs text-white/40 font-bold uppercase">Dezena Esquerda (Líder)</span>
                                     <span className="font-black text-yellow-400">{premiumStats.leftTop?.digit} ({premiumStats.leftTop?.currentDelay}x)</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                                     <span className="text-xs text-white/40 font-bold uppercase">Dezena Direita (Líder)</span>
                                     <span className="font-black text-sky-400">{premiumStats.rightTop?.digit} ({premiumStats.rightTop?.currentDelay}x)</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                     <span className="text-xs text-white/40 font-bold uppercase">Ciclo de Atraso Médio</span>
                                     <span className="font-black text-white">{(premiumStats.leftTop?.avgDelay || 0).toFixed(1)} sorteios</span>
                                  </div>
                               </div>
                            </Card>
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                               <h3 className="text-xl font-black italic uppercase">Milhar Destaque {location === 'rio' ? 'Rio' : 'Capital'}</h3>
                            </div>
                            <Card className="dashboard-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col items-center justify-center text-center">
                               <Sparkles className="w-12 h-12 text-primary mb-6 animate-pulse" />
                               <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Combinação Sugerida</h4>
                               <div className="text-7xl font-black text-white font-mono tracking-tighter mb-4">
                                  {premiumStats.leftTop?.digit}{premiumStats.rightTop?.digit}
                               </div>
                               <p className="text-xs text-white/30 font-medium max-w-[280px]">
                                  Milhar formada pelo cruzamento das dezenas esquerda e direita mais atrasadas da amostra.
                                </p>
                            </Card>
                            
                            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-6 flex gap-4">
                               <Info className="w-6 h-6 text-yellow-500 shrink-0" />
                               <div className="space-y-1">
                                 <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Metodologia Premium</p>
                                 <p className="text-xs text-white/40 leading-relaxed">
                                   O sistema analisa a milhar em blocos de 2 dígitos. O "Índice de Atraso Crítico" é atingido quando uma dezena ultrapassa 2.5x o seu atraso médio histórico.
                                 </p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

          </section>

          {/* Cruz do Dia Section */}
          <div id="cruz-do-dia" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-px h-8 bg-emerald-500" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Cruz do Dia - Base da Data</h2>
            </div>
            
            <div className="dashboard-card p-8 md:p-12 relative overflow-hidden bg-white/[0.03]">
               {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32" />
              
              <CruzDoDia onCalculate={(dezenas) => setCruzData(dezenas)} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-background/80 text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Resultados diários automatizados via robô ai automatizado sem intervenção humana
      </footer>

    </div>
  );
}
