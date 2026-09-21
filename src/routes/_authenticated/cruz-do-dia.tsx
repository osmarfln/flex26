import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Sparkles } from "lucide-react";
import { BackNav } from "@/components/layout/BackNav";
import { CruzDoDia } from "@/components/CruzDoDia";
import { UserMenu } from "@/components/layout/UserMenu";

export const Route = createFileRoute("/_authenticated/cruz-do-dia")({
  head: () => ({
    meta: [
      { title: "Cruz do Dia — Técnica Tradicional" },
      { name: "description", content: "Ferramenta de cálculos matemáticos baseados no dia atual para geração de palpites do Jogo do Bicho." },
      { property: "og:title", content: "Cruz do Dia — Técnica Tradicional" },
      { property: "og:description", content: "Ferramenta tradicional de cálculos da Cruz do Dia para o Jogo do Bicho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CruzDoDiaPage,
});

function CruzDoDiaPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Top Header */}
      <header className="app-dashboard-header border-b border-white/10 bg-transparent/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <BackNav className="mr-4" />
          <div className="flex flex-col flex-1">
            <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Flex Gerenciador</span>
            <span className="text-[9px] text-emerald-500/60 font-bold tracking-[0.2em]">CRUZ DO DIA</span>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12">
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <Calculator className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Cruz do Dia</h1>
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Ferramenta técnica tradicional de palpites</p>
            </div>
          </div>

           <div className="home-glass rounded-2xl p-8 md:p-12 relative overflow-hidden">
             {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32" />
            
            <CruzDoDia />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-12 bg-transparent/70 text-center text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Resultados diários automatizados via robô ai automatizado sem interveção humana
      </footer>

    </div>
  );
}
