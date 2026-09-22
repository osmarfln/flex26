import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGameLabStats } from "@/lib/games-stats.functions";
import { IntelTabBar } from "@/components/IntelTabBar";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type View = "dezenas" | "paridade" | "somas" | "combinacoes" | "lados";

const TABS: { id: View; label: string }[] = [
  { id: "dezenas", label: "Dezenas mais sorteadas" },
  { id: "paridade", label: "Pares x Ímpares" },
  { id: "somas", label: "Somas" },
  { id: "combinacoes", label: "Combinações" },
  { id: "lados", label: "Esquerda x Direita" },
];

export function JogosStatsPanel({ location }: { location: "rio" | "capital" | "federal" }) {
  const [view, setView] = useState<View>("dezenas");
  const { data, isLoading } = useQuery({
    queryKey: ["game-lab", location],
    queryFn: () => getGameLabStats({ data: { location } }),
    staleTime: 0,
  });

  const topTens = useMemo(() => (data?.tens ?? []).slice(0, 20), [data]);

  if (isLoading) {
    return (
      <div className="dashboard-card p-10 flex items-center justify-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" /> Calculando com o histórico real...
      </div>
    );
  }
  if (!data || data.totalDraws === 0) {
    return <div className="dashboard-card p-8 text-white/60">Sem resultados sincronizados para esta loteria.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black italic uppercase text-zinc-300">Jogos — Laboratório de Dezenas</h2>
        <span className="text-xs text-white/50">
          {data.totalDraws} extrações · {data.totalTens} dezenas analisadas
        </span>
      </div>

      <IntelTabBar tabs={TABS} active={view} onChange={setView} />

      {view === "dezenas" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="dashboard-card p-5">
            <h3 className="text-sm uppercase font-bold text-white/60 mb-4">Top 20 dezenas</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTens}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                  <XAxis dataKey="ten" tick={{ fontSize: 11, fill: "#ffffff80" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#ffffff80" }} />
                  <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid #ffffff20" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dashboard-card p-5 space-y-2 max-h-[22rem] overflow-y-auto">
            <h3 className="text-sm uppercase font-bold text-white/60 mb-2">Ranking completo</h3>
            {data.tens.slice(0, 40).map((t, i) => (
              <div key={t.ten} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-white/40 w-6">{i + 1}º</span>
                  <span className="font-black tabular-nums">{t.ten}</span>
                  <span className="text-white/60">{t.animal}</span>
                </span>
                <span className="text-xs text-white/60">
                  {t.count}x · {t.percent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div className="dashboard-card p-5 lg:col-span-2">
            <h3 className="text-sm uppercase font-bold text-white/60 mb-3">Dezenas menos sorteadas (frias)</h3>
            <div className="flex flex-wrap gap-2">
              {data.coldTens.map((t) => (
                <span key={t.ten} className="rounded-lg bg-sky-500/10 text-sky-300 px-3 py-1.5 text-sm">
                  <b className="tabular-nums">{t.ten}</b> · {t.animal} · {t.count}x
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "paridade" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="dashboard-card p-6">
            <p className="text-xs uppercase text-white/50">Dezenas pares</p>
            <p className="text-4xl font-black text-emerald-400">{data.parity.evenPercent.toFixed(1)}%</p>
            <p className="text-sm text-white/50">{data.parity.even} ocorrências</p>
          </div>
          <div className="dashboard-card p-6">
            <p className="text-xs uppercase text-white/50">Dezenas ímpares</p>
            <p className="text-4xl font-black text-red-400">{data.parity.oddPercent.toFixed(1)}%</p>
            <p className="text-sm text-white/50">{data.parity.odd} ocorrências</p>
          </div>
        </div>
      )}

      {view === "somas" && (
        <div className="dashboard-card p-5">
          <h3 className="text-sm uppercase font-bold text-white/60 mb-4">Soma dos dígitos da dezena (0 a 18)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sums}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis dataKey="sum" tick={{ fontSize: 11, fill: "#ffffff80" }} />
                <YAxis tick={{ fontSize: 11, fill: "#ffffff80" }} />
                <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid #ffffff20" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.sums.map((s) => (
                    <Cell key={s.sum} fill="#38bdf8" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "combinacoes" && (
        <div className="dashboard-card p-5 space-y-2">
          <h3 className="text-sm uppercase font-bold text-white/60 mb-2">Combinações de dezenas no mesmo resultado</h3>
          {data.combos.map((c) => (
            <div key={`${c.a}-${c.b}`} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>
                <b className="tabular-nums">{c.a}</b> <span className="text-white/50">{c.animalA}</span>
                <span className="text-white/30 mx-2">+</span>
                <b className="tabular-nums">{c.b}</b> <span className="text-white/50">{c.animalB}</span>
              </span>
              <span className="text-xs text-white/60">
                {c.count}x · {c.percent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {view === "lados" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Dezena esquerda (dígito da frente)", rows: data.left, color: "#a78bfa" },
            { title: "Dezena direita (dígito final)", rows: data.right, color: "#34d399" },
          ].map((block) => (
            <div key={block.title} className="dashboard-card p-5">
              <h3 className="text-sm uppercase font-bold text-white/60 mb-4">{block.title}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={block.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                    <XAxis dataKey="digit" tick={{ fontSize: 11, fill: "#ffffff80" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#ffffff80" }} />
                    <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid #ffffff20" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={block.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
