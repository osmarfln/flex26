import { useMemo, useState } from "react";
import { Crown, Clock, Hash, Trophy } from "lucide-react";
import { getAnimalByGroup, getAnimalByTen } from "@/lib/animals";
import { IntelTabBar } from "@/components/IntelTabBar";
import type { FirstPrizeDelay, FirstPrizeRow } from "@/lib/first-prize-delay";

type View = "grupos" | "dezenas" | "horarios";

function fmt(dateISO: string | null) {
  if (!dateISO) return "--";
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}

const num = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "--" : v.toFixed(d);

function tone(row: FirstPrizeRow) {
  const i = row.delayIndex ?? 0;
  if (i >= 2.5) return "text-red-400";
  if (i >= 1.5) return "text-orange-300";
  if (i >= 0.75) return "text-sky-300";
  return "text-emerald-300";
}

/**
 * Ranking de atraso medido SOMENTE pelo 1º prêmio.
 * O grupo/dezena só sai da lista quando aparecer no 1º prêmio — enquanto isso
 * o atraso cresce resultado por resultado e a ordem permanece a mesma.
 */
export function FirstPrizeDelayPanel({
  data,
  title = "Grupos em Atraso — 1º prêmio",
}: {
  data: FirstPrizeDelay;
  title?: string;
}) {
  const [view, setView] = useState<View>("grupos");
  const faixas = data.faixas ?? [];

  const groups = useMemo(() => data.groups ?? [], [data]);
  const tens = useMemo(() => data.tens ?? [], [data]);
  const rows = view === "dezenas" ? tens : groups;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-white/70">
        <strong className="text-primary font-black uppercase">{title}: </strong>
        Identifica os grupos e bichos que ainda não vieram no 1º prêmio. O atraso é contado concurso a
        concurso sobre o histórico real ({data.totalContests} extrações sincronizadas) somado aos resultados do
        dia. Enquanto o grupo não sair no 1º prêmio, a sequência do ranking não muda.
        {data.lastContest && (
          <span className="block mt-1 text-white/50">
            Último 1º prêmio: {data.lastContest.firstPrize} · dezena {data.lastContest.ten} · grupo{" "}
            {data.lastContest.group} {getAnimalByGroup(data.lastContest.group)?.name ?? ""} · {fmt(data.lastContest.date)}
          </span>
        )}
      </div>

      <IntelTabBar
        active={view}
        onChange={(id) => setView(id as View)}
        tabs={[
          { id: "grupos", label: "Ranking geral de grupos (1º prêmio)" },
          { id: "dezenas", label: "Dezenas mais atrasadas (1º prêmio)" },
          { id: "horarios", label: "Logística horário a horário" },
        ]}
      />

      {view !== "horarios" && (
        <div className="dashboard-card p-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-[11px] uppercase text-white/40">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left">{view === "dezenas" ? "Dezena" : "Grupo"}</th>
                <th>Atraso (concursos)</th>
                <th>Atraso (dias)</th>
                <th>Ciclo médio</th>
                <th>Índice</th>
                <th>Maior ciclo</th>
                <th>Percentil</th>
                <th>Vezes no 1º</th>
                <th>Último 1º prêmio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.value} className="border-t border-white/5 text-center text-white/80">
                  <td className="text-left py-1 text-white/40">{i + 1}</td>
                  <td className="text-left font-black text-white">
                    {r.value}{" "}
                    <span className="text-white/60 font-bold">
                      {view === "dezenas"
                        ? getAnimalByTen(r.value)?.name ?? ""
                        : getAnimalByGroup(r.value)?.name ?? ""}
                    </span>
                  </td>
                  <td className={`font-black ${tone(r)}`}>{r.delay}</td>
                  <td>{r.daysDelay === null ? "--" : `${r.daysDelay}d`}</td>
                  <td>{num(r.avgInterval, 1)}</td>
                  <td className={tone(r)}>{num(r.delayIndex)}</td>
                  <td>{r.maxDelay}</td>
                  <td>{r.percentile}%</td>
                  <td>{r.occurrences}</td>
                  <td className="text-white/60">
                    {fmt(r.lastDate)} {r.lastTimeType ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "horarios" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {faixas.map((f) => {
              const topGroup = [...groups].sort(
                (a, b) => (b.byFaixa[f.timeType]?.delay ?? 0) - (a.byFaixa[f.timeType]?.delay ?? 0),
              )[0];
              const topTen = [...tens].sort(
                (a, b) => (b.byFaixa[f.timeType]?.delay ?? 0) - (a.byFaixa[f.timeType]?.delay ?? 0),
              )[0];
              return (
                <div key={f.timeType} className="dashboard-card p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-white/60">
                    <Clock className="w-3.5 h-3.5" /> {f.label} · {f.editions} extrações
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-white/40">Grupo mais atrasado</p>
                      <p className="font-black text-white">
                        {topGroup ? `${topGroup.value} ${getAnimalByGroup(topGroup.value)?.name ?? ""}` : "--"}
                      </p>
                      <p className="text-xs text-white/50">
                        {topGroup ? `${topGroup.byFaixa[f.timeType]?.delay ?? 0} extrações sem 1º prêmio` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-white/40">Dezena mais atrasada</p>
                      <p className="font-black text-white">
                        {topTen ? `${topTen.value} ${getAnimalByTen(topTen.value)?.name ?? ""}` : "--"}
                      </p>
                      <p className="text-xs text-white/50">
                        {topTen ? `${topTen.byFaixa[f.timeType]?.delay ?? 0} extrações sem 1º prêmio` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dashboard-card p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="text-[11px] uppercase text-white/40">
                <tr>
                  <th className="text-left py-2">Grupo</th>
                  <th>Geral</th>
                  {faixas.map((f) => (
                    <th key={f.timeType}>{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.value} className="border-t border-white/5 text-center text-white/80">
                    <td className="text-left py-1 font-black text-white">
                      {g.value} <span className="text-white/60">{getAnimalByGroup(g.value)?.name ?? ""}</span>
                    </td>
                    <td className={`font-black ${tone(g)}`}>{g.delay}</td>
                    {faixas.map((f) => (
                      <td key={f.timeType}>{g.byFaixa[f.timeType]?.delay ?? "--"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-white/35">
        <span className="flex items-center gap-1">
          <Crown className="w-3 h-3" /> somente 1º prêmio
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="w-3 h-3" /> zera apenas quando sair no 1º
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" /> histórico + resultados do dia, sem dados simulados
        </span>
      </div>
    </div>
  );
}
