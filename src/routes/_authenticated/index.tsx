// Leia o arquivo instrucoes.md em anexo e siga as instruções contidas nele.
import { createFileRoute, Link } from "@tanstack/react-router";

import { UserMenu } from "@/components/layout/UserMenu";
import { ANIMAL_GROUPS } from "@/lib/animals";
import { getResults, getTenDelayStats, getGroupDelayStats, getDigitDelayStats, getStats } from "@/lib/lottery.functions";
import { getScheduleForDate, getNextDraw, locationName, drawLabel, drawTimeValue } from "@/lib/draw-order";
import { useMemo } from "react";

import { AlertaDezenasAtrasadas } from "@/components/AlertaDezenasAtrasadas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Hash, 
   
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
  Activity,
  Calculator as CalcIcon
} from "lucide-react";
import { CruzDoDia } from "@/components/CruzDoDia";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { DigitalClock } from "@/components/DigitalClock";
import { ProximosConcursos } from "@/components/ProximosConcursos";
import { PrizeAnimalRow } from "@/components/PrizeAnimalRow";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import { useUserFirstName } from "@/hooks/useUserFirstName";

import { brasiliaDateISO } from "@/lib/draw-order";


export const Route = createFileRoute("/_authenticated/")({
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


function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 5) return { text: "Boa madrugada", icon: Moon };
  if (hour < 12) return { text: "Bom dia", icon: Coffee };
  if (hour < 18) return { text: "Boa tarde", icon: Sun };
  return { text: "Boa noite", icon: Moon };
}


function Index() {
  // Estado inicial estável para evitar divergência entre servidor e navegador
  const [location, setLocation] = useState<'rio' | 'capital' | 'federal'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('preferred-location') as 'rio' | 'capital' | 'federal') || 'rio';
    }
    return 'rio';
  });
  const [greeting, setGreeting] = useState<{ text: string; icon: typeof Coffee }>({ text: "Olá", icon: Sun });
  const [currentTime, setCurrentTime] = useState(new Date());
  const firstName = useUserFirstName();



  useEffect(() => {
    setGreeting(getGreeting());
    const timer = setInterval(() => {
      setGreeting(getGreeting());
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-location', location);
    }
  }, [location]);

  const today = brasiliaDateISO();
  const nextDraw = useMemo(() => getNextDraw(location), [location, currentTime]);

  const { data: games, isLoading: isLoadingGames, refetch } = useQuery({
    queryKey: ["homepage-games", today, location],
    queryFn: () => getResults({ data: { limit: 12, date: today, location } }),
  });

  // FEDERAL: são apenas 2 concursos por semana — o painel mantém sempre
  // os últimos concursos publicados até que o próximo sorteio seja atualizado.
  const { data: federalLatest } = useQuery({
    queryKey: ["homepage-federal-latest"],
    queryFn: () => getResults({ data: { limit: 4, location: 'federal' } }),
    enabled: location === 'federal',
  });

  const { data: groupStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["homepage-group-stats", location],
    queryFn: () => getGroupDelayStats({ data: { location } }),
  });

  const { data: tenStats } = useQuery({
    queryKey: ["homepage-ten-stats", location],
    queryFn: () => getTenDelayStats({ data: { location } }),
  });

  const { data: globalStats } = useQuery({
    queryKey: ["homepage-global-stats", location],
    queryFn: () => getStats({ data: { location } }),
  });

  const { data: digitStats, isLoading: digitLoading } = useQuery({
    queryKey: ["homepage-digit-stats", location],
    queryFn: () => getDigitDelayStats({ data: { location } }),
    staleTime: 0,
  });





  // Cada novo resultado dispara um novo cálculo (atrasos, grupos, dezenas, repetições)
  const { lastUpdate } = useLotteryRealtime("home-db-changes");

  /**
   * Painéis de resultados exibidos na página inicial.
   * Rio/Capital seguem a grade do dia; a Federal mantém sempre os últimos
   * concursos publicados quando não há sorteio na data de hoje.
   */
  const panels = useMemo(() => {
    const todaySchedule = getScheduleForDate(location, today);
    const todayPanels = todaySchedule.map((schedule: any) => ({
      key: schedule.timeType,
      schedule: { ...schedule, dateLabel: null as string | null },
      game: (games || []).find(
        (g: any) => String(g.time_type).toUpperCase().trim().replace("PTT", "PPT") === schedule.timeType.toUpperCase(),
      ),
    }));

    if (location !== 'federal') return todayPanels;
    if (todayPanels.some((p) => p.game)) return todayPanels;

    return (federalLatest || []).map((row: any) => {
      const [y, m, d] = String(row.date).split('-');
      return {
        key: `${row.date}-${row.time_type}`,
        schedule: {
          timeType: row.time_type,
          timeValue: drawTimeValue('federal', row.time_type),
          label: drawLabel('federal', row.time_type, row.date),
          dateLabel: `${d}/${m}/${y}`,
        },
        game: row,
      };
    });
  }, [location, today, games, federalLatest]);




  const GreetingIcon = greeting.icon;

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Background Decorative Element */}
      {/* Top Header */}
      <header className="border-b border-white/10 bg-transparent/80 backdrop-blur-2xl sticky top-0 z-50 transition-all shadow-lg shadow-black/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 md:h-20 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:items-center md:gap-8">
            <Link to="/" className="flex min-w-0 flex-col group">
              <span className="flex min-w-0 items-center gap-2">
                <div className="relative shrink-0">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-150 -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="truncate text-base sm:text-xl md:text-2xl font-black tracking-tighter uppercase italic group-hover:text-primary transition-colors">Flex Gerenciador</span>
              </span>
              <span className="text-[9px] md:text-[10px] text-primary/60 font-bold tracking-[0.2em] -mt-1 ml-7 md:ml-8 group-hover:tracking-[0.25em] transition-all">VEM COM A GENTE</span>
            </Link>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <UserMenu />
            </div>
          </div>

          <nav className="-mx-3 flex items-center gap-2 overflow-x-auto no-scrollbar px-3 pb-1 md:mx-0 md:gap-2 md:px-0 md:pb-0 md:py-2 rounded-xl md:border md:border-white/10 md:bg-white/5 md:p-1.5">
            <Link to="/" className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 whitespace-nowrap shrink-0">
              <Users className="w-5 h-5 shrink-0" /> Início
            </Link>
            <Link to="/historico" className="text-sm font-bold text-white/55 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
              <History className="w-5 h-5 shrink-0" /> Histórico
            </Link>
            <Link to="/robot-status" className="text-sm font-bold text-white/55 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
              <Activity className="w-5 h-5 shrink-0" /> Robô
            </Link>
            <Link to="/estatisticas" className="text-sm font-bold text-white/55 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
              <BarChart3 className="w-5 h-5 shrink-0" /> Estatísticas
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2 md:gap-4 ml-auto">
            {lastUpdate && (
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                Recalculado {format(lastUpdate, "HH:mm:ss")}
              </span>
            )}

            <UserMenu />
          </div>
        </div>
      </header>



      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-8 relative overflow-hidden">
        {/* Floating Butterfly Graphic */}
        <div className="absolute top-0 right-0 hidden xl:block opacity-10 translate-x-1/4 -translate-y-12">
           <svg width="400" height="400" viewBox="0 0 24 24" fill="none" className="text-primary">
             <path d="M12 21.5C12 21.5 10 16.5 4 15.5C4 15.5 1 14.5 1 10.5C1 6.5 4 4.5 8 4.5C12 4.5 12 8.5 12 8.5M12 21.5C12 21.5 14 16.5 20 15.5C20 15.5 23 14.5 23 10.5C23 6.5 20 4.5 16 4.5C12 4.5 12 8.5 12 8.5" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.05" />
           </svg>
        </div>

        {/* Welcome Section */}
        <section className="mb-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-9">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="home-glass p-3 rounded-xl">
                <GreetingIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-none">
                  {greeting.text}{firstName ? `, ${firstName}` : ""}!
                </h2>
                <p className="text-white/55 font-semibold text-xs mt-1">
                  {firstName ? `É um prazer ter você aqui, ${firstName}. Fique à vontade.` : "Seja bem-vindo ao nosso espaço, fique à vontade."}
                </p>
                <p className="text-[10px] text-primary/80 font-bold uppercase mt-2 border-t border-white/10 pt-2">Resultados diários automatizados via robô automatizado sem intervenção humana</p>





              </div>
            </motion.div>

            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Resultados {locationName(location)}</h1>
                <p className="text-white/55 text-sm mt-2 font-medium">Resultados oficiais organizados por horário e atualizados em tempo real.</p>
              </div>
              <div className="home-glass flex max-w-full gap-1 overflow-x-auto rounded-xl p-1.5 no-scrollbar" aria-label="Selecionar loteria">
                {(['rio', 'capital', 'federal'] as const).map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant={location === item ? 'default' : 'ghost'}
                    onClick={() => setLocation(item)}
                    className={`h-10 shrink-0 rounded-lg px-4 text-xs font-bold ${location === item ? 'shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                  >
                    {item === 'rio' ? 'Rio de Janeiro' : item === 'capital' ? 'Capital & LCAP' : 'Loteria Federal'}
                  </Button>
                ))}
              </div>
            </div>



            
            <Card className="home-glass p-5 mt-5 mb-5 rounded-2xl border-primary/25 bg-primary/5">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/15 rounded-xl border border-primary/20 shadow-inner">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Próximo resultado</h3>
                    <p className="text-[10px] text-white/45 font-bold uppercase mt-1">Horário oficial</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Horário</p>
                    <p className="text-2xl font-extrabold text-foreground tabular-nums">
                      {drawLabel(location, nextDraw.timeType, nextDraw.date ? nextDraw.date.toISOString().slice(0, 10) : undefined) || nextDraw.timeValue}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Data</p>
                    <p className="text-2xl font-extrabold text-foreground tabular-nums">{format(nextDraw.date, "dd/MM")}</p>
                  </div>
                </div>
              </div>
            </Card>

            <ProximosConcursos />

            <div className="home-glass flex flex-wrap gap-3 items-center rounded-2xl p-3 mb-0">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-full sm:flex-1">
                <Calendar className="w-5 h-5 text-white/40" />
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Data</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
              
              <Link to="/historico">
                <Button className="w-full sm:w-auto h-[50px] px-7 font-bold rounded-xl gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  <Search className="w-5 h-5" /> Buscar resultados
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3">
            <DigitalClock />
          </div>
        </section>


        {/* Results Grid & Most Delayed Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12" id="resultados">
          <div className="lg:col-span-12">
            {isLoadingGames ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: Math.max(getScheduleForDate(location, today).length, 2) }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {panels.map(({ key, schedule, game }) => {
                  // Encontra o mais recente entre os que já saíram hoje
                  const sortedGames = [...(games || [])].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                  const isLatest = game && (location === 'federal' ? panels[0]?.game?.id === game.id : sortedGames[0]?.id === game.id);

                  return (
                    <Card key={key} className={`home-result-card rounded-2xl overflow-hidden group relative min-h-[250px] ${!game ? 'opacity-75 bg-white/[0.035]' : 'bg-card'}`}>
                      {isLatest && (
                        <div className="absolute inset-0 border-2 border-primary/35 rounded-2xl pointer-events-none z-10" />
                      )}
                      <CardHeader className="p-5 pb-2">
                        <div className="flex justify-between items-start mb-4">
                          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors flex items-baseline gap-2">
                            {location === 'capital' ? `${schedule.label} h` : location === 'federal' ? `${schedule.label} h${schedule.dateLabel ? ` — ${schedule.dateLabel}` : ''}` : `${schedule.label} h`}
                            {location === 'rio' && <span className="text-[11px] font-bold not-italic normal-case text-white/40 tracking-normal">Rio</span>}
                          </CardTitle>
                          {isLatest && (
                            <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase rounded-lg shadow-xl shadow-primary/20">
                              Mais Recente
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            {(game && (game.results || []).length > 0
                              ? game.results.slice(0, 5)
                              : [null, null, null, null, null]
                            ).map((res: string | null, idx: number) => (
                              <PrizeAnimalRow key={idx} position={idx + 1} result={res} compact />
                            ))}
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white/[0.06] rounded-xl p-4 border border-white/10 relative group-hover:bg-white/[0.09] shadow-inner transition-all">
                            {isLatest && (
                              <div className="w-16 h-16 mb-2 text-primary flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                 {game ? (ANIMAL_GROUPS.find(a => a.id === game.animal_group)?.icon || <Sparkles className="w-8 h-8 opacity-20" />) : <Clock className="w-8 h-8 opacity-20 text-white/20" />}
                              </div>
                            )}
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                            <p className={`text-3xl font-black tracking-tighter leading-none ${game ? 'text-primary' : 'text-white/10'}`}>{game?.animal_group || '--'}</p>
                            <p className={`text-[11px] font-bold mt-2 uppercase tracking-tight ${game ? 'text-white/80' : 'text-blue-400/50 italic'}`}>{game?.animal || 'Aguardando'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

          </div>
        </div>


        {/* Stats Section with Modern Charts */}
        {/* Statistics Content Section */}
        <section className="mb-16 scroll-mt-24" id="estatisticas">
          <AvisoObrigatorio />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-[#0B0F19]">
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
                  <p className="text-lg font-black text-primary italic uppercase">
                    {tenStats?.[0] ? 
                      ANIMAL_GROUPS.find(a => {
                        const ten = tenStats?.[0]?.ten;
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
                  <p className="text-lg font-black text-white italic uppercase">{groupStats?.[0]?.animal || '---'}</p>
               </div>
            </div>

          </div>

          <div className="mb-12">
            <AlertaDezenasAtrasadas data={digitStats as any} loading={digitLoading} location={location} />
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all">
              <CardHeader className="bg-red-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Dezenas Atrasadas</CardTitle>
                <Clock className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  {tenStats?.slice(0, 5).map((item: any) => (
                    <div key={item.ten} className="flex flex-col items-center gap-2 group/item">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-2xl font-black text-white group-hover/item:border-red-500/50 group-hover/item:text-red-500 transition-all relative">
                        {item.ten}
                      </div>
                      <span className="text-[10px] font-black text-white/30 uppercase">{item.currentDelay}d / {item.dailyDelay}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all">
              <CardHeader className="bg-red-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Dezena do Grupo Mais Atrasada</CardTitle>
                <Clock className="w-4 h-4 text-red-500" />

              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {groupStats?.slice(0, 3).map((item: any) => {
                  const mostDelayedDz = (item.dezenaStats ?? []).sort((a: any, b: any) => b.delay - a.delay)[0];
                  return (
                    <div key={item.groupId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ANIMAL_GROUPS.find(a => a.id === item.groupId)?.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase italic">{item.animal}</span>
                          <span className="text-[8px] font-bold text-white/30 uppercase">Mais Atrasada: <span className="text-red-500">{mostDelayedDz?.dezena || '--'}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-red-500 block leading-none">{item.currentDelay}d</span>
                        <span className="text-[9px] font-bold text-red-500/80 uppercase">{item.dailyDelay} horários</span>
                      </div>
                    </div>
                  );
                })}

              </CardContent>
            </Card>

            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all">
              <CardHeader className="bg-red-500/5 p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">Bicho em Alta</CardTitle>
                <TrendingUp className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent className="p-6">
                {tenStats?.[0] && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-7xl mb-4 animate-bounce">
                      {ANIMAL_GROUPS.find(a => {
                        const ten = tenStats?.[0]?.ten;
                        if (!ten) return false;
                        const tenInt = parseInt(ten);
                        const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
                        return a.id === String(groupNum).padStart(2, '0');
                      })?.icon}
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-red-500">
                      {ANIMAL_GROUPS.find(a => {
                        const ten = tenStats?.[0]?.ten;
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
               <h2 className="text-3xl font-black italic tracking-tighter uppercase">Análise de Atraso dos Grupos</h2>
               <p className="text-white/40 text-sm font-medium mt-1 uppercase tracking-widest">Monitoramento inteligente baseado em dados históricos</p>
             </div>
             <div className="hidden md:flex gap-2">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10"><BarChart3 className="w-5 h-5 text-red-500" /></div>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {groupStats?.slice(0, 6).map((data: any) => (
                <motion.div 
                  key={data.groupId}
                  whileHover={{ y: -5 }}
                  className="bg-[#0D121F] border border-white/10 p-5 rounded-2xl relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-mono font-bold text-white/40">G{data.groupId}</span>
                    <Clock className="w-3.5 h-3.5 text-primary/50" />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-3">{ANIMAL_GROUPS.find(a => a.id === data.groupId)?.icon}</div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{data.animal}</h3>
                    <div className="mt-4 flex flex-col items-center">
                       <span className={`text-xl font-black ${data.dailyDelay > 2 ? 'text-red-400' : 'text-primary'} leading-none`}>{data.currentDelay}</span>
                       <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 mb-2">
                         Atraso ({data.dailyDelay}h hoje)
                       </span>
                       
                       {/* Dezena do Grupo Mais Atrasada (1º ao 5º) */}
                       <div className="w-full mt-2 pt-2 border-t border-white/5 flex flex-col items-center">
                         <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Dezena Atrasada</span>
                         <div className="flex items-center gap-1.5">
                           <span className="text-xs font-black text-white italic">
                             {([...(data.dezenaStats || [])].sort((a, b) => b.delay - a.delay)[0]?.dezena) || '--'}
                           </span>
                           <span className="text-[8px] font-bold text-red-500/60">
                             ({([...(data.dezenaStats || [])].sort((a, b) => b.delay - a.delay)[0]?.delay) || 0}c)
                           </span>
                         </div>
                       </div>
                    </div>

                  </div>
                </motion.div>
             ))}
          </div>

        </section>


        {/* Groups Table */}
        <div className="grid grid-cols-1 gap-8" id="grupos">
          <Card className="dashboard-card overflow-hidden shadow-xl">
            <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/60">
                  <Hash className="w-5 h-5 text-primary" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Tabela de Grupos</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-black border-white/10 text-white/40 italic">25 Grupos Oficiais</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-5 gap-3">
                {ANIMAL_GROUPS.map((animal) => (
                  <div key={animal.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-primary/40 transition-all group flex items-center gap-4 cursor-default">
                    <div className="text-2xl opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">{animal.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-primary font-black tracking-tighter uppercase">{animal.id}</span>
                      <span className="text-xs font-black uppercase tracking-tight text-white/50 group-hover:text-white transition-colors italic">{animal.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Ranking e Ciclos */}
        <div className="grid grid-cols-1 gap-8 mb-16">
          <Card className="dashboard-card overflow-hidden shadow-xl">
            <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/60">
                  <Trophy className="w-5 h-5 text-primary" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Ranking de Atrasos e Ciclos</CardTitle>
                </div>
                <Link to="/estatisticas">
                  <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black text-primary hover:text-primary-foreground hover:bg-primary/10 gap-2">
                    Ver Análise Completa <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Pos</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Dezena</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Grupo</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Animal</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Atraso</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Índice</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Atraso Hoje</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStats ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5 animate-pulse">
                        <td colSpan={7} className="p-4"><div className="h-8 bg-white/5 rounded" /></td>
                      </tr>
                    ))
                  ) : (
                    tenStats?.slice(0, 10).map((item: any, idx: number) => {
                      const tenInt = parseInt(item.ten);
                      const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
                      const animalData = ANIMAL_GROUPS.find(a => a.id === String(groupNum).padStart(2, '0'));
                      
                      return (
                        <tr key={item.ten} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 font-black text-white/20 italic">{idx + 1}º</td>
                          <td className="p-4">
                            <span className="font-mono text-lg font-black text-primary">
                              {item.ten}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-white/60">G{animalData?.id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{animalData?.icon}</span>
                              <span className="text-xs font-black uppercase italic text-white/80">{animalData?.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant="outline" className="border-white/10 text-white font-black">{item.currentDelay}d</Badge>
                          </td>
                          <td className="p-4 text-center font-mono text-xs text-white/40">
                            {item.relativeIndex?.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] font-black uppercase ${item.dailyDelay > 2 ? 'text-red-400' : 'text-white/40'}`}>
                              {item.dailyDelay}h
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                              item.classification === 'Muito acima da média' ? 'bg-red-500/10 text-red-500' : 
                              item.classification === 'Atraso elevado' ? 'bg-primary/10 text-primary' : 
                              'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {item.classification}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}

                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-white/5 py-16 bg-[#080B14] mt-12 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative z-10">
          <div className="flex items-center gap-4 text-white/40 text-xs font-bold leading-relaxed">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary/60">
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
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary/60">
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
               <span className="text-[8px] text-white/5 font-black uppercase tracking-widest">Resultados diários automatizados Rio, Capital & LCAP e Loteria Federal via robô automatizado sem intervenção humana</span>
            </div>

        </div>
      </footer>
    </div>
  );
}



