import { createFileRoute, Link } from "@tanstack/react-router";
import { base44 } from "@/api/base44Client";
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
  PlayCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

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

function Index() {
  const { data: games, isLoading, refetch } = useQuery({
    queryKey: ["homepage-games"],
    queryFn: () => base44.games.list(),
  });

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
              <a href="#resultados" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Resultados
              </a>
              <a href="#historico" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico
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
        {/* Floating Butterfly Graphic from the image */}
        <div className="absolute top-0 right-0 hidden xl:block opacity-20 translate-x-1/4 -translate-y-12">
           <svg width="400" height="400" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
             <path d="M12 21.5C12 21.5 10 16.5 4 15.5C4 15.5 1 14.5 1 10.5C1 6.5 4 4.5 8 4.5C12 4.5 12 8.5 12 8.5M12 21.5C12 21.5 14 16.5 20 15.5C20 15.5 23 14.5 23 10.5C23 6.5 20 4.5 16 4.5C12 4.5 12 8.5 12 8.5" stroke="currentColor" strokeWidth="0.5" />
           </svg>
        </div>

        {/* Hero Section */}
        <section className="mb-12 relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 italic">Resultados Todos os Dias</h1>
          <p className="text-white/40 text-lg mb-8 font-medium">Consulte os resultados por banca, data e horário</p>

          <div className="flex flex-wrap gap-4 items-center mb-12">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px] hover:border-yellow-500/30 transition-all cursor-pointer">
              <Calendar className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Data</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Hoje, 12 de agosto</span>
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

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px] hover:border-yellow-500/30 transition-all cursor-pointer">
              <Clock className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Horário</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Todos os horários</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>

            <Button className="h-[54px] px-10 bg-yellow-500 hover:bg-yellow-400 text-[#0B0F19] font-black uppercase tracking-tighter rounded-xl gap-2 shadow-lg shadow-yellow-500/10 active:scale-95 transition-all">
              <Search className="w-5 h-5" /> Buscar resultados
            </Button>
          </div>
        </section>

        {/* Results Grid & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16" id="resultados">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
              ))
            ) : (
              games?.map((game: any) => (
                <Card key={game.id} className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/40 transition-all relative">
                  {game.status === 'live' && (
                    <div className="absolute inset-0 border border-yellow-500/20 rounded-2xl pointer-events-none" />
                  )}
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start mb-4">
                      <CardTitle className="text-xl font-black italic tracking-tighter uppercase">
                        {game.type} RIO — {game.time}hs
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
                        {(game.result.length > 0 ? game.result.slice(0, 5) : ['----', '----', '----', '----', '----']).map((res: string, idx: number) => (
                          <div key={idx} className="flex gap-4 text-sm font-bold items-baseline">
                            <span className="text-white/20 w-4">{idx + 1}º</span>
                            <span className="font-mono tracking-widest text-lg">{res}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl p-4 border border-white/5 relative">
                        <div className="w-16 h-16 mb-2 text-yellow-500 flex items-center justify-center text-4xl">
                           {ANIMAL_GROUPS.find(a => a.id === game.group)?.icon || <Sparkles className="w-8 h-8 opacity-20" />}
                        </div>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                        <p className="text-3xl font-black text-yellow-500 tracking-tighter leading-none">{game.group || '--'}</p>
                        <p className="text-[11px] font-bold mt-2 text-white/80 uppercase tracking-tight">{game.animal || 'Aguardando'}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      <div className={`w-1.5 h-1.5 rounded-full ${game.status === 'finished' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                      Atualizado às {game.time}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4" id="historico">
            <Card className="bg-[#0D121F] border-white/10 rounded-2xl h-full shadow-xl">
              <CardHeader className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 text-white/60">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Últimos resultados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {games?.map((game: any) => (
                  <div key={game.id} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-white/30 font-mono font-bold">{game.time}</span>
                      <span className="font-black italic tracking-tighter uppercase group-hover:text-yellow-500 transition-colors">{game.type} RIO</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Grupo <span className="text-yellow-500 ml-1">{game.group || '--'}</span></span>
                         <span className="text-xs font-black text-white/80 uppercase italic">{game.animal || '---'}</span>
                      </div>
                      <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">
                         {ANIMAL_GROUPS.find(a => a.id === game.group)?.icon}
                      </span>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-8 border-white/10 bg-white/5 hover:bg-white/10 hover:border-yellow-500/30 text-[10px] font-black uppercase italic tracking-[0.2em] py-7 rounded-xl transition-all">
                  Ver histórico completo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Groups Table & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="grupos">
          {/* Groups Grid */}
          <div className="lg:col-span-8">
            <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 text-white/60">
                  <Hash className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Grupos do Jogo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {ANIMAL_GROUPS.map((animal) => (
                    <div key={animal.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-yellow-500/40 transition-all group flex items-center gap-3 cursor-default">
                      <div className="text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">{animal.icon}</div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-yellow-500/60 font-black tracking-tighter uppercase">{animal.id}</span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-white/50 group-hover:text-white transition-colors italic">{animal.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Graph */}
          <div className="lg:col-span-4">
             <Card className="bg-[#0D121F] border-white/10 rounded-2xl h-full shadow-xl">
              <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 text-white/60">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Resultados por horário</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 flex items-end justify-between gap-3 px-2 pb-4">
                  {[22, 21, 19, 20, 18, 16].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-black text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{val}</span>
                      <div 
                        className="w-full bg-white/5 group-hover:bg-yellow-500/80 transition-all rounded-t-md relative overflow-hidden" 
                        style={{ height: `${(val / 25) * 100}%` }}
                      >
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <span className="text-[10px] text-white/20 font-black mt-2 tracking-tighter uppercase">{["09h", "11h", "14h", "16h", "18h", "21h"][i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                  <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/20 rounded-sm" />
                  Total de resultados
                </div>
              </CardContent>
            </Card>
          </div>
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
              <span className="text-[8px] text-white/5 font-black uppercase tracking-widest">Resultados Publicados sem comercial</span>
           </div>
        </div>
      </footer>
    </div>
  );
}


function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
