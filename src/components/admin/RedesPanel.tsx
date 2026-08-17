import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { Activity, Radio, Signal, Wifi, WifiOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { pingServer } from "@/lib/admin.functions";

type Sample = { t: string; servidor: number; banco: number };

const MAX = 30;

/** Monitor de rede interna: latência do servidor e do banco em tempo real. */
export function RedesPanel() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [realtime, setRealtime] = useState<"conectando" | "online" | "offline">("conectando");
  const [failures, setFailures] = useState(0);
  const ping = useServerFn(pingServer);
  const running = useRef(true);

  useEffect(() => {
    const channel = supabase
      .channel("admin-network-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_results" }, () => {})
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtime("online");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
          setRealtime("offline");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    running.current = true;

    const measure = async () => {
      const t0 = performance.now();
      let servidor = -1;
      try {
        await ping({});
        servidor = Math.round(performance.now() - t0);
      } catch {
        setFailures((f) => f + 1);
      }

      const t1 = performance.now();
      let banco = -1;
      try {
        await supabase.from("lottery_results").select("id", { count: "exact", head: true }).limit(1);
        banco = Math.round(performance.now() - t1);
      } catch {
        setFailures((f) => f + 1);
      }

      if (!running.current) return;
      const t = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false,
      });
      setSamples((prev) =>
        [...prev, { t, servidor: Math.max(servidor, 0), banco: Math.max(banco, 0) }].slice(-MAX),
      );
    };

    void measure();
    const id = window.setInterval(measure, 4000);
    return () => {
      running.current = false;
      window.clearInterval(id);
    };
  }, [ping]);

  const last = samples[samples.length - 1];
  const avg = (key: "servidor" | "banco") =>
    samples.length ? Math.round(samples.reduce((s, x) => s + x[key], 0) / samples.length) : 0;
  const jitter = (() => {
    if (samples.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < samples.length; i++)
      sum += Math.abs(samples[i]!.servidor - samples[i - 1]!.servidor);
    return Math.round(sum / (samples.length - 1));
  })();

  const quality =
    !last || last.servidor === 0
      ? { label: "Medindo", cls: "text-white/50" }
      : last.servidor < 200
        ? { label: "Excelente", cls: "text-emerald-400" }
        : last.servidor < 600
          ? { label: "Boa", cls: "text-yellow-400" }
          : { label: "Instável", cls: "text-destructive" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <NetKpi
          icon={Signal}
          label="Latência servidor"
          value={`${last?.servidor ?? 0} ms`}
          tone={quality.cls}
        />
        <NetKpi icon={Activity} label="Latência banco" value={`${last?.banco ?? 0} ms`} />
        <NetKpi icon={Radio} label="Jitter (variação)" value={`${jitter} ms`} />
        <NetKpi
          icon={realtime === "online" ? Wifi : WifiOff}
          label="Canal tempo real"
          value={realtime === "online" ? "Online" : realtime === "offline" ? "Offline" : "..."}
          tone={
            realtime === "online"
              ? "text-emerald-400"
              : realtime === "offline"
                ? "text-destructive"
                : "text-white/50"
          }
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-white/70">
            Latência da rede interna — ao vivo
          </h2>
          <span className={`text-xs font-bold ${quality.cls}`}>
            Qualidade: {quality.label} · média {avg("servidor")} ms · falhas {failures}
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={samples}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} unit="ms" width={48} />
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
                dataKey="servidor"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="banco"
                stroke="#34d399"
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
          Comparativo por amostra (barras)
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={samples.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} minTickGap={16} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} unit="ms" width={48} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "rgba(10,14,24,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="servidor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="banco" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function NetKpi({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
