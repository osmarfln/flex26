import { createFileRoute } from '@tanstack/react-router';
import ManagementLayout from '@/components/layout/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Clock, PlayCircle, Settings2 } from 'lucide-react';

export const Route = createFileRoute('/portal/jogos')({
  component: JogosManagementPage,
});

function JogosManagementPage() {
  const { data: games, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.games.list(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600 animate-pulse"><PlayCircle className="w-3 h-3 mr-1" /> Ao Vivo</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Agendado</Badge>;
      case 'finished':
        return <Badge variant="outline"><Trophy className="w-3 h-3 mr-1" /> Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ManagementLayout currentPageName="Gerenciar Jogos">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de Jogos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Gerencie os jogos ativos e agendados no sistema.</p>
          </div>
          <Button size="sm">
            <Settings2 className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Liga</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Carregando jogos...</TableCell>
                  </TableRow>
                ) : (
                  games?.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{game.homeTeam} vs {game.awayTeam}</span>
                          {game.score && <span className="text-xs text-primary font-bold">{game.score}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{game.league}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{game.date}</div>
                          <div className="text-muted-foreground">{game.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(game.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
}
