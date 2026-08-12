import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSyncStatus } from "@/lib/realtime.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, Activity, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/robot-status")({
  component: RobotStatus,
});

function RobotStatus() {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: () => getSyncStatus(),
    refetchInterval: 30000,
  });

  const lastSync = logs?.[0];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <Link to="/" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
              <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-yellow-500 transition-colors" />
            </Link>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Status do Robô</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest">Monitoramento de sincronização em tempo real</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[#0D121F] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] text-white/40 uppercase tracking-widest">Status Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {lastSync?.status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Activity className="w-6 h-6 text-yellow-500 animate-pulse" />
                )}
                <span className="text-xl font-bold uppercase tracking-tighter">
                  {lastSync?.status === 'success' ? 'Operacional' : 'Sincronizando'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D121F] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] text-white/40 uppercase tracking-widest">Última Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-500" />
                <span className="text-xl font-bold uppercase tracking-tighter">
                  {lastSync?.finished_at ? format(new Date(lastSync.finished_at), "HH:mm:ss", { locale: ptBR }) : '--:--:--'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D121F] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] text-white/40 uppercase tracking-widest">Registros Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-500" />
                <span className="text-xl font-bold uppercase tracking-tighter">
                  {lastSync?.records_synced || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#0D121F] border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Histórico de Execuções</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-black">Data/Hora</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 font-black">Registros</th>
                    <th className="px-6 py-4 font-black">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold">{format(new Date(log.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{log.records_synced || 0}</td>
                      <td className="px-6 py-4 text-xs text-white/40 font-bold">{log.date_range_start}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
