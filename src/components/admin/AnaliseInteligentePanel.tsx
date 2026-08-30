import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BrainCircuit, CheckCircle2, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getScheduleForDate } from "@/lib/draw-order";

function brasiliaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Análise da plataforma: analytics da plataforma, atrasos e falhas internas em tempo real. */
export function AnaliseInteligentePanel({ enabled }: { enabled: boolean }) {
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');

  const { date: today, minutes: nowMin } = brasiliaNow();

  const activityQuery = useQuery({
    queryKey: ["admin", "ia-activity"],
    enabled,
    staleTime: 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      const from = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("user_activity")
        .select("id, user_id, event_type, path, label, created_at")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        user_id: string;
        event_type: string;
        path: string | null;
        label: string | null;
        created_at: string;
      }>;
    },
  });

  const todayQuery = useQuery({
    queryKey: ["admin", "ia-today", today, location],
    enabled,
    staleTime: 0,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_results")
        .select("time_type, time_value, created_at, location")
        .eq("date", today)
        .eq("location", location);

      if (error) throw error;
      return data ?? [];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["admin", "ia-logs", location],
    enabled,
    staleTime: 0,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("id, status, started_at, finished_at, records_synced, error_message, location")
        .eq("location", location)

        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const acts = activityQuery.data ?? [];

  const porHora = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3600_000);
      const key = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(d);
      buckets.set(`${key}h`, 0);
    }
    for (const a of acts) {
      const key = `${new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(a.created_at))}h`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets, ([hora, eventos]) => ({ hora, eventos }));
  }, [acts]);

  const porPagina = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of acts) {
      if (a.event_type !== "page_view" || !a.path) continue;
      map.set(a.path, (map.get(a.path) ?? 0) + 1);
    }
    return Array.from(map, ([pagina, acessos]) => ({ pagina, acessos }))
      .sort((a, b) => b.acessos - a.acessos)
      .slice(0, 8);
  }, [acts]);

  const results = todayQuery.data ?? [];
  const atrasados = getScheduleForDate(location as 'rio' | 'capital', today).map((s) => {
    const [h, m] = s.timeValue.split(":").map(Number);
    const due = (h ?? 0) * 60 + (m ?? 0);
    const got = results.find(
      (r) => (r.time_type ?? "").toUpperCase().replace("PTT", "PPT") === s.timeType,
    );
    const status = got ? "recebido" : nowMin > due + 20 ? "atrasado" : nowMin >= due ? "aguardando" : "programado";
    return { type: s.timeType, value: s.timeValue, label: s.label, status, capturedAt: got?.created_at ?? null };
  });

  const logs = logsQuery.data ?? [];
  const falhas = logs.filter((l) => l.status === "error");
  const atrasoCount = atrasados.filter((a) => a.status === "atrasado").length;
  const usuariosAtivos = new Set(
    acts.filter((a) => Date.now() - new Date(a.created_at).getTime() < 30 * 60_000).map((a) => a.user_id),
  ).size;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <select 
          className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-white outline-none focus:border-primary/50"
          value={location}
          onChange={(e) => setLocation(e.target.value as any)}
        >
          <option value="rio">Rio</option>
          <option value="capital">Capital</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Eventos (24 h)" value={acts.length} />
        <Kpi label="Usuários ativos (30 min)" value={usuariosAtivos} tone="text-emerald-400" />
        <Kpi
          label="Resultados atrasados"
          value={atrasoCount}
          tone={atrasoCount ? "text-destructive" : "text-emerald-400"}
        />
        <Kpi
          label="Falhas internas"
          value={falhas.length}
          tone={falhas.length ? "text-destructive" : "text-emerald-400"}
        />
      </div>

      {(atrasoCount > 0 || falhas.length > 0) && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-destructive">
            <AlertTriangle className="h-4 w-4" /> Aviso de falhas e erros internos
          </p>
          <ul className="mt-2 space-y-1 text-xs text-destructive/90">
            {atrasados
              .filter((a) => a.status === "atrasado")
              .map((a) => (
                <li key={a.type}>
                  Resultado {a.label} ({a.value}) não chegou dentro da janela prevista.
                </li>
              ))}
            {falhas.slice(0, 5).map((l) => (
              <li key={l.id}>
                Robô falhou em {new Date(l.started_at ?? "").toLocaleString("pt-BR")} —{" "}
                {l.error_message ?? "erro desconhecido"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white/70">
          <BrainCircuit className="h-4 w-4" /> Atividade da plataforma (24 h)
        </h2>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={porHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} minTickGap={16} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} width={40} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,14,24,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="eventos"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white/70">
          Páginas mais acessadas
        </h2>
        {porPagina.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Sem acessos registrados ainda.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porPagina} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="pagina"
                  width={130}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "rgba(10,14,24,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="acessos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white/70">
          Controle dos resultados de hoje ({today.split("-").reverse().join("/")})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {atrasados.map((a) => (
            <li
              key={a.type}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              {a.status === "recebido" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : a.status === "atrasado" ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Clock className="h-4 w-4 text-red-400" />
              )}
              <span className="font-bold">{a.label}</span>
              <span className="text-xs text-white/40">{a.value}</span>
              <span
                className={`ml-auto text-[10px] font-black uppercase ${
                  a.status === "recebido"
                    ? "text-emerald-400"
                    : a.status === "atrasado"
                      ? "text-destructive"
                      : "text-red-400"
                }`}
              >
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone = "text-foreground" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
