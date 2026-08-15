import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, subDays } from "date-fns";
import { ArrowDown, ArrowUp, Filter, Loader2, Minus, Search, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getResultsRange, type LotteryResult } from "@/lib/lottery.functions";
import { DRAW_SCHEDULE } from "@/lib/draw-order";
import { ANIMAL_GROUPS, ANIMAL_GROUPS_MAP, getAnimalByTen, getGroupFromTen } from "@/lib/animals";

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#0D121F",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "rgba(255,255,255,0.5)" },
};

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** true quando a string é uma data ISO real (evita valores parciais dos inputs type="date"). */
function isValidISO(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const year = Number(s.slice(0, 4));
  return year >= 2000 && year <= 2100;
}


type SearchQuery =
  | { kind: "none" }
  | { kind: "dezena" | "centena" | "milhar"; value: string; label: string }
  | { kind: "grupo"; value: string; label: string };

/** Interpreta o termo digitado: 2 dígitos = dezena, 3 = centena, 4 = milhar, texto = bicho/grupo. */
function parseTerm(raw: string): SearchQuery {
  const t = raw.trim().toLowerCase();
  if (!t) return { kind: "none" };

  const groupWord = /^(grupo|bicho)\s*(.+)$/.exec(t);
  const core = groupWord ? (groupWord[2] ?? "").trim() : t;
  const digits = core.replace(/\D/g, "");

  if (digits && digits.length === core.length) {
    if (groupWord || digits.length === 1) {
      const n = parseInt(digits, 10);
      if (n >= 1 && n <= 25) {
        const id = String(n).padStart(2, "0");
        const animal = ANIMAL_GROUPS_MAP[id];
        return { kind: "grupo", value: id, label: `Grupo ${id} · ${animal?.name ?? ""}` };
      }
    }
    if (digits.length === 2) return { kind: "dezena", value: digits, label: `Dezena ${digits}` };
    if (digits.length === 3) return { kind: "centena", value: digits, label: `Centena ${digits}` };
    if (digits.length >= 4) {
      const v = digits.slice(-4);
      return { kind: "milhar", value: v, label: `Milhar ${v}` };
    }
    return { kind: "none" };
  }

  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const animal = ANIMAL_GROUPS.find((a) => norm(a.name.toLowerCase()).startsWith(norm(core)));
  if (animal) return { kind: "grupo", value: animal.id, label: `Grupo ${animal.id} · ${animal.name}` };

  return { kind: "none" };
}

/** Retorna as posições (1º ao 5º) em que o termo pesquisado apareceu. */
function matchPositions(r: LotteryResult, q: SearchQuery): number[] {
  const prizes = (r.results ?? []).slice(0, 5);
  if (q.kind === "none") return [];
  const hits: number[] = [];
  prizes.forEach((raw, i) => {
    const prize = (raw ?? "").replace(/\D/g, "");
    if (!prize) return;
    const ten = prize.slice(-2).padStart(2, "0");
    const ok =
      q.kind === "dezena"
        ? ten === q.value
        : q.kind === "centena"
          ? prize.slice(-3).padStart(3, "0") === q.value
          : q.kind === "milhar"
            ? prize.slice(-4).padStart(4, "0") === q.value
            : getGroupFromTen(ten) === q.value;
    if (ok) hits.push(i + 1);
  });
  return hits;
}



function summarize(rows: LotteryResult[]) {
  const tenCounts: Record<string, number> = {};
  const groupCounts: Record<string, number> = {};
  rows.forEach((r) => {
    const first = r.results?.[0];
    if (first && first.length >= 2) {
      const ten = first.slice(-2);
      tenCounts[ten] = (tenCounts[ten] ?? 0) + 1;
      const animal = getAnimalByTen(ten);
      if (animal) groupCounts[animal.name] = (groupCounts[animal.name] ?? 0) + 1;
    }
  });
  const topTen = Object.entries(tenCounts).sort((a, b) => b[1] - a[1])[0];
  const topGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    total: rows.length,
    uniqueTens: Object.keys(tenCounts).length,
    days: new Set(rows.map((r) => r.date)).size,
    topTen: topTen ? { value: topTen[0], count: topTen[1] } : null,
    topGroup: topGroup ? { value: topGroup[0], count: topGroup[1] } : null,
    tenCounts,
  };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus;
  const color = diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-white/40";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black ${color}`}>
      <Icon className="h-3 w-3" />
      {diff > 0 ? "+" : ""}
      {diff}
    </span>
  );
}

/** Filtros e busca das Análises: período, horário e tipo, com comparação de períodos. */
export function AnaliseFiltros() {
  const today = new Date();
  const [start, setStart] = useState(iso(today));
  const [end, setEnd] = useState(iso(today));
  const [times, setTimes] = useState<string[]>([]);
  const [term, setTerm] = useState("");
  const [compare, setCompare] = useState(false);

  const fetchRange = useServerFn(getResultsRange);

  const spanDays = useMemo(() => {
    const ms = new Date(end + "T12:00:00").getTime() - new Date(start + "T12:00:00").getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }, [start, end]);

  const prevStart = iso(subDays(new Date(start + "T12:00:00"), spanDays));
  const prevEnd = iso(subDays(new Date(start + "T12:00:00"), 1));

  const currentQuery = useQuery({
    queryKey: ["analise-filtro", start, end, times],
    queryFn: () => fetchRange({ data: { start, end, timeTypes: times, limit: 2000 } }),
    staleTime: 0,
    gcTime: 0,
  });

  const previousQuery = useQuery({
    queryKey: ["analise-filtro-prev", prevStart, prevEnd, times],
    enabled: compare,
    queryFn: () =>
      fetchRange({ data: { start: prevStart, end: prevEnd, timeTypes: times, limit: 2000 } }),
    staleTime: 0,
    gcTime: 0,
  });

  const query = useMemo(() => parseTerm(term), [term]);
  const invalidTerm = term.trim().length > 0 && query.kind === "none";

  const currentRows = useMemo(
    () =>
      query.kind === "none"
        ? (currentQuery.data ?? [])
        : (currentQuery.data ?? []).filter((r) => matchPositions(r, query).length > 0),
    [currentQuery.data, query],
  );
  const previousRows = useMemo(
    () =>
      query.kind === "none"
        ? (previousQuery.data ?? [])
        : (previousQuery.data ?? []).filter((r) => matchPositions(r, query).length > 0),
    [previousQuery.data, query],
  );

  /** Cada aparição do termo, com posição do prêmio (1º ao 5º). */
  const hits = useMemo(() => {
    const list: { row: LotteryResult; pos: number; prize: string; ten: string }[] = [];
    currentRows.forEach((r) => {
      const positions = query.kind === "none" ? [1] : matchPositions(r, query);
      positions.forEach((pos) => {
        const prize = (r.results?.[pos - 1] ?? "").replace(/\D/g, "");
        list.push({ row: r, pos, prize, ten: prize.slice(-2).padStart(2, "0") });
      });
    });
    return list;
  }, [currentRows, query]);

  const byPosition = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map((p) => ({
      pos: p,
      count: hits.filter((h) => h.pos === p).length,
    }));
    return counts;
  }, [hits]);


  /** Bicho relacionado ao termo e a dezena que mais saiu dentro desse bicho no período. */
  const focus = useMemo(() => {
    if (query.kind === "none") return null;
    const groupId =
      query.kind === "grupo"
        ? query.value
        : getGroupFromTen(
            (query.kind === "dezena" ? query.value : query.value.slice(-2)).padStart(2, "0"),
          );
    const animal = ANIMAL_GROUPS_MAP[groupId];
    if (!animal) return null;
    const occurrences: { time_type: string; ten: string }[] = [];
    (currentQuery.data ?? []).forEach((r) => {
      (r.results ?? []).slice(0, 5).forEach((raw) => {
        const ten = (raw ?? "").replace(/\D/g, "").slice(-2).padStart(2, "0");
        if (ten.length === 2 && getGroupFromTen(ten) === groupId) {
          occurrences.push({ time_type: r.time_type, ten });
        }
      });
    });
    const counts: Record<string, number> = {};
    occurrences.forEach((o) => {
      counts[o.ten] = (counts[o.ten] ?? 0) + 1;
    });
    const ranking = animal.dezenas.map((d) => ({ dezena: d, count: counts[d] ?? 0 }));
    const top = [...ranking].sort((a, b) => b.count - a.count)[0];
    const byTimeCounts: Record<string, number> = {};
    occurrences.forEach((o) => {
      byTimeCounts[o.time_type] = (byTimeCounts[o.time_type] ?? 0) + 1;
    });
    const topTime = Object.entries(byTimeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      animal,
      total: occurrences.length,
      ranking,
      top: top && top.count > 0 ? top : null,
      topTime: topTime ? { time: topTime[0], count: topTime[1] } : null,
    };
  }, [query, currentQuery.data]);

  const cur = useMemo(() => summarize(currentRows), [currentRows]);
  const prev = useMemo(() => summarize(previousRows), [previousRows]);


  const byTime = useMemo(() => {
    const counts: Record<string, { name: string; atual: number; anterior: number }> = {};
    DRAW_SCHEDULE.forEach((s) => {
      counts[s.timeType] = { name: s.timeType, atual: 0, anterior: 0 };
    });
    currentRows.forEach((r) => {
      const e = counts[r.time_type] ?? (counts[r.time_type] = { name: r.time_type, atual: 0, anterior: 0 });
      e.atual += 1;
    });
    previousRows.forEach((r) => {
      const e = counts[r.time_type] ?? (counts[r.time_type] = { name: r.time_type, atual: 0, anterior: 0 });
      e.anterior += 1;
    });
    return Object.values(counts);
  }, [currentRows, previousRows]);

  const toggleTime = (t: string) =>
    setTimes((old) => (old.includes(t) ? old.filter((x) => x !== t) : [...old, t]));

  const loading = currentQuery.isLoading || (compare && previousQuery.isLoading);

  return (
    <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5">
          <Filter className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight">Filtros e busca das análises</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Data, horário e tipo — com comparação entre períodos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">De</span>
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold outline-none focus:border-primary/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Até</span>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold outline-none focus:border-primary/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Buscar por dezena (2), centena (3), milhar (4), grupo ou bicho
          </span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Ex.: 45, 345, 2345, Elefante, grupo 12"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm font-bold outline-none focus:border-primary/50"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </span>
          {invalidTerm ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
              Busca inválida — use 2, 3 ou 4 dígitos, nome do bicho ou "grupo 12"
            </span>
          ) : query.kind !== "none" ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Filtrando por {query.label} — todas as posições (1º ao 5º)
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
              Dados zerados — ative a busca para processar os resultados
            </span>
          )}
        </label>
      </div>


      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Horários:</span>
        {DRAW_SCHEDULE.map((s) => {
          const active = times.includes(s.timeType);
          return (
            <button
              key={s.timeType}
              type="button"
              onClick={() => toggleTime(s.timeType)}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase transition-all ${
                active
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {s.timeType} {s.timeValue}
            </button>
          );
        })}
        {times.length > 0 && (
          <button
            type="button"
            onClick={() => setTimes([])}
            className="text-[10px] font-black uppercase text-white/40 underline hover:text-white"
          >
            Todos
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase text-white/50">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="h-3.5 w-3.5 accent-yellow-500"
          />
          Comparar com período anterior
        </label>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando resultados do período...
        </div>
      ) : query.kind === "none" && times.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <Search className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="text-lg font-black uppercase italic text-white/60">Análise aguardando</h3>
          <p className="max-w-xs text-xs font-medium text-white/30">
            Digite uma dezena, centena, milhar ou bicho na busca acima para visualizar as estatísticas e resultados.
          </p>
        </div>
      ) : (
        <>
          {focus && (
            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl">{focus.animal.icon}</span>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">
                    Grupo {focus.animal.id} · {focus.animal.name}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    {focus.total} sorteios do bicho no período
                    {focus.topTime ? ` · horário mais forte: ${focus.topTime.time} (${focus.topTime.count}x)` : ""}
                  </p>
                </div>
                {focus.top && (
                  <div className="ml-auto rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      Dezena destaque do bicho
                    </p>
                    <p className="text-xl font-black text-primary">
                      {focus.top.dezena} · {focus.top.count}x
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {focus.ranking.map((d) => (
                  <span
                    key={d.dezena}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${
                      focus.top && d.dezena === focus.top.dezena
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    {d.dezena} · {d.count}x
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sorteios</p>
              <p className="text-2xl font-black">{cur.total}</p>
              {compare && <Delta current={cur.total} previous={prev.total} />}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Dias com dados</p>
              <p className="text-2xl font-black">{cur.days}</p>
              {compare && <Delta current={cur.days} previous={prev.days} />}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Dezenas distintas</p>
              <p className="text-2xl font-black">{cur.uniqueTens}</p>
              {compare && <Delta current={cur.uniqueTens} previous={prev.uniqueTens} />}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Destaque no 1º prêmio</p>
              <p className="text-2xl font-black text-primary">{cur.topTen?.value ?? "—"}</p>
              <p className="text-[11px] font-bold text-white/50">
                {cur.topGroup ? `${cur.topGroup.value} · ${cur.topGroup.count}x` : "Sem dados"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                Sorteios por horário {compare ? "(atual x anterior)" : ""}
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Bar dataKey="atual" fill="#EAB308" radius={[6, 6, 0, 0]} />
                    {compare && <Bar dataKey="anterior" fill="rgba(255,255,255,0.25)" radius={[6, 6, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {compare && (
                <p className="mt-2 text-[10px] font-bold uppercase text-white/40">
                  Período anterior: {prevStart} → {prevEnd}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                Resultados filtrados ({hits.length} {query.kind === "none" ? "sorteios" : "aparições"})
              </p>
              {query.kind !== "none" && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {byPosition.map((p) => (
                    <span
                      key={p.pos}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                        p.pos === 1
                          ? "border-red-500/40 bg-red-500/10 text-red-400"
                          : "border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      {p.pos}º · {p.count}x
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-56 overflow-auto pr-1">
                {hits.length === 0 ? (
                  <p className="py-8 text-center text-sm font-bold text-white/40">
                    Nenhum resultado para esses filtros.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#0D121F] text-[10px] uppercase text-white/40">
                      <tr>
                        <th className="py-2">Data</th>
                        <th>Horário</th>
                        <th>Prêmio</th>
                        <th>Número</th>
                        <th>Bicho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hits.slice(0, 300).map((h, i) => {
                        const first = h.pos === 1;
                        return (
                          <tr
                            key={`${h.row.date}-${h.row.time_type}-${h.pos}-${i}`}
                            className={`border-t border-white/5 ${first ? "bg-red-500/[0.07]" : ""}`}
                          >
                            <td className="py-1.5 font-bold">
                              {new Date(h.row.date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td className="font-black text-primary">{h.row.time_type}</td>
                            <td className={`font-black ${first ? "text-red-400" : "text-white/50"}`}>
                              {h.pos}º
                            </td>
                            <td className={`font-mono ${first ? "font-black text-red-400" : ""}`}>
                              {h.prize || "—"}
                            </td>
                            <td className={first ? "font-bold text-red-400" : "text-white/60"}>
                              {getAnimalByTen(h.ten)?.name ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </section>
  );
}
