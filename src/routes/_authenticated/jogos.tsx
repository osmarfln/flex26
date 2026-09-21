import { createFileRoute } from '@tanstack/react-router';
import ManagementLayout from '@/components/layout/ManagementLayout';
import { AcessoRestrito } from '@/components/AcessoRestrito';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Trophy, Clock, Hash as NumbersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getResults } from '@/lib/lottery.functions';
import { getScheduleForDate, brasiliaDateISO } from '@/lib/draw-order';
import { getAnimalByGroup, getAnimalByTen } from '@/lib/animals';
import { useLotteryRealtime } from '@/hooks/useLotteryRealtime';
import { PrizeAnimalRow } from '@/components/PrizeAnimalRow';

export const Route = createFileRoute("/_authenticated/jogos")({
  head: () => ({
    meta: [
      { title: "Gerenciar Resultados do Rio — Flex Gerenciador" },
      { name: "description", content: "Acompanhe os resultados automatizados do Rio, do primeiro ao quinto prêmio." },
      { property: "og:title", content: "Gerenciar Resultados do Rio — Flex Gerenciador" },
      { property: "og:description", content: "Resultados automatizados do Rio com identificação dos grupos e bichos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JogosManagementPage,
});

function JogosManagementPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { lastUpdate } = useLotteryRealtime("jogos-db-changes");
  const fetchResults = useServerFn(getResults);
  const today = brasiliaDateISO();

  const { data: results, isLoading } = useQuery({
    queryKey: ['jogos', today, lastUpdate],
    queryFn: () => fetchResults({ data: { date: today, limit: 50, offset: 0 } }),
    staleTime: 0,
    gcTime: 0,
  });

  const games = getScheduleForDate('rio', brasiliaDateISO()).map((slot) => {
    const found = (results ?? []).find((r) => r.time_type === slot.timeType);
    const prizes = found?.results ?? [];
    const animal =
      getAnimalByGroup(found?.animal_group) ??
      (prizes[0] ? getAnimalByTen(prizes[0]) : undefined);
    return {
      id: slot.timeType,
      type: slot.timeType,
      label: slot.label,
      time: found?.time_value || slot.timeValue,
      status: prizes.length > 0 ? 'finished' : 'scheduled',
      result: prizes,
      animal: found?.animal || animal?.name || '',
      group: found?.animal_group || animal?.id || '',
    };
  });

  if (!adminLoading && !isAdmin) {
    return (
      <ManagementLayout currentPageName="Gerenciar Jogos - Rio">
        <AcessoRestrito area="Gerenciar Jogos" />
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout currentPageName="Gerenciar Jogos - Rio">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resultados Jogo do Bicho Rio</h2>
          <p className="text-muted-foreground">
            Dados oficiais capturados pelo robô — {new Date(today + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-lg">
                  <CardHeader className="pb-2 bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-primary">
                          <NumbersIcon className="w-5 h-5" />
                          {game.type}
                        </CardTitle>
                        <CardDescription>{game.time} - {game.label}</CardDescription>
                      </div>
                      {game.status === 'finished' ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          <Trophy className="w-3 h-3 mr-1" /> Finalizado
                        </Badge>
                      ) : (
                        <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Aguardando</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="result-prizes-layout">
                      <div className="space-y-1">
                        {(game.result.length > 0 ? game.result.slice(0, 5) : [null, null, null, null, null]).map((res: string | null, idx: number) => (
                          <PrizeAnimalRow key={idx} position={idx + 1} result={res} compact />
                        ))}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/[0.06] rounded-xl p-4 border border-white/10">
                        <div className="w-16 h-16 mb-2 flex items-center justify-center text-4xl">
                          {getAnimalByGroup(game.group)?.icon || <Clock className="w-8 h-8 opacity-20 text-white/20" />}
                        </div>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Grupo</p>
                        <p className={`text-3xl font-black tracking-tighter leading-none ${game.group ? 'text-primary' : 'text-white/10'}`}>{game.group || '--'}</p>
                        <p className={`text-[11px] font-bold mt-2 uppercase tracking-tight ${game.animal ? 'text-white/80' : 'text-blue-400/50 italic'}`}>{game.animal || 'Aguardando'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
