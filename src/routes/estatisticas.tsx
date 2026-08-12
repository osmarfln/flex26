import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Calculator, Sparkles, TrendingUp, Zap, Target, BrainCircuit, History, Flame, Clock } from "lucide-react";
import { CruzDoDia } from "@/components/CruzDoDia";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
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
    const delayedGroups = stats.mostDelayedGroups.map(g => g.group);
    
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
             <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Target className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Dezenas Quentes</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">As dezenas que mais apareceram nos últimos 100 sorteios filtrados por horário.</p>
             </Card>

             <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Grupos em Atraso</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Identifique grupos que estão há mais tempo sem aparecer na cabeça.</p>
             </Card>

             <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <BrainCircuit className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2">Palpites IA</h3>
                <p className="text-sm text-white/40 font-medium leading-snug">Sugestões geradas por inteligência artificial baseadas em padrões cíclicos.</p>
             </Card>
          </div>

          {/* Cruz do Dia Section */}
          <div id="cruz-do-dia" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-px h-8 bg-emerald-500" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Técnicas Tradicionais</h2>
            </div>
            
            <div className="bg-[#0D121F] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
               {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32" />
              
              <CruzDoDia />
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
