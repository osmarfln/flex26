import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2, Radio } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  getDigitDelayStats,
  getGroupDelayStats,
  getPuxadasStats,
  getRepetitionStats,
  getStats,
  getTenDelayStats,
} from "@/lib/lottery.functions";
import { getScheduleSyncMatrix } from "@/lib/robot.functions";
import { getSyncStatus } from "@/lib/realtime.functions";

function fmt(iso?: string | null) {
  if (!iso) return "—";
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

/** Painel de saúde do robô: conexão em tempo real, última execução e erros por ferramenta. */
export function RobotHealthPanel() {
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');

  const [channelState, setChannelState] = useState<"conectando" | "online" | "offline">("conectando");

  useEffect(() => {
    const channel = supabase
      .channel("robot-health-indicator")
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_results" }, () => {})
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setChannelState("online");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
          setChannelState("offline");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const live = { staleTime: 0, gcTime: 0, retry: 0 } as const;

  const tools = [
    { key: "resultados", label: "Coleta de resultados", q: useQuery({ queryKey: ["health-stats", location], queryFn: () => getStats({ data: { location } }), ...live }) },
    { key: "dezenas", label: "Atraso das dezenas", q: useQuery({ queryKey: ["health-ten", location], queryFn: () => getTenDelayStats({ data: { location } }), ...live }) },
    { key: "grupos", label: "Atraso dos grupos", q: useQuery({ queryKey: ["health-group", location], queryFn: () => getGroupDelayStats({ data: { location } }), ...live }) },
    { key: "repeticoes", label: "Repetições", q: useQuery({ queryKey: ["health-rep", location], queryFn: () => getRepetitionStats({ data: { location } }), ...live }) },
    { key: "digitos", label: "Dezena esquerda/direita", q: useQuery({ queryKey: ["health-digit", location], queryFn: () => getDigitDelayStats({ data: { location } }), ...live }) },
    { key: "puxadas", label: "Tabela de puxadas", q: useQuery({ queryKey: ["health-puxadas", location], queryFn: () => getPuxadasStats({ data: { location } }), ...live }) },

  ];

  const fetchMatrix = useServerFn(getScheduleSyncMatrix);
  const matrixQuery = useQuery({
    queryKey: ["health-matrix", location],
    queryFn: () => fetchMatrix({ data: { location } }),

    refetchInterval: 30_000,
    retry: 0,
  });

  const logsQuery = useQuery({
    queryKey: ["health-logs", location],
    queryFn: () => getSyncStatus({ data: { location } }),

    refetchInterval: 15_000,
    retry: 0,
  });

  const logs = (logsQuery.data as any[]) ?? [];
  const lastRun = logs[0];
  const logErrors = logs.filter((l) => l.status === "error").length;
  const toolErrors = tools.filter((t) => t.q.isError).length + (matrixQuery.isError ? 1 : 0);

  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="mr-auto">
          <h2 className="text-lg font-black uppercase tracking-tight">Status do robô por ferramenta</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Sincronização em tempo real, última execução e erros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="h-8 rounded-xl border border-white/10 bg-white/5 px-2 text-[10px] font-bold text-white outline-none focus:border-primary/50"
            value={location}
            onChange={(e) => setLocation(e.target.value as any)}
          >
            <option value="rio">Rio</option>
            <option value="capital">Capital</option>
          </select>
          <span
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase ${

            channelState === "online"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : channelState === "offline"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-white/10 bg-white/5 text-white/50"
          }`}
        >
          <Radio className={`h-3.5 w-3.5 ${channelState === "online" ? "animate-pulse" : ""}`} />
          {channelState === "online"
            ? "Tempo real conectado"
            : channelState === "offline"
              ? "Tempo real offline"
              : "Conectando..."}
          </span>
        </div>

      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Última execução</p>
          <p className="text-sm font-black">{fmt(lastRun?.finished_at ?? lastRun?.started_at)}</p>
          <p className="text-[11px] font-bold text-white/50">
            {lastRun ? `${lastRun.records_synced ?? 0} registros · ${lastRun.status}` : "Sem execuções"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Erros nas execuções</p>
          <p className={`text-2xl font-black ${logErrors ? "text-red-400" : "text-emerald-400"}`}>{logErrors}</p>
          <p className="text-[11px] font-bold text-white/50">Últimas {logs.length} execuções</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Ferramentas com erro</p>
          <p className={`text-2xl font-black ${toolErrors ? "text-red-400" : "text-emerald-400"}`}>{toolErrors}</p>
          <p className="text-[11px] font-bold text-white/50">de {tools.length + 1} monitoradas</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {[
          ...tools,
          { key: "matriz", label: "Matriz de conferência", q: matrixQuery as any },
        ].map((t) => {
          const q = t.q as any;
          const state = q.isFetching ? "sync" : q.isError ? "erro" : "ok";
          return (
            <div
              key={t.key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              {state === "sync" ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
              ) : state === "erro" ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
              <span className="mr-auto text-xs font-bold">{t.label}</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                <Clock className="h-3 w-3" />
                {q.dataUpdatedAt ? fmt(new Date(q.dataUpdatedAt).toISOString()) : "—"}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                  state === "erro"
                    ? "bg-red-500/15 text-red-400"
                    : state === "sync"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {state === "erro" ? `${q.errorUpdateCount ?? 1} erro(s)` : state === "sync" ? "sincronizando" : "ok"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
