import { ArrowLeftRight, Clock, Timer, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DigitStat {
  side: "left" | "right";
  /** dezena com 2 casas, zero nunca cortado (ex.: 05) */
  digit: string;
  dezena?: string;
  currentDelay: number;
  avgDelay: number;
  medianDelay: number;
  maxDelay: number;
  minDelay: number;
  relativeIndex: number;
  classification: string;
  last: { date: string; time_type: string; time_value: string | null; ten: string | null; prize: string | null; position?: number } | null;
  freqs: Record<string, number>;
  scheduleDelay: Record<string, number>;
  scheduleFreq: Record<string, number>;
  worstSchedule: { schedule: string; delay: number; freq: number; total: number } | null;
}

export interface DigitDelayData {
  left: DigitStat[];
  right: DigitStat[];
  totalDraws: number;
  schedules: string[];
  period: { start: string | null; end: string | null } | null;
  daily: { date: string; draws: { time_type: string; time_value: string | null; ten: string; milhar?: string; left: string; right: string }[] }[];
}

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const classColor = (c: string) =>
  c === "Muito acima da média"
    ? "text-red-400 border-red-400/30 bg-red-500/10"
    : c === "Atraso elevado"
      ? "text-yellow-400 border-yellow-400/30 bg-yellow-500/10"
      : c === "Atraso baixo"
        ? "text-emerald-400 border-emerald-400/30 bg-emerald-500/10"
        : "text-white/60 border-white/10 bg-white/5";

function SideBlock({ title, subtitle, stats, schedules, accent }: {
  title: string;
  subtitle: string;
  stats: DigitStat[];
  schedules: string[];
  accent: string;
}) {
  const chartData = stats.slice(0, 12).map((s) => ({ digit: s.digit, atraso: s.currentDelay }));
  const listed = stats.slice(0, 10);
  const top = stats[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-black italic uppercase">{title}</h3>
          <p className="text-xs text-white/40 font-medium">{subtitle}</p>
        </div>
        {top && (
          <Badge variant="outline" className={`font-bold ${classColor(top.classification)}`}>
            Dezena mais atrasada: {top.digit} · {top.currentDelay} concursos
          </Badge>
        )}
      </div>

      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="digit" stroke="rgba(255,255,255,0.35)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: any) => [`${v} concursos sem sair`, "Atraso"]}
              />
              <Bar dataKey="atraso" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={d.digit} fill={i === 0 ? accent : "rgba(255,255,255,0.18)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        {listed.map((s, i) => (
          <Card key={s.digit} className="bg-[#0D121F] border-white/10 rounded-2xl p-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div
                className="w-16 h-14 rounded-xl flex items-center justify-center text-2xl font-black font-mono tracking-tight shrink-0"
                style={{ background: i === 0 ? accent : "rgba(255,255,255,0.06)", color: i === 0 ? "#0B0F19" : "#fff" }}
              >
                {s.digit}
              </div>

              <div className="flex-1 min-w-[220px] space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold">
                    {s.currentDelay} concursos sem sair
                  </span>
                  <Badge variant="outline" className={`text-[10px] font-bold ${classColor(s.classification)}`}>
                    {s.classification}
                  </Badge>
                  <span className="text-[10px] uppercase tracking-widest text-white/30">
                    índice {s.relativeIndex}
                  </span>
                </div>

                <div className="text-xs text-white/50 flex items-center gap-2 flex-wrap">
                  <Clock className="w-3.5 h-3.5" />
                  Última vez: {s.last ? `${fmt(s.last.date)} · ${s.last.time_type}${s.last.time_value ? ` (${s.last.time_value})` : ""} · ${s.last.position ?? 1}º prêmio ${s.last.prize} · dezena ${s.last.ten}` : "não apareceu na amostra"}
                </div>


                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-white/40">Médio</span> <b>{s.avgDelay}</b>
                  </div>
                  <div className="bg-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-white/40">Mediana</span> <b>{s.medianDelay}</b>
                  </div>
                  <div className="bg-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-white/40">Maior</span> <b>{s.maxDelay}</b>
                  </div>
                  <div className="bg-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-white/40">Freq. 100</span> <b>{s.freqs?.[100] ?? 0}</b>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {schedules.map((h) => {
                    const d = s.scheduleDelay?.[h] ?? 0;
                    const isWorst = s.worstSchedule?.schedule === h;
                    return (
                      <span
                        key={h}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                          isWorst ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-300" : "border-white/10 bg-white/5 text-white/50"
                        }`}
                        title={`${h}: ${d} sorteios sem sair`}
                      >
                        {h} · {d}
                      </span>
                    );
                  })}
                </div>

                {s.worstSchedule && (
                  <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <Timer className="w-3 h-3" />
                    Horário com maior atraso: <b className="text-white/70">{s.worstSchedule.schedule}</b> ({s.worstSchedule.delay} sorteios)
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DezenasEsquerdaDireita({ data, loading }: { data?: DigitDelayData | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-96 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  if (!data || data.totalDraws === 0) {
    return (
      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-8 text-center text-white/50">
        <AlertCircle className="w-6 h-6 mx-auto mb-3 text-yellow-400" />
        Aguardando resultados sincronizados para calcular os atrasos.
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-black italic uppercase">Dezena Esquerda x Direita</h2>
            <p className="text-xs text-white/40 font-medium">
              DEZENA = 2 casas (ex.: 25). Um número sozinho (5) é unidade. O milhar do 1º prêmio é lido com 4 casas
              (ex.: 0570) e dividido em dezena esquerda (05) e dezena direita (70). O zero nunca é cortado.
            </p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
          {data.totalDraws} concursos · {fmt(data.period?.start)} a {fmt(data.period?.end)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SideBlock
          title="Dezena Esquerda"
          subtitle="2 primeiras casas do milhar — ex.: 25 em 2570 · top 10 mais atrasadas"
          stats={data.left}
          schedules={data.schedules}
          accent="#EAB308"
        />
        <SideBlock
          title="Dezena Direita"
          subtitle="2 últimas casas do milhar — ex.: 70 em 2570 · top 10 mais atrasadas"
          stats={data.right}
          schedules={data.schedules}
          accent="#38BDF8"
        />
      </div>

      <Card className="bg-[#0D121F] border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4">
          Mapa diário — milhar do 1º prêmio dividido em dezena esquerda e direita
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/30">
                <th className="text-left py-2 pr-4">Dia</th>
                {data.schedules.map((h) => (
                  <th key={h} className="py-2 px-2 text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.daily.map((day) => (
                <tr key={day.date} className="border-t border-white/5">
                  <td className="py-2 pr-4 font-bold text-white/70 whitespace-nowrap">{fmt(day.date)}</td>
                  {data.schedules.map((h) => {
                    const d = day.draws.find((x) => String(x.time_type).toUpperCase() === h);
                    return (
                      <td key={h} className="py-2 px-2 text-center">
                        {d ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold">
                            <span className="text-yellow-400">{d.left}</span>
                            <span className="text-sky-400">{d.right}</span>
                          </span>
                        ) : (
                          <span className="text-white/15">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-white/30 mt-3">
          <span className="text-yellow-400 font-bold">Amarelo</span> = dezena esquerda (2 casas) ·{" "}
          <span className="text-sky-400 font-bold">Azul</span> = dezena direita (2 casas) — o zero nunca é cortado
        </p>
      </Card>
    </div>
  );
}
