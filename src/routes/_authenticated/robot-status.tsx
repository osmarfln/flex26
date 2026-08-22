import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RobotHealthPanel } from "@/components/RobotHealthPanel";
import { AcessoRestrito } from "@/components/AcessoRestrito";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getSyncStatus } from "@/lib/realtime.functions";
import { getScheduleSyncMatrix, runSyncNow } from "@/lib/robot.functions";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ArrowLeft,
  Info,
  Timer,
  Database,
  Percent,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/robot-status")({
  component: RobotStatus,
  head: () => ({
    meta: [
      { title: "Status do Robô | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Monitoramento em tempo real do robô de coleta: última sincronização, registros atualizados, gráficos por hora e histórico completo de execuções.",
      },
      { property: "og:title", content: "Status do Robô | Flex Gerenciador" },
      {
        property: "og:description",
        content:
          "Painel de monitoramento do robô de coleta automática de resultados: execuções, registros e desempenho por horário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STATUS_LABEL: Record<string, string> = {
  sincronizado: "Sincronizado",
  divergente: "Divergente",
  pendente: "Pendente",
  aguardando: "Aguardando",
};

const STATUS_STYLE: Record<string, string> = {
  sincronizado: "bg-emerald-500/15 text-emerald-400",
  divergente: "bg-red-500/15 text-red-400",
  pendente: "bg-yellow-500/15 text-yellow-400",
  aguardando: "bg-white/10 text-white/50",
};

/** Formata um instante ISO no horário oficial de Brasília. */
function formatBrasilia(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#0D121F",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "rgba(255,255,255,0.5)" },
};

function RobotStatus() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  useLotteryRealtime("robot-status-db-changes");
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');
  const { data: logs, isLoading, refetch, isError } = useQuery({
    queryKey: ["sync-logs", location],
    queryFn: () => getSyncStatus({ data: { location } }),
    refetchInterval: 15000,
  });


  const queryClient = useQueryClient();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { data: matrix } = useQuery({
    queryKey: ["schedule-sync-matrix", location],
    queryFn: () => getScheduleSyncMatrix({ data: { location } }),
    refetchInterval: 30000,
  });


  const triggerSync = useServerFn(runSyncNow);
  const syncMutation = useMutation({
    mutationFn: () => triggerSync({ data: { location } }),
    onSuccess: (res: any) => {
      setSyncMessage(
        res?.ok
          ? `Sincronização concluída: ${res.synced} registros verificados na origem.`
          : `Falha na sincronização: ${res?.error ?? "erro desconhecido"}`,
      );
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setSyncMessage(`Falha na sincronização: ${err?.message ?? "erro"}`),
  });
  const handleSyncNow = () => {
    setSyncMessage(null);
    syncMutation.mutate();
  };

  const list: any[] = logs ?? [];
  const lastSync = list[0];

  const today = new Date().toDateString();
  const todayLogs = list.filter(
    (l) => l.started_at && new Date(l.started_at).toDateString() === today,
  );
  const recordsToday = todayLogs.reduce((s, l) => s + (l.records_synced || 0), 0);
  const successCount = list.filter((l) => l.status === "success").length;
  const successRate = list.length ? Math.round((successCount / list.length) * 100) : 0;

  const durations = list
    .filter((l) => l.started_at && l.finished_at)
    .map((l) => (new Date(l.finished_at).getTime() - new Date(l.started_at).getTime()) / 1000);
  const avgDuration = durations.length
    ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
    : "0.0";

  // Série temporal (ordem cronológica) das últimas 30 execuções
  const timeline = [...list]
    .filter((l) => l.started_at)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .slice(-30)
    .map((l) => ({
      label: format(new Date(l.started_at), "dd/MM HH:mm", { locale: ptBR }),
      registros: l.records_synced || 0,
      duracao: l.finished_at
        ? Number(
            (
              (new Date(l.finished_at).getTime() - new Date(l.started_at).getTime()) /
              1000
            ).toFixed(1),
          )
        : 0,
      status: l.status,
    }));

  // Execuções por hora do dia
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, "0")}h`,
    execucoes: 0,
    registros: 0,
  }));
  list.forEach((l) => {
    if (!l.started_at) return;
    const h = new Date(l.started_at).getHours();
    const slot = byHour[h];
    if (!slot) return;
    slot.execucoes += 1;
    slot.registros += l.records_synced || 0;
  });
  const activeHours = byHour.filter((h) => h.execucoes > 0);

  if (!adminLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white">
        <SiteHeader subtitle="STATUS DO ROBÔ" />
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <AcessoRestrito area="Robô" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <SiteHeader subtitle="STATUS DO ROBÔ" />
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-12">
        <RobotHealthPanel />
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter uppercase truncate">
              Status do Robô
            </h1>
            <p className="text-white/40 text-[10px] md:text-sm mt-1 uppercase tracking-widest">
              Resultados diários automatizados via robô automatizado sem intervenção humana
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-white outline-none focus:border-primary/50"
              value={location}
              onChange={(e) => setLocation(e.target.value as any)}
            >
              <option value="rio">Rio de Janeiro</option>
              <option value="capital">Capital (Floripa)</option>
            </select>
            <button
              onClick={() => refetch()}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all shrink-0"
              aria-label="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>



        {/* Para que serve */}
        <Card className="bg-[#0D121F] border-white/10 rounded-3xl mb-8">
          <CardContent className="p-6 flex gap-4">
            <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-white/60 leading-relaxed">
              <span className="text-white font-bold">Para que serve esta página: </span>
              o robô é o serviço automático que coleta e grava os resultados na plataforma sem
              intervenção humana. Aqui você acompanha se ele está funcionando, quando rodou pela
              última vez, quantos registros foram atualizados em cada execução, em quais horários
              ele trabalha e se houve falhas. Use este painel para confirmar que os painéis do dia
              e o histórico estão sendo alimentados corretamente.
            </div>
          </CardContent>
        </Card>

        {isError && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Não foi possível carregar os dados de monitoramento.
          </div>
        )}

        {/* Conferência horário a horário contra a base de origem */}
        <Card className="bg-[#0D121F] border-white/10 rounded-3xl mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base font-black uppercase italic">
                Sincronização horário a horário
              </CardTitle>
              <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">
                {matrix?.date
                  ? `Dia ${format(new Date(`${matrix.date}T12:00:00`), "dd/MM/yyyy (EEEE)", { locale: ptBR })}`
                  : "Carregando..."}
                {matrix?.generatedAt
                  ? ` • conferido às ${formatBrasilia(matrix.generatedAt)}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`rounded-lg font-bold ${
                  matrix?.sourceOnline
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {matrix?.sourceOnline ? "Fonte online" : "Fonte indisponível"}
              </Badge>
              <button
                onClick={handleSyncNow}
                disabled={syncMutation.isPending}
                className="px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-black uppercase hover:bg-yellow-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                Sincronizar agora
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {syncMessage && (
              <p className="mb-4 text-xs font-bold text-emerald-400">{syncMessage}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm min-w-[640px]">
                <thead>
                  <tr className="text-white/40 uppercase text-[10px] tracking-widest">
                    <th className="py-2 pr-3">Horário</th>
                    <th className="py-2 pr-3">Hora</th>
                    <th className="py-2 pr-3">1º prêmio (plataforma)</th>
                    <th className="py-2 pr-3">1º prêmio (origem)</th>
                    <th className="py-2 pr-3">Bicho</th>
                    <th className="py-2 pr-3">Captado às</th>
                    <th className="py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {(matrix?.rows ?? []).map((row: any) => (
                    <tr key={row.timeType} className="border-t border-white/5">
                      <td className="py-3 pr-3 font-black">{row.label}</td>
                      <td className="py-3 pr-3 text-white/50">{row.timeValue}</td>
                      <td className="py-3 pr-3 font-mono font-bold text-primary">
                        {row.ourFirstPrize ?? "—"}
                      </td>
                      <td className="py-3 pr-3 font-mono text-white/60">
                        {row.sourceFirstPrize ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-white/60">{row.animal ?? "—"}</td>
                      <td className="py-3 pr-3 text-white/40">
                        {row.capturedAt ? formatBrasilia(row.capturedAt) : "—"}
                      </td>
                      <td className="py-3">
                        <Badge className={`rounded-lg font-bold ${STATUS_STYLE[row.status]}`}>
                          {STATUS_LABEL[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] text-white/30 leading-relaxed">
              Conferência automática: cada horário é comparado com a base de origem. "Aguardando"
              significa que o sorteio ainda não foi publicado; "Pendente" indica que já existe na
              origem e entrará na próxima execução do robô (a cada 10 minutos).
            </p>
          </CardContent>
        </Card>


        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Kpi
            title="Status Geral"
            icon={
              lastSync?.status === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : lastSync?.status === "error" ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />
              )
            }
            value={
              lastSync?.status === "success"
                ? "Operacional"
                : lastSync?.status === "error"
                  ? "Falha"
                  : "Aguardando"
            }
          />
          <Kpi
            title="Última Sincronização"
            icon={<Clock className="w-5 h-5 text-yellow-500" />}
            value={
              lastSync?.finished_at
                ? new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hourCycle: "h23",
                  }).format(new Date(lastSync.finished_at))
                : "--:--:--"
            }
            sub={
              lastSync?.finished_at
                ? `${new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    weekday: "long",
                  }).format(new Date(lastSync.finished_at))} · Horário de Brasília`
                : undefined
            }

          />
          <Kpi
            title="Registros Hoje"
            icon={<Database className="w-5 h-5 text-blue-400" />}
            value={String(recordsToday)}
            sub={`${todayLogs.length} execuções hoje`}
          />
          <Kpi
            title="Taxa de Sucesso"
            icon={<Percent className="w-5 h-5 text-emerald-500" />}
            value={`${successRate}%`}
            sub={`${successCount}/${list.length} execuções`}
          />
          <Kpi
            title="Duração Média"
            icon={<Timer className="w-5 h-5 text-yellow-500" />}
            value={`${avgDuration}s`}
            sub="por execução"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-[#0D121F] border-white/10 rounded-3xl">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">
                Registros por execução
              </CardTitle>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Últimas 30 execuções · data e hora
              </p>
            </CardHeader>
            <CardContent className="p-2 md:p-4 h-64">
              {timeline.length === 0 ? (
                <EmptyChart loading={isLoading} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EAB308" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#EAB308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} width={28} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Area
                      type="monotone"
                      dataKey="registros"
                      stroke="#EAB308"
                      strokeWidth={2}
                      fill="url(#gRec)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0D121F] border-white/10 rounded-3xl">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">
                Execuções por horário
              </CardTitle>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Distribuição por hora do dia
              </p>
            </CardHeader>
            <CardContent className="p-2 md:p-4 h-64">
              {activeHours.length === 0 ? (
                <EmptyChart loading={isLoading} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} width={28} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="execucoes" radius={[6, 6, 0, 0]} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0D121F] border-white/10 rounded-3xl lg:col-span-2">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">
                Tempo de execução (segundos)
              </CardTitle>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Verde = sucesso · Amarelo = em andamento · Vermelho = erro
              </p>
            </CardHeader>
            <CardContent className="p-2 md:p-4 h-64">
              {timeline.length === 0 ? (
                <EmptyChart loading={isLoading} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} width={28} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="duracao" radius={[6, 6, 0, 0]}>
                      {timeline.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            d.status === "success"
                              ? "#10B981"
                              : d.status === "error"
                                ? "#EF4444"
                                : "#EAB308"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico */}
        <Card className="bg-[#0D121F] border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">
              Histórico de Execuções
            </CardTitle>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              {list.length} execuções registradas
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-black">Data</th>
                    <th className="px-6 py-4 font-black">Dia</th>
                    <th className="px-6 py-4 font-black">Início</th>
                    <th className="px-6 py-4 font-black">Fim</th>
                    <th className="px-6 py-4 font-black">Duração</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 font-black">Registros</th>
                    <th className="px-6 py-4 font-black">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-white/30 text-sm">
                        Carregando execuções...
                      </td>
                    </tr>
                  )}
                  {!isLoading && list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-white/30 text-sm">
                        Nenhuma execução registrada ainda.
                      </td>
                    </tr>
                  )}
                  {list.map((log: any) => {
                    const start = log.started_at ? new Date(log.started_at) : null;
                    const end = log.finished_at ? new Date(log.finished_at) : null;
                    const dur =
                      start && end ? ((end.getTime() - start.getTime()) / 1000).toFixed(1) : null;
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold">
                          {start ? format(start, "dd/MM/yyyy", { locale: ptBR }) : "--"}
                        </td>
                        <td className="px-6 py-4 text-xs text-white/40 capitalize">
                          {start ? format(start, "EEEE", { locale: ptBR }) : "--"}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {start ? format(start, "HH:mm:ss") : "--:--:--"}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white/50">
                          {end ? format(end, "HH:mm:ss") : "--:--:--"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-white/50">
                          {dur ? `${dur}s` : "--"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={
                              log.status === "success"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : log.status === "error"
                                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{log.records_synced || 0}</td>
                        <td className="px-6 py-4 text-xs text-white/40 font-bold">
                          {log.date_range_start
                            ? `${log.date_range_start}${log.date_range_end ? ` → ${log.date_range_end}` : ""}`
                            : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-12 text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
        Flex Gerenciador © 2026 • Resultados diários automatizados via robô ai automatizado sem
        interveção humana
      </footer>
    </div>
  );
}

function Kpi({
  title,
  icon,
  value,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub?: string | undefined;
}) {
  return (
    <Card className="bg-[#0D121F] border-white/10 rounded-3xl">
      <CardHeader className="pb-2 p-5">
        <CardTitle className="text-[10px] text-white/40 uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-lg md:text-xl font-bold uppercase tracking-tighter">{value}</span>
        </div>
        {sub && (
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="h-full flex items-center justify-center text-white/30 text-xs uppercase tracking-widest">
      {loading ? "Carregando gráfico..." : "Sem dados suficientes"}
    </div>
  );
}
