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
  Users
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
  { id: "01", name: "Avestruz" }, { id: "02", name: "Águia" }, { id: "03", name: "Burro" }, { id: "04", name: "Borboleta" }, { id: "05", name: "Cachorro" },
  { id: "06", name: "Cabra" }, { id: "07", name: "Leão" }, { id: "08", name: "Macaco" }, { id: "09", name: "Cobra" }, { id: "10", name: "Coelho" },
  { id: "11", name: "Cavalo" }, { id: "12", name: "Elefante" }, { id: "13", name: "Galo" }, { id: "14", name: "Gato" }, { id: "15", name: "Jacaré" },
  { id: "16", name: "Leopardo" }, { id: "17", name: "Porco" }, { id: "18", name: "Coruja" }, { id: "19", name: "Pavão" }, { id: "20", name: "Peru" },
  { id: "21", name: "Touro" }, { id: "22", name: "Tigre" }, { id: "23", name: "Urso" }, { id: "24", name: "Veado" }, { id: "25", name: "Vaca" },
];

function Index() {
  const { data: games, isLoading, refetch } = useQuery({
    queryKey: ["homepage-games"],
    queryFn: () => base44.games.list(),
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-yellow-500/30">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex flex-col">
              <span className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl font-black tracking-tighter uppercase italic">Flex Gerenciador</span>
              </span>
              <span className="text-[10px] text-yellow-500/60 font-bold tracking-[0.2em] -mt-1 ml-8">VEM COM A GENTE</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 ml-8">
              <a href="#" className="text-sm font-bold border-b-2 border-yellow-500 pb-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> Início
              </a>
              <a href="#resultados" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Resultados
              </a>
              <a href="#" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2">
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

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Resultados Todos os Dias</h1>
          <p className="text-white/40 text-lg mb-8">Consulte os resultados por banca, data e horário</p>

          <div className="flex flex-wrap gap-4 items-center mb-12">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
              <Calendar className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Data</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Hoje, 12 de agosto</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
              <MapPin className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Localidade</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Rio de Janeiro</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[200px]">
              <Clock className="w-5 h-5 text-white/40" />
              <div className="flex-1">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Horário</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Todos os horários</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>

            <Button className="h-[54px] px-8 bg-yellow-500 hover:bg-yellow-400 text-[#0B0F19] font-black uppercase tracking-tighter rounded-xl gap-2">
              <Search className="w-5 h-5" /> Buscar resultados
            </Button>
          </div>
        </section>

        {/* Results Grid & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
              ))
            ) : (
              games?.map((game: any) => (
                <Card key={game.id} className="bg-white/5 border-white/10 rounded-2xl overflow-hidden group hover:border-yellow-500/50 transition-all">
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start mb-4">
                      <CardTitle className="text-xl font-black italic tracking-tighter">
                        {game.type} RIO — {game.time}hs
                      </CardTitle>
                      {game.status === 'live' && (
                        <div className="px-2 py-0.5 bg-yellow-500 text-[#0B0F19] text-[9px] font-black uppercase rounded shadow-lg shadow-yellow-500/20">
                          Mais Recente
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        {game.result.slice(0, 5).map((res: string, idx: number) => (
                          <div key={idx} className="flex gap-3 text-sm font-bold">
                            <span className="text-white/20">{idx + 1}º</span>
                            <span className="font-mono tracking-tighter">{res || '----'}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="w-12 h-12 mb-2 text-yellow-500">
                           {/* Placeholder for Animal Icon */}
                           <Sparkles className="w-full h-full opacity-50" />
                        </div>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                        <p className="text-2xl font-black text-yellow-500 tracking-tighter leading-none">{game.group || '--'}</p>
                        <p className="text-[10px] font-bold mt-1 text-white/60">{game.animal || 'Aguardando'}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Atualizado às {game.time}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4">
            <Card className="bg-white/5 border-white/10 rounded-2xl h-full">
              <CardHeader className="p-6">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-5 h-5" />
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Últimos resultados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                {games?.map((game: any) => (
                  <div key={game.id} className="flex items-center justify-between text-sm group cursor-default">
                    <div className="flex items-center gap-4">
                      <span className="text-white/40 font-mono">{game.time}</span>
                      <span className="font-black italic tracking-tighter uppercase group-hover:text-yellow-500 transition-colors">{game.type} RIO</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40 font-bold uppercase">Grupo <span className="text-yellow-500 ml-1">{game.group || '--'}</span></span>
                      <span className="text-xs font-bold text-white/80">{game.animal || '---'}</span>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-8 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase italic tracking-widest py-6">
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
            <Card className="bg-white/5 border-white/10 rounded-2xl">
              <CardHeader className="p-6">
                <div className="flex items-center gap-2 text-white/60">
                  <Hash className="w-5 h-5" />
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Grupos do Jogo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {ANIMAL_GROUPS.map((animal) => (
                    <div key={animal.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-yellow-500/30 transition-all group flex items-center gap-3">
                      <div className="text-[10px] font-mono text-yellow-500 font-bold">{animal.id}</div>
                      <div className="text-[11px] font-bold uppercase tracking-tight text-white/60 group-hover:text-white transition-colors">{animal.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Graph Placeholder */}
          <div className="lg:col-span-4">
             <Card className="bg-white/5 border-white/10 rounded-2xl h-full">
              <CardHeader className="p-6">
                <div className="flex items-center gap-2 text-white/60">
                  <TrendingUp className="w-5 h-5" />
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Resultados por horário</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-64 flex items-end justify-between gap-3 px-4 pb-4">
                  {[22, 21, 19, 20, 18, 16].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                      <div 
                        className="w-full bg-yellow-500/20 group-hover:bg-yellow-500 transition-all rounded-t-sm" 
                        style={{ height: `${(val / 25) * 100}%` }} 
                      />
                      <span className="text-[9px] text-white/20 font-mono mt-2">{["09h", "11h", "14h", "16h", "18h", "21h"][i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <div className="w-3 h-3 bg-yellow-500/40 rounded-sm" />
                  Total de resultados
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-white/5 py-12 bg-black/20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="flex items-center gap-3 text-white/40 text-xs font-bold leading-relaxed">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60">
              <Trophy className="w-5 h-5" />
            </div>
            <p>Conteúdo exclusivamente informativo. <br /> Não realizamos apostas.</p>
          </div>
          
          <div className="text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">
            Os resultados apresentados são de fontes públicas e podem sofrer alterações.
            Confira sempre os resultados oficiais das bancas.
          </div>

          <div className="flex items-center justify-end gap-3 text-white/40 text-xs font-bold leading-relaxed text-right">
            <p>Jogo do Bicho é tradição, <br /> informação é responsabilidade.</p>
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-[10px] text-white/10 font-black uppercase tracking-[0.3em]">
          Flex Gerenciador © 2026 · Tecnologia Base44
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
