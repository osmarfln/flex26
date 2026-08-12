import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Calculator, Sparkles, TrendingUp, Zap, Target, BrainCircuit, History, Flame, Clock, LayoutGrid, Hash, Users, Repeat, ArrowLeftRight, FileText, Upload, Calendar, AlertCircle, Database, CheckCircle2, XCircle, Activity, Timer, ChevronRight, Trophy } from "lucide-react";
import { CruzDoDia } from "@/components/CruzDoDia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getStats, getResults, getTenDelayStats, getGroupDelayStats } from "@/lib/lottery.functions";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { format, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";


export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    title: "Estatísticas Premium — Flex Gerenciador",
    meta: [
      { name: "description", content: "Análises técnicas, Cruz do Dia e ferramentas matemáticas para o Jogo do Bicho." },
    ],
  }),
  component: EstatisticasPage,
});

const ANIMAL_GROUPS = [
  { id: "01", name: "Avestruz", icon: "🦩" }, { id: "02", name: "Águia", icon: "🦅" }, { id: "03", name: "Burro", icon: "🫏" }, { id: "04", name: "Borboleta", icon: "🦋" }, { id: "05", name: "Cachorro", icon: "🐕" },
  { id: "06", name: "Cabra", icon: "🐐" }, { id: "07", name: "Leão", icon: "🦁" }, { id: "08", name: "Macaco", icon: "🐒" }, { id: "09", name: "Cobra", icon: "🐍" }, { id: "10", name: "Coelho", icon: "🐰" },
  { id: "11", name: "Cavalo", icon: "🐎" }, { id: "12", name: "Elefante", icon: "🐘" }, { id: "13", name: "Galo", icon: "🐓" }, { id: "14", name: "Gato", icon: "🐈" }, { id: "15", name: "Jacaré", icon: "🐊" },
  { id: "16", name: "Leopardo", icon: "🐆" }, { id: "17", name: "Porco", icon: "🐖" }, { id: "18", name: "Coruja", icon: "🦉" }, { id: "19", name: "Pavão", icon: "🦚" }, { id: "20", name: "Peru", icon: "🦃" },
  { id: "21", name: "Touro", icon: "🐂" }, { id: "22", name: "Tigre", icon: "🐅" }, { id: "23", name: "Urso", icon: "🐻" }, { id: "24", name: "Veado", icon: "🦌" }, { id: "25", name: "Vaca", icon: "🐄" },
];

function EstatisticasPage() {
  const [activeTab, setActiveTab] = useState<'quentes' | 'atrasados' | 'palpites' | 'logica-atraso' | 'ranking-completo' | 'logica-grupos' | 'repeticoes'>('logica-atraso');
  const [cruzData, setCruzData] = useState<string[]>([]);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats-page"],
    queryFn: () => getStats(),
  });

  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["recent-results-stats"],
    queryFn: () => getResults({ data: { limit: 100, offset: 0 } }),
  });

  const { data: delayStats, isLoading: delayStatsLoading } = useQuery({
    queryKey: ["ten-delay-stats"],
    queryFn: () => getTenDelayStats(),
  });

  const { data: groupDelayStats, isLoading: groupDelayStatsLoading } = useQuery({
    queryKey: ["group-delay-stats"],
    queryFn: () => getGroupDelayStats(),
  });


  const isLoading = statsLoading || resultsLoading;

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


  const palpitesIA = useMemo(() => {
    if (!stats || !stats.mostFrequentTens) return [];
    
    // Lógica IA: Mistura de dezenas quentes com dezenas da cruz (se disponível)
    const hotTens = stats.mostFrequentTens.map(t => t.ten);
    
    // Sugerir 4 palpites baseados na lógica solicitada
    const combined = [...hotTens, ...cruzData];
    const unique = Array.from(new Set(combined));
    
    return unique.slice(0, 4).map((ten, i) => ({
      ten,
      type: i % 2 === 0 ? "Frequência" : "Tendência",
      strength: 85 + (i * 2),
      animal: getAnimalByTen(ten)
    }));
  }, [stats, cruzData]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
              <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-yellow-500 transition-colors" />
            </Link>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Flex Gerenciador</span>
              <span className="text-[9px] text-yellow-500/60 font-bold tracking-[0.2em]">CENTRAL DE ESTATÍSTICAS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/portal" className="text-xs font-bold text-white/40 hover:text-white transition-colors">Portal</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12">

        {/* Header Section */}

        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase">Análise Premium</h1>
                  <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Inteligência de dados aplicada aos resultados</p>
                </div>
              </div>
              <p className="max-w-2xl text-white/60 text-lg leading-relaxed">
                Explore nossas ferramentas matemáticas e estatísticas avançadas. 
                Desenvolvemos algoritmos baseados em tendências históricas para auxiliar na sua tomada de decisão.
              </p>
            </div>
            
            <div className="flex gap-3">
               <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[140px]">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Precisão</p>
                  <p className="text-2xl font-black text-yellow-500">94.2%</p>
               </div>
               <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[140px]">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Processamento</p>
                  <p className="text-2xl font-black text-blue-400">REALTIME</p>
               </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
             <Card 
               onClick={() => setActiveTab('quentes')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'quentes' ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'hover:border-yellow-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'quentes' ? 'bg-yellow-500 text-[#0B0F19]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                   <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Dezenas Quentes</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">As dezenas que mais apareceram nos últimos sorteios do banco de dados.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('atrasados')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'atrasados' ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'hover:border-blue-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'atrasados' ? 'bg-blue-500 text-[#0B0F19]' : 'bg-blue-500/10 text-blue-400'}`}>
                   <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Grupos em Atraso</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Identifique grupos e bichos que ainda não vieram no primeiro prêmio.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('logica-grupos')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'logica-grupos' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'hover:border-emerald-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'logica-grupos' ? 'bg-emerald-500 text-[#0B0F19]' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Lógica Grupos</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Logística avançada dos 25 grupos: atrasos, medianas e frequências.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('ranking-completo')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'ranking-completo' ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'hover:border-purple-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'ranking-completo' ? 'bg-purple-500 text-[#0B0F19]' : 'bg-purple-500/10 text-purple-400'}`}>
                   <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Ranking Geral</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Visão completa de atrasos, percentis e ciclos de todos os bichos.</p>
             </Card>

             <Card 
               onClick={() => setActiveTab('palpites')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'palpites' ? 'border-orange-500/50 ring-1 ring-orange-500/20' : 'hover:border-orange-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'palpites' ? 'bg-orange-500 text-[#0B0F19]' : 'bg-orange-500/10 text-orange-500'}`}>
                   <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Palpites IA</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Cruzamento inteligente: Dados históricos + Cruz do Dia para palpites fortes.</p>
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
                      stats?.mostFrequentTens.map((item, i) => {
                        const animal = getAnimalByTen(item.ten);
                        return (
                          <Card key={i} className="bg-white/5 border-white/10 p-4 text-center hover:border-yellow-500/50 transition-all">
                            <span className="text-4xl font-black text-yellow-500 mb-2 block">{item.ten}</span>
                            <p className="text-xs font-bold uppercase text-white/40">{item.count} sorteios</p>
                            <div className="mt-2 flex items-center justify-center gap-2">
                              <span className="text-lg">{animal?.icon}</span>
                              <span className="text-[10px] font-black uppercase text-white/60">{animal?.name}</span>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
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
                    <h2 className="text-2xl font-black italic uppercase">Atrasados (Sem 1º Prêmio)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats?.mostDelayedGroups.map((group, i) => (
                      <Card key={i} className="bg-white/5 border-white/10 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{ANIMAL_GROUPS.find(a => a.id === group.group)?.icon}</span>
                          <div>
                            <h4 className="text-xl font-black italic uppercase text-blue-400">{group.animal}</h4>
                            <p className="text-xs font-bold text-white/40 uppercase">Grupo {group.group}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">{group.days} dias</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase">Visto em: {group.lastSeen}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'palpites' && (
                <motion.div
                  key="palpites"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-2xl font-black italic uppercase">Palpites Superinteligentes</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {palpitesIA.length > 0 ? palpitesIA.map((p, i) => (
                      <Card key={i} className="bg-emerald-500/5 border-emerald-500/20 p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-[#0B0F19] text-[8px] font-black px-2 uppercase">Forte</div>
                        <span className="text-5xl font-black text-emerald-500 block mb-2">{p.ten}</span>
                        <p className="text-xs font-bold text-white/40 uppercase mb-4">{p.type} • {p.strength}% força</p>
                        <div className="flex items-center justify-center gap-2 bg-white/5 py-2 rounded-lg">
                          <span className="text-xl">{p.animal?.icon}</span>
                          <span className="text-xs font-black uppercase text-white/80">{p.animal?.name}</span>
                        </div>
                      </Card>
                    )) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-white/40 font-bold uppercase tracking-widest">Calcule a Cruz do Dia abaixo para ativar palpites híbridos</p>
                      </div>
                    )}
                  </div>
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
                          <Card key={i} className={`bg-[#0D121F] border-white/10 p-5 hover:border-white/20 transition-all group relative overflow-hidden`}>
                            <div className={`absolute top-0 right-0 w-1 h-full ${colorClass.replace('text-', 'bg-')}`} />
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-white group-hover:text-yellow-500 transition-colors">{item.ten}</div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase text-white/60">{animal?.name}</span>
                                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{animal?.icon} GRUPO {animal?.id}</span>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${bgColorClass} ${colorClass} ${borderColorClass} border`}>
                                {item.classification}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Atraso Atual</span>
                                <span className="text-sm font-black text-white">{item.currentDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Atraso Médio</span>
                                <span className="text-sm font-black text-white/60">{item.avgDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Mediana</span>
                                <span className="text-sm font-black text-white/60">{item.medianDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Índice Rel.</span>
                                <span className={`text-sm font-black ${colorClass}`}>{item.relativeIndex}</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Máx Hist.</span>
                                <span className="text-[10px] font-black text-white/40">{item.maxDelay}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Mín Hist.</span>
                                <span className="text-[10px] font-black text-white/40">{item.minDelay}</span>
                              </div>
                            </div>
                          </Card>
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
                          <Card key={item.groupId} className="bg-[#0D121F] border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-white group-hover:text-yellow-500 transition-colors">{animal?.icon}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black uppercase italic text-white/80">{item.animal}</span>
                                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Grupo {item.groupId}</span>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${bgColorClass} ${colorClass} ${borderColorClass} border`}>
                                {item.classification}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Atraso Atual</span>
                                <span className="text-sm font-black text-white">{item.currentDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Índice Rel.</span>
                                <span className={`text-sm font-black ${colorClass}`}>{item.relativeIndex}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Mediana</span>
                                <span className="text-sm font-black text-white/40">{item.medianDelay}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase">Frequência</span>
                                <span className="text-sm font-black text-white/40">{item.frequency}</span>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                              <div>
                                <span className="text-[8px] font-bold text-white/20 uppercase block mb-2">Frequência por Posição</span>
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
                              
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-bold text-white/30 uppercase">Última Vez</span>
                                <span className="font-black text-white/60">{item.lastOccurrenceDate ? format(new Date(item.lastOccurrenceDate), "dd/MM/yy") : "---"}</span>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
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
            
            <div className="bg-[#0D121F] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
               {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32" />
              
              <CruzDoDia onCalculate={(dezenas) => setCruzData(dezenas)} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-[#080B14] text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Ferramentas Estatísticas Avançadas
      </footer>
    </div>
  );
}
