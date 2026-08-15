import { createFileRoute } from '@tanstack/react-router';
import ManagementLayout from '@/components/layout/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Trophy, Clock, Hash as NumbersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getResults } from '@/lib/lottery.functions';
import { DRAW_SCHEDULE, brasiliaDateISO } from '@/lib/draw-order';
import { getAnimalByGroup, getAnimalByTen } from '@/lib/animals';
import { useLotteryRealtime } from '@/hooks/useLotteryRealtime';

export const Route = createFileRoute("/_authenticated/jogos")({
  component: JogosManagementPage,
});

function JogosManagementPage() {
  const { lastUpdate } = useLotteryRealtime("jogos-db-changes");
  const fetchResults = useServerFn(getResults);
  const today = brasiliaDateISO();

  const { data: results, isLoading } = useQuery({
    queryKey: ['jogos', today, lastUpdate],
    queryFn: () => fetchResults({ data: { date: today, limit: 50, offset: 0 } }),
    staleTime: 0,
    gcTime: 0,
  });

  const games = DRAW_SCHEDULE.map((slot) => {
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
                    <div className="space-y-4">
                      {game.result.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {game.result.slice(0, 5).map((res: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-accent/50 p-2 rounded">
                              <span className="text-xs font-bold text-muted-foreground uppercase">{idx + 1}º Prêmio</span>
                              <span className="text-lg font-mono font-bold tracking-widest text-foreground">{res}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                          <p className="text-destructive text-sm italic animate-pulse">Aguardando resultado...</p>
                        </div>
                      )}

                      {game.animal && (
                        <div className="flex items-center justify-between pt-2 border-t mt-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">Grupo</span>
                            <span className="text-xl font-bold text-primary">{game.group}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">Bicho</span>
                            <div className="text-lg font-bold">{game.animal}</div>
                          </div>
                        </div>
                      )}
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
