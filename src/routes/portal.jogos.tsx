import { createFileRoute } from '@tanstack/react-router';
import ManagementLayout from '@/components/layout/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Clock, PlayCircle, Settings2, Hash, Hash as NumbersIcon, Edit3, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/portal/jogos')({
  component: JogosManagementPage,
});

function JogosManagementPage() {
  const { data: games, isLoading } = useQuery({
    queryKey: ['games-rio'],
    queryFn: () => base44.games.list(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600 animate-pulse"><PlayCircle className="w-3 h-3 mr-1" /> Ao Vivo</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Agendado</Badge>;
      case 'finished':
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><Trophy className="w-3 h-3 mr-1" /> Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ManagementLayout currentPageName="Gerenciar Jogos - Rio">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Resultados Jogo do Bicho Rio</h2>
            <p className="text-muted-foreground">Administre os sorteios diários da Flex Gerenciamentos.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Settings2 className="w-4 h-4 mr-2" />
            Configurações da Banca
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games?.map((game: any) => (
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
                        <CardDescription>{game.time} - {game.date}</CardDescription>
                      </div>
                      {getStatusBadge(game.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {game.result && game.result.length > 0 ? (
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
                          <p className="text-muted-foreground text-sm italic">Aguardando sorteio...</p>
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

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 text-xs h-8">
                          <Edit3 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
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