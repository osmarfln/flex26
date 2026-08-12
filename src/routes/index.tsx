import { createFileRoute, Link } from "@tanstack/react-router";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Clock, PlayCircle, TrendingUp, Sparkles, Hash, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flex Gerenciamentos — Resultados Jogo do Bicho Rio" },
      {
        name: "description",
        content:
          "Resultados em tempo real, estatísticas avançadas e palpites do dia para o Jogo do Bicho Rio. A plataforma de gestão de loterias mais moderna.",
      },
      { property: "og:title", content: "Flex Gerenciamentos — Resultados Rio" },
      {
        property: "og:description",
        content:
          "Confira os resultados do Rio hoje: PTM, PT, PTV, PTN e Corujinha. Estatísticas e palpites exclusivos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: games, isLoading } = useQuery({
    queryKey: ["homepage-games"],
    queryFn: () => base44.games.list(),
  });

  const statistics = [
    { title: "Bicho Atrasado", value: "Macaco", trend: "12 dias", icon: Clock },
    { title: "Grupo mais sorteado", value: "23 (Cabra)", trend: "+15%", icon: TrendingUp },
    { title: "Milhar da Sorte", value: "1234", trend: "Sugestão", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold tracking-tight text-primary">
              Flex Gerenciamentos
            </span>
          </Link>
          <ul className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <li><a className="transition-colors hover:text-foreground font-bold" href="#resultados">Resultados</a></li>
            <li><a className="transition-colors hover:text-foreground" href="#estatisticas">Estatísticas</a></li>
            <li><a className="transition-colors hover:text-foreground" href="#palpites">Palpites</a></li>
            <li><Link className="transition-colors hover:text-foreground" to="/portal">Portal</Link></li>
          </ul>
          <div className="flex items-center gap-4">
            <Link
              to="/portal"
              className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              Acessar Gestão
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Moderno */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 py-1.5 px-4 text-xs font-bold uppercase tracking-widest">
                Real-Time Data · Loterias Rio
              </Badge>
              <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.1] mb-8">
                A Inteligência por trás do
                <br />
                <span className="text-primary italic">Jogo do Bicho Rio.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                Resultados instantâneos, análises probabilísticas e ferramentas de gestão exclusivas para bancas e apostadores profissionais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/25" asChild>
                  <a href="#resultados">Ver Resultados Agora</a>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg font-bold border-2" asChild>
                  <Link to="/portal">Painel de Gestão</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decors */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-10 blur-3xl bg-primary/30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 opacity-5 blur-3xl bg-accent/20 pointer-events-none" />
      </section>

      {/* Marquee de Tendências */}
      <div className="bg-ink py-4 border-y border-white/5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee items-center gap-12 text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-12 items-center">
              <span>Macaco atrasado 12 dias</span>
              <span className="text-primary">•</span>
              <span>Aumento de 15% no Grupo 23</span>
              <span className="text-primary">•</span>
              <span>Milhar 1234 em alta</span>
              <span className="text-primary">•</span>
              <span>PTM Rio liberado</span>
              <span className="text-primary">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resultados Section */}
      <section id="resultados" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Últimos Resultados Rio</h2>
              <p className="text-muted-foreground">Confira o resultado do jogo do bicho de hoje em tempo real.</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-4 py-1">Hoje</Badge>
              <Badge variant="ghost" className="px-4 py-1 text-muted-foreground">Ontem</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map(i => <Card key={i} className="h-96 animate-pulse" />)
            ) : (
              games?.map((game: any) => (
                <Card key={game.id} className="border-2 hover:border-primary/40 transition-all group shadow-sm hover:shadow-xl">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{game.type}</CardTitle>
                          <CardDescription>{game.time} · {game.date}</CardDescription>
                        </div>
                      </div>
                      {game.status === 'live' && (
                        <Badge className="bg-red-500 animate-pulse uppercase text-[10px]">Ao Vivo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {game.result.length > 0 ? (
                        game.result.slice(0, 5).map((res: string, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded bg-accent/30 group-hover:bg-accent/50 transition-colors">
                            <span className="text-xs font-bold text-muted-foreground">{idx + 1}º PRÊMIO</span>
                            <span className="text-xl font-mono font-bold tracking-tighter">{res}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-xl">
                          <p className="text-sm text-muted-foreground italic">Aguardando sorteio...</p>
                        </div>
                      )}
                      
                      {game.animal && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-dashed border-muted">
                          <div className="text-center bg-primary/5 rounded-lg px-4 py-2 border border-primary/10">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Grupo</p>
                            <p className="text-2xl font-bold text-primary">{game.group}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Animal</p>
                            <p className="text-xl font-bold">{game.animal}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Estatísticas e Palpites */}
      <section id="estatisticas" className="py-24 overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-4">Deep Analytics</Badge>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Estatísticas que geram resultados.</h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Nossa plataforma utiliza algoritmos avançados para identificar tendências e padrões nos sorteios do Rio de Janeiro.
              </p>
              <div className="grid gap-6">
                {statistics.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-6 rounded-2xl bg-card border shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</h4>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                      {stat.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div id="palpites" className="relative">
              <div className="bg-ink rounded-[2.5rem] p-10 text-white shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold">Palpite Gerado</h3>
                  <Sparkles className="text-primary w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Milhar</span>
                    <span className="text-4xl font-mono font-bold text-primary">4590</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Centena</span>
                    <span className="text-4xl font-mono font-bold text-primary">590</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Grupo</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold block">23</span>
                      <span className="text-xs text-white/40 uppercase font-bold">Urso</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-10 h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90">
                  Gerar Novo Palpite
                </Button>
                <p className="text-center text-xs text-white/30 mt-6">
                  *Palpites baseados em análise de frequência dos últimos 30 dias.
                </p>
              </div>
              {/* Background Glow */}
              <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary/60 mb-12">Por que escolher o Flex Gerenciamentos?</h3>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Segurança Total", desc: "Dados criptografados e servidores de alta disponibilidade.", icon: ShieldCheck },
              { title: "Precisão Absoluta", desc: "Resultados validados diretamente das fontes oficiais do Rio.", icon: Trophy },
              { title: "Gestão Profissional", desc: "Ferramentas completas para administração de bancas.", icon: Hash },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary mb-6">
                  <item.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  Flex Gerenciamentos
                </span>
              </Link>
              <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
                A plataforma líder em gestão e resultados de loterias no Brasil. Tecnologia e precisão para quem leva o jogo a sério.
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="sr-only">Instagram</span>
                  <div className="w-5 h-5 bg-current opacity-20" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="sr-only">Telegram</span>
                  <div className="w-5 h-5 bg-current opacity-20" />
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Plataforma</h5>
              <ul className="space-y-4 text-white/50 text-sm">
                <li><a href="#resultados" className="hover:text-white transition-colors">Resultados Rio</a></li>
                <li><a href="#estatisticas" className="hover:text-white transition-colors">Estatísticas</a></li>
                <li><a href="#palpites" className="hover:text-white transition-colors">Palpites do Dia</a></li>
                <li><Link to="/portal" className="hover:text-white transition-colors">Portal de Gestão</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Legal</h5>
              <ul className="space-y-4 text-white/50 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Flex Gerenciamentos. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <span>Tecnologia Base44</span>
              <span>Loterias Rio Oficial</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}