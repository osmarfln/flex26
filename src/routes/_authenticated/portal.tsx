import { createFileRoute } from '@tanstack/react-router';
import ManagementLayout from '@/components/layout/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Sparkles, 
  Archive, 
  CalendarDays,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
});

function PortalPage() {
  const stats = [
    { title: "Usuários Ativos", value: "1,234", icon: Users, color: "text-blue-600" },
    { title: "Análises Hoje", value: "456", icon: BrainCircuit, color: "text-purple-600" },
    { title: "Taxa de Acerto", value: "89%", icon: Target, color: "text-green-600" },
    { title: "Crescimento", value: "+12%", icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <ManagementLayout currentPageName="Portal">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground italic text-center">Gráfico de desempenho será exibido aqui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nova análise gerada</p>
                    <p className="text-xs text-muted-foreground">Há {i * 10} minutos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}
