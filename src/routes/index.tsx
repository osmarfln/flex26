import { createFileRoute, Link } from "@tanstack/react-router";
import { getResults, getStats } from "@/lib/lottery.functions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Hash, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  ChevronDown,
  Search,
  History,
  Users,
  ArrowRight,
  ShieldCheck,
  Info,
  PlayCircle,
  AlertCircle,
  BarChart3,
  Flame,
  Coffee,
  Sun,
  Moon,
  Sunset,
  Activity
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flex Gerenciador — Resultados Jogo do Bicho Rio" },
      {
        name: "description",
        content: "Resultados em tempo real, estatísticas e palpites para o Jogo do Bicho Rio. A plataforma mais profissional.",
      },
      { property: "og:title", content: "Flex Gerenciador — Resultados Rio" },
      {
        property: "og:description",
        content: "Confira os resultados do Rio hoje: PTM, PT, PTV, PTN e Corujinha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ANIMAL_GROUPS = [
  { id: "01", name: "Avestruz", icon: "🦩" }, { id: "02", name: "Águia", icon: "🦅" }, { id: "03", name: "Burro", icon: "🫏" }, { id: "04", name: "Borboleta", icon: "🦋" }, { id: "05", name: "Cachorro", icon: "🐕" },
  { id: "06", name: "Cabra", icon: "🐐" }, { id: "07", name: "Leão", icon: "🦁" }, { id: "08", name: "Macaco", icon: "🐒" }, { id: "09", name: "Cobra", icon: "🐍" }, { id: "10", name: "Coelho", icon: "🐰" },
  { id: "11", name: "Cavalo", icon: "🐎" }, { id: "12", name: "Elefante", icon: "🐘" }, { id: "13", name: "Galo", icon: "🐓" }, { id: "14", name: "Gato", icon: "🐈" }, { id: "15", name: "Jacaré", icon: "🐊" },
  { id: "16", name: "Leopardo", icon: "🐆" }, { id: "17", name: "Porco", icon: "🐖" }, { id: "18", name: "Coruja", icon: "🦉" }, { id: "19", name: "Pavão", icon: "🦚" }, { id: "20", name: "Peru", icon: "🦃" },
  { id: "21", name: "Touro", icon: "🐂" }, { id: "22", name: "Tigre", icon: "🐅" }, { id: "23", name: "Urso", icon: "🐻" }, { id: "24", name: "Veado", icon: "🦌" }, { id: "25", name: "Vaca", icon: "🐄" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Bom dia", icon: Coffee };
  if (hour < 18) return { text: "Boa tarde", icon: Sun };
  return { text: "Boa noite", icon: Moon };
}

function Index() {
  const [greeting, setGreeting] = useState(getGreeting());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getGreeting());
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: games, isLoading: isLoadingGames, refetch } = useQuery({
    queryKey: ["homepage-games", today],
    queryFn: () => getResults({ data: { limit: 10, date: today } }),
  });

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: () => getStats(),
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lottery_results' },
        () => {
          refetch();
          refetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchStats]);


  const GreetingIcon = greeting.icon;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Background Decorative Element */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex flex-col">
              <span className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl font-black tracking-tighter uppercase italic">Flex Gerenciador</span>
              </span>
              <span className="text-[10px] text-yellow-500/60 font-bold tracking-[0.2em] -mt-1 ml-8">VEM COM A GENTE</span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-8 ml-8">
              <Link to="/" className="text-sm font-bold border-b-2 border-yellow-500 pb-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> Início
              </Link>
              <Link to="/historico" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico
              </Link>
              <Link to="/robot-status" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <Activity className="w-4 h-4" /> Robô
              </Link>

              <a href="#resultados" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Resultados
              </a>
              <a href="#estatisticas" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Estatísticas
              </a>
              <a href="#grupos" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <Hash className="w-4 h-4" /> Grupos
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg border-white/10 bg-white/5 text-xs font-bold gap-2 hover:bg-white/10"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </Button>
            <Link to="/portal" className="text-xs font-bold text-white/40 hover:text-white transition-colors">Portal</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 relative">
        {/* Floating Butterfly Graphic */}
        <div className="absolute top-0 right-0 hidden xl:block opacity-10 translate-x-1/4 -translate-y-12">
           <svg width="400" height="400" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
             <path d="M12 21.5C12 21.5 10 16.5 4 15.5C4 15.5 1 14.5 1 10.5C1 6.5 4 4.5 8 4.5C12 4.5 12 8.5 12 8.5M12 21.5C12 21.5 14 16.5 20 15.5C20 15.5 23 14.5 23 10.5C23 6.5 20 4.5 16 4.5C12 4.5 12 8.5 12 8.5" stroke="currentColor" strokeWidth="0.5" />
           </svg>
        </div>

        {/* Welcome Section */}
        <section className="mb-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <GreetingIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{greeting.text}!</h2>
                <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Seja bem vindo ao nosso espaço fique a vontade</p>
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 italic">Resultados Rio em Tempo Real</h1>
            <p className="text-white/40 text-lg mb-8 font-medium">Resultados diários automatizados via robô de soresultados.info</p>

            <div className="flex flex-wrap gap-4 items-center mb-6">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px] hover:border-yellow-500/30 transition-all cursor-pointer">
                <Calendar className="w-5 h-5 text-white/40" />
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Data</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px] hover:border-yellow-500/30 transition-all cursor-pointer">
                <MapPin className="w-5 h-5 text-white/40" />
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Localidade</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Rio de Janeiro</span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>

              <Link to="/historico">
                <Button className="h-[54px] px-10 bg-yellow-500 hover:bg-yellow-400 text-[#0B0F19] font-black uppercase tracking-tighter rounded-xl gap-2 shadow-lg shadow-yellow-500/10 active:scale-95 transition-all">
                  <Search className="w-5 h-5" /> Buscar resultados
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <Card className="bg-[#0D121F] border-yellow-500/30 border-2 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/5">
              <CardHeader className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-yellow-500">Próximo Resultado</CardTitle>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="text-6xl font-black tracking-tighter mb-2 tabular-nums">
                  {format(currentTime, "HH:mm:ss")}
                </div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4">
                  {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="w-full py-3 bg-white/5 rounded-xl border border-white/10 text-sm font-bold">
                  {new Date().getHours() < 9 ? 'Aguardando PTT (09:00)' : 
                   new Date().getHours() < 11 ? 'Próximo: PTM (11:00)' :
                   new Date().getHours() < 14 ? 'Próximo: PT (14:00)' :
                   new Date().getHours() < 16 ? 'Próximo: PTV (16:00)' :
                   new Date().getHours() < 18 ? 'Próximo: PTN (18:00)' :
                   new Date().getHours() < 21 ? 'Próximo: COR (21:00)' :
                   'Painel Zera em breve (00:00)'}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* Results Grid & Most Delayed Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16" id="resultados">
          <div className="lg:col-span-12">
            {isLoadingGames ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : !games || games.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-[#0D121F] border border-white/5 rounded-3xl"
              >
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Painel Zerado</h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm mb-8">
                  {new Date().getHours() < 9 
                    ? "Aguardando o primeiro sorteio do dia (PTT às 09:00)" 
                    : "Nenhum resultado disponível para hoje até o momento"}
                </p>
                <Link to="/historico">
                  <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-xl px-8 h-12">
                    <History className="w-4 h-4 mr-2" /> Ver Histórico Completo
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game: any) => (
                  <Card key={game.id} className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/40 transition-all relative">
                    {game.status === 'live' && (
                      <div className="absolute inset-0 border border-yellow-500/20 rounded-2xl pointer-events-none" />
                    )}
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start mb-4">
                        <CardTitle className="text-xl font-black italic tracking-tighter uppercase">
                          {game.time_type} RIO — {game.time_value || '--:--'}hs
                        </CardTitle>
                        {game.status === 'live' && (
                          <div className="px-2 py-1 bg-yellow-500 text-[#0B0F19] text-[9px] font-black uppercase rounded shadow-lg shadow-yellow-500/20">
                            Mais Recente
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          {((game.results ?? game.result ?? []).length > 0 ? (game.results ?? game.result).slice(0, 5) : ['----', '----', '----', '----', '----']).map((res: string, idx: number) => (
                            <div key={idx} className="flex gap-4 text-sm font-bold items-baseline">
                              <span className="text-white/20 w-4">{idx + 1}º</span>
                              <span className="font-mono tracking-widest text-lg">{res}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl p-4 border border-white/5 relative">
                          <div className="w-16 h-16 mb-2 text-yellow-500 flex items-center justify-center text-4xl">
                             {ANIMAL_GROUPS.find(a => a.id === game.animal_group)?.icon || <Sparkles className="w-8 h-8 opacity-20" />}
                          </div>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                          <p className="text-3xl font-black text-yellow-500 tracking-tighter leading-none">{game.animal_group || '--'}</p>
                          <p className="text-[11px] font-bold mt-2 text-white/80 uppercase tracking-tight">{game.animal || 'Aguardando'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Stats Section with Modern Charts */}
        {/* Statistics Content Section */}
        <section className="mb-16 scroll-mt-24" id="estatisticas">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-[#0B0F19]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Análise Premium de Atrasos</h2>
                <p className="text-white/40 text-sm font-medium mt-1 uppercase tracking-widest">Inteligência aplicada aos resultados históricos</p>
              </div>
            </div>
            <div className="hidden md:flex gap-4">
               <div className="text-right">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Bicho em Alta</p>
                  <p className="text-lg font-black text-yellow-500 italic uppercase">
                    {stats?.mostFrequentTens?.[0] ? 
                      ANIMAL_GROUPS.find(a => {
                        const ten = stats?.mostFrequentTens?.[0]?.ten;
                        if (!ten) return false;
                        const tenInt = parseInt(ten);
                        const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
                        return a.id === String(groupNum).padStart(2, '0');
                      })?.name || 'Carregando...' 
                    : 'Processando...'}
                  </p>

               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="text-right">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Grupo Atrasado</p>
                  <p className="text-lg font-black text-white italic uppercase">{stats?.mostDelayedGroups?.[0]?.animal || '---'}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/30 transition-all">
              <CardHeader className="bg-yellow-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Dezenas Quentes</CardTitle>
                <Flame className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  {stats?.mostFrequentTens?.map((item: any) => (
                    <div key={item.ten} className="flex flex-col items-center gap-2 group/item">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-2xl font-black text-white group-hover/item:border-yellow-500/50 group-hover/item:text-yellow-500 transition-all relative">
                        {item.ten}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F19]" />
                      </div>
                      <span className="text-[10px] font-black text-white/30 uppercase">{item.count} sorteios</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/30 transition-all">
              <CardHeader className="bg-yellow-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Grupos Atrasados</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {stats?.mostDelayedGroups?.slice(0, 3).map((item: any) => (
                  <div key={item.group} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ANIMAL_GROUPS.find(a => a.id === item.group)?.icon}</span>
                      <span className="text-sm font-black uppercase italic">{item.animal}</span>
                    </div>
                    <span className="text-lg font-black text-yellow-500">{item.days}d</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/30 transition-all">
              <CardHeader className="bg-yellow-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Bicho em Alta</CardTitle>
                <TrendingUp className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-6">
                {stats?.mostFrequentTens?.[0] && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-7xl mb-4 animate-bounce">
                      {ANIMAL_GROUPS.find(a => {
                        const ten = stats?.mostFrequentTens?.[0]?.ten;
                        if (!ten) return false;
                        const tenInt = parseInt(ten);
                        const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
                        return a.id === String(groupNum).padStart(2, '0');
                      })?.icon}
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-500">
                      {ANIMAL_GROUPS.find(a => {
                        const ten = stats?.mostFrequentTens?.[0]?.ten;
                        if (!ten) return false;
                        const tenInt = parseInt(ten);
                        const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
                        return a.id === String(groupNum).padStart(2, '0');
                      })?.name}
                    </h3>

                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-2">Tendência Máxima para hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-8">

             <div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase">Análise de Atraso por Horário</h2>
               <p className="text-white/40 text-sm font-medium mt-1 uppercase tracking-widest">Monitoramento inteligente baseado em dados históricos</p>
             </div>
             <div className="hidden md:flex gap-2">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10"><BarChart3 className="w-5 h-5 text-yellow-500" /></div>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {Object.entries(stats?.delayedBySchedule || {}).map(([time, data]: [string, any]) => (
                <motion.div 
                  key={time}
                  whileHover={{ y: -5 }}
                  className="bg-[#0D121F] border border-white/10 p-5 rounded-2xl relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-mono font-bold text-white/40">{time}</span>
                    <Clock className="w-3.5 h-3.5 text-yellow-500/50" />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-3">{ANIMAL_GROUPS.find(a => a.id === data.group)?.icon}</div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter group-hover:text-yellow-500 transition-colors">{data.animal}</h3>
                    <div className="mt-4 flex flex-col items-center">
                       <span className="text-xl font-black text-yellow-500 leading-none">{data.delayed.split(' ')[0]}</span>
                       <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Dias de atraso</span>
                    </div>
                  </div>
                </motion.div>
             ))}
          </div>
        </section>

        {/* Groups Table */}
        <div className="grid grid-cols-1 gap-8" id="grupos">
          <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/60">
                  <Hash className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Tabela de Grupos</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-black border-white/10 text-white/40 italic">25 Grupos Oficiais</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-5 gap-3">
                {ANIMAL_GROUPS.map((animal) => (
                  <div key={animal.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-yellow-500/40 transition-all group flex items-center gap-4 cursor-default">
                    <div className="text-2xl opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">{animal.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-yellow-500 font-black tracking-tighter uppercase">{animal.id}</span>
                      <span className="text-xs font-black uppercase tracking-tight text-white/50 group-hover:text-white transition-colors italic">{animal.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-white/5 py-16 bg-[#080B14] mt-12 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative z-10">
          <div className="flex items-center gap-4 text-white/40 text-xs font-bold leading-relaxed">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-yellow-500/60">
              <Info className="w-6 h-6" />
            </div>
            <p>Conteúdo exclusivamente informativo. <br /> <span className="text-white/60">Não realizamos apostas.</span></p>
          </div>
          
          <div className="text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] max-w-sm mx-auto leading-loose">
            Os resultados apresentados são de fontes públicas e podem sofrer alterações.
            Confira sempre os resultados oficiais das bancas.
          </div>

          <div className="flex items-center justify-end gap-4 text-white/40 text-xs font-bold leading-relaxed text-right">
            <p>Jogo do Bicho é tradição, <br /> <span className="text-white/60">informação é responsabilidade.</span></p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-yellow-500/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em]">
             Flex Gerenciador © 2026
           </div>
           
           <div className="flex items-center gap-6">
              <span className="text-[8px] text-white/5 font-black uppercase tracking-widest">Plataforma Independente</span>
              <div className="h-4 w-px bg-white/5" />
              <span className="text-[8px] text-white/5 font-black uppercase tracking-widest">Automação via Robô soresultados.info</span>
           </div>
        </div>
      </footer>
    </div>
  );
}



