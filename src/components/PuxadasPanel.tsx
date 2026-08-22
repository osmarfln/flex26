import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Network, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface PuxadaTarget { id: string; name: string; icon: string; count: number }
interface PuxadaRow {
  groupId: string;
  name: string;
  icon: string;
  puxa: { id: string; name: string; icon: string }[];
  occurrences: number;
  hits: number;
  hitRate: number;
  byTarget: PuxadaTarget[];
  bySchedule: { schedule: string; occurrences: number; hits: number; rate: number }[];
  lastOccurrence: {
    date: string; time_type: string; time_value: string | null; ten: string | null;
    nextGroup: string | null; nextDate: string; nextTime: string; hit: boolean;
  } | null;
}
export interface PuxadasData {
  totalDraws: number;
  period: { start: string | null; end: string | null } | null;
  schedules: string[];
  table: PuxadaRow[];
}

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function PuxadasPanel({ data, loading }: { data?: PuxadasData | null; loading?: boolean }) {
  const [selected, setSelected] = useState<string>("01");

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-96 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  if (!data || !data.table?.length) {
    return (
      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-8 text-center text-white/50">
        <AlertCircle className="w-6 h-6 mx-auto mb-3 text-yellow-400" />
        Aguardando resultados sincronizados para calcular as puxadas.
      </Card>
    );
  }

  const current = data.table.find((t) => t.groupId === selected) ?? data.table[0]!;
  const targetChart = current.byTarget.map((t) => ({ name: t.name, valor: t.count }));
  const scheduleChart = current.bySchedule.map((s) => ({ name: s.schedule, taxa: s.rate, saidas: s.occurrences }));
  const ranking = [...data.table].sort((a, b) => b.hitRate - a.hitRate).slice(0, 10)
    .map((r) => ({ name: `${r.groupId} ${r.name}`, taxa: r.hitRate }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-black italic uppercase">Tabela de Puxadas Tradicional</h2>
            <p className="text-xs text-white/40 font-medium">
              O que cada bicho puxa seguindo a logística tradicional cruzada com estatísticas reais.
            </p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
          {data.totalDraws} concursos · {fmt(data.period?.start)} a {fmt(data.period?.end)}
        </div>
      </div>

      {/* Seletor de bicho */}
      <div className="flex flex-wrap gap-2">
        {data.table.map((row) => (
          <button
            key={row.groupId}
            onClick={() => setSelected(row.groupId)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              selected === row.groupId
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-white/50 hover:border-primary/30"
            }`}
          >
            <span className="mr-1">{row.icon}</span>{row.groupId} {row.name}
          </button>
        ))}
      </div>

      {/* Detalhe do bicho selecionado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{current.icon}</span>
            <div>
              <h3 className="text-xl font-black italic uppercase">{current.groupId} — {current.name}</h3>
              <p className="text-xs text-white/40">
                {current.occurrences} saídas no 1º prêmio · {current.hits} puxadas confirmadas
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-primary">{current.hitRate}%</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">taxa de confirmação</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {current.puxa.map((t) => (
              <Badge key={t.id + t.name} variant="outline" className="border-white/10 bg-white/5 text-white/70 font-bold">
                {t.icon} {t.id} {t.name}
              </Badge>
            ))}
          </div>

          {current.lastOccurrence && (
            <div className="text-xs text-white/50 bg-white/5 rounded-xl p-3 leading-relaxed">
              Última saída: <b className="text-white/80">{fmt(current.lastOccurrence.date)} · {current.lastOccurrence.time_type}</b> (dezena {current.lastOccurrence.ten})
              <div className="flex items-center gap-1 mt-1">
                <ArrowRight className="w-3 h-3" />
                Próximo sorteio ({current.lastOccurrence.nextTime}):{" "}
                <b className={current.lastOccurrence.hit ? "text-emerald-400" : "text-yellow-400"}>
                  grupo {current.lastOccurrence.nextGroup ?? "—"} {current.lastOccurrence.hit ? "· puxada confirmada" : "· não confirmou"}
                </b>
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Puxadas confirmadas por bicho</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetChart} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={11} />
                <YAxis type="category" dataKey="name" width={80} stroke="rgba(255,255,255,0.35)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="valor" fill="#EAB308" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Confirmação por horário (%)</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scheduleChart} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(v) => [`${v}%`, "Confirmação"]}
                  labelFormatter={(l) => `Horário ${l}`}
                />
                <Bar dataKey="taxa" radius={[6, 6, 0, 0]}>
                  {scheduleChart.map((s, i) => (
                    <Cell key={i} fill={s.taxa >= 40 ? "#34D399" : s.taxa >= 20 ? "#FACC15" : "#38BDF8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Horário a horário do bicho selecionado */}
      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">
          {current.name} — horário por horário
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {current.bySchedule.map((s) => (
            <div key={s.schedule} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">{s.schedule}</p>
              <p className="text-xl font-black text-primary">{s.rate}%</p>
              <p className="text-[10px] text-white/40">{s.hits}/{s.occurrences} saídas</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Ranking geral */}
      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Top 10 bichos com puxada mais confiável</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Bar dataKey="taxa" radius={[6, 6, 0, 0]}>
                {ranking.map((r, i) => (
                  <Cell key={r.name} fill={i === 0 ? "#EAB308" : "rgba(255,255,255,0.2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabela completa 01 a 25 */}
      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Tabela completa de puxadas (01 a 25)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/30">
                <th className="text-left py-2 pr-3">Grupo</th>
                <th className="text-left py-2 pr-3">Puxa</th>
                <th className="text-center py-2 px-2">Saídas</th>
                <th className="text-center py-2 px-2">Confirmadas</th>
                <th className="text-center py-2 px-2">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {data.table.map((row) => (
                <tr
                  key={row.groupId}
                  onClick={() => setSelected(row.groupId)}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${selected === row.groupId ? "bg-primary/5" : ""}`}
                >
                  <td className="py-2 pr-3 font-bold whitespace-nowrap">
                    {row.icon} {row.groupId} – {row.name}
                  </td>
                  <td className="py-2 pr-3 text-white/60">
                    {row.puxa.map((t) => t.name).join(" – ")}
                  </td>
                  <td className="py-2 px-2 text-center text-white/60">{row.occurrences}</td>
                  <td className="py-2 px-2 text-center text-white/60">{row.hits}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`font-black ${row.hitRate >= 40 ? "text-emerald-400" : row.hitRate >= 20 ? "text-yellow-400" : "text-white/50"}`}>
                      {row.hitRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
