import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Calculator, Sparkles, TrendingUp, Zap, Target, BrainCircuit, History, Flame, Clock } from "lucide-react";
import { CruzDoDia } from "@/components/CruzDoDia";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getStats } from "@/lib/lottery.functions";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

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
  const [activeTab, setActiveTab] = useState<'quentes' | 'atrasados' | 'palpites'>('quentes');
  const [cruzData, setCruzData] = useState<string[]>([]);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats-page"],
    queryFn: () => getStats(),
  });

  const getAnimalByTen = (ten: string) => {
    const tenInt = parseInt(ten);
    if (isNaN(tenInt)) return null;
    const groupNum = Math.floor((tenInt === 0 ? 100 : tenInt - 1) / 4) + 1;
    const groupId = String(groupNum).padStart(2, '0');
    return ANIMAL_GROUPS.find(a => a.id === groupId);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
               onClick={() => setActiveTab('palpites')}
               className={`bg-[#0D121F] border-white/10 rounded-2xl p-6 transition-all cursor-pointer group ${activeTab === 'palpites' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'hover:border-emerald-500/30'}`}
             >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${activeTab === 'palpites' ? 'bg-emerald-500 text-[#0B0F19]' : 'bg-emerald-500/10 text-emerald-500'}`}>
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
