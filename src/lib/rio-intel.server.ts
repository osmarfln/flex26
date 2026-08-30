import { supabase } from "@/integrations/supabase/client";
import {
  type Contest,
  type PositionFilter,
  type TenRow,
  backtest,
  computeIntel,
  frequencyByPosition,
  groupOfTen,
  normalizePrize,
  tensOfGroup,
} from "./federal-intel.server";
import { DRAW_SCHEDULE_CAPITAL, DRAW_SCHEDULE_RIO, drawLabel, getNextDraw } from "./draw-order";

/**
 * Inteligência estatística das abas ANÁLISE RIO e CAPITAL & LCAP.
 * Usa SOMENTE o histórico já armazenado (lottery_results), medindo atraso em
 * resultados confirmados e frequência esperada por prêmio analisado.
 */

export type IntelLocation = "rio" | "capital";
export type RioFaixa = "all" | string; // "all" ou time_type

export interface RioIntelInput {
  location?: IntelLocation;
  position?: PositionFilter;
  faixa?: RioFaixa;
  window?: number; // últimos N resultados (0 = todo o histórico)
  days?: number; // últimos N dias (0 = ignorar)
  dateStart?: string;
  dateEnd?: string;
  topN?: number;
}

export function scheduleFor(location: IntelLocation) {
  return location === "capital" ? DRAW_SCHEDULE_CAPITAL : DRAW_SCHEDULE_RIO;
}

export const RIO_FAIXAS = DRAW_SCHEDULE_RIO.map((s) => ({
  timeType: s.timeType,
  label: s.label,
  timeValue: s.timeValue,
}));


function classify(index: number | null): string {
  if (index === null) return "sem dados";
  if (index < 0.75) return "atraso baixo";
  if (index < 1.5) return "atraso normal";
  if (index < 2.5) return "atraso elevado";
  return "atraso muito elevado";
}

function scoreLabel(score: number): string {
  if (score < 40) return "baixa relevância estatística";
  if (score < 60) return "relevância moderada";
  if (score < 75) return "relevância elevada";
  return "destaque estatístico";
}

function normalize(values: number[]): (v: number) => number {
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const cap = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]! : 1;
  const max = cap && cap > 0 ? cap : 1;
  return (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
}

/** Lê o histórico do Rio já armazenado (mais recente primeiro), sem duplicidade. */
export async function loadRioContests(dateStart?: string, dateEnd?: string): Promise<Contest[]> {
  let q = supabase
    .from("lottery_results")
    .select("date, time_type, time_value, results")
    .eq("location", "rio")
    .order("date", { ascending: false })
    .limit(6000);
  if (dateStart) q = q.gte("date", dateStart);
  if (dateEnd) q = q.lte("date", dateEnd);
  const { data, error } = await q;
  if (error) throw error;

  const order = new Map(DRAW_SCHEDULE_RIO.map((s, i) => [s.timeType, i] as const));
  const seen = new Set<string>();
  const out: Contest[] = [];
  for (const r of data ?? []) {
    const key = `${r.date}|${r.time_type}`;
    if (seen.has(key)) continue; // identificação única: data + tipo do resultado
    const prizes = ((r.results as string[]) ?? []).filter((p) => String(p ?? "").replace(/\D/g, "").length > 0);
    if (prizes.length < 5) continue; // resultado incompleto/aguardando não gera atraso
    seen.add(key);
    out.push({
      date: String(r.date),
      time_type: String(r.time_type),
      time_value: r.time_value ?? null,
      weekday: new Date(`${r.date}T12:00:00`).getDay(),
      prizes: prizes.slice(0, 5),
    });
  }
  // ordena por data desc + horário oficial desc (mais recente primeiro)
  out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (order.get(b.time_type) ?? -1) - (order.get(a.time_type) ?? -1);
  });
  return out;
}

/** Atraso por faixa: quantas edições daquela faixa ocorreram desde a última aparição. */
function delaysByFaixa(all: Contest[], position: PositionFilter) {
  const result = new Map<string, { tens: Map<string, number>; groups: Map<string, number>; editions: number }>();
  for (const s of DRAW_SCHEDULE_RIO) {
    const list = all.filter((c) => c.time_type === s.timeType);
    const tens = new Map<string, number>();
    const groups = new Map<string, number>();
    list.forEach((c, idx) => {
      const prizes = position === 0 ? c.prizes : [c.prizes[position - 1] ?? ""];
      for (const p of prizes.filter(Boolean)) {
        const { dezena, grupo } = normalizePrize(p);
        if (!tens.has(dezena)) tens.set(dezena, idx);
        if (!groups.has(grupo)) groups.set(grupo, idx);
      }
    });
    result.set(s.timeType, { tens, groups, editions: list.length });
  }
  return result;
}

export interface RioTenRow extends TenRow {
  delayInFaixa: Record<string, number>;
  prevFreq: number | null;
  trend: "subindo" | "estável" | "caindo";
  P: number;
}

/** Monta o pacote completo de inteligência do Rio. */
export async function buildRioIntel(input: RioIntelInput) {
  const position = (input.position ?? 0) as PositionFilter;
  let dateStart = input.dateStart;
  if (input.days && input.days > 0) {
    const d = new Date();
    d.setDate(d.getDate() - input.days);
    const iso = d.toISOString().slice(0, 10);
    dateStart = dateStart && dateStart > iso ? dateStart : iso;
  }

  const all = await loadRioContests(dateStart, input.dateEnd);
  const faixa = input.faixa && input.faixa !== "all" ? input.faixa : "all";
  let list = faixa === "all" ? all : all.filter((c) => c.time_type === faixa);
  const windowSize = input.window ?? 0;
  if (windowSize > 0) list = list.slice(0, windowSize);

  const core = computeIntel(list, position);
  const faixaDelays = delaysByFaixa(all, position);

  // período anterior para comparação de tendência
  const prevList = windowSize > 0 ? (faixa === "all" ? all : all.filter((c) => c.time_type === faixa)).slice(windowSize, windowSize * 2) : [];
  const prevCore = prevList.length ? computeIntel(prevList, position) : null;
  const prevFreq = new Map((prevCore?.tens ?? []).map((t) => [t.ten, t.freqTotal] as const));

  // componente P: comportamento por posição do prêmio (concentração no 1º prêmio)
  const firstPrizeCount = new Map<string, number>();
  list.forEach((c) => {
    const p = c.prizes[0];
    if (!p) return;
    const ten = normalizePrize(p).dezena;
    firstPrizeCount.set(ten, (firstPrizeCount.get(ten) ?? 0) + 1);
  });
  const normP = normalize(core.tens.map((t) => firstPrizeCount.get(t.ten) ?? 0));

  const tens: RioTenRow[] = core.tens.map((t) => {
    const A = t.components.A;
    const R = t.components.R;
    const G = t.components.G;
    const E = t.components.E;
    const P = Math.round(normP(firstPrizeCount.get(t.ten) ?? 0));
    const score = 0.35 * A + 0.3 * R + 0.2 * G + 0.1 * P + 0.05 * E;
    const before = prevFreq.get(t.ten) ?? null;
    const trend: RioTenRow["trend"] =
      before === null ? "estável" : t.freqTotal > before ? "subindo" : t.freqTotal < before ? "caindo" : "estável";
    const delayInFaixa: Record<string, number> = {};
    for (const s of DRAW_SCHEDULE_RIO) {
      const f = faixaDelays.get(s.timeType);
      delayInFaixa[s.timeType] = f ? f.tens.get(t.ten) ?? f.editions : 0;
    }
    return {
      ...t,
      P,
      score: Math.round(score * 10) / 10,
      scoreLabel: scoreLabel(score),
      classification: classify(t.delayIndex),
      prevFreq: before,
      trend,
      delayInFaixa,
    };
  });

  const groups = core.groups.map((g) => {
    const delayInFaixa: Record<string, number> = {};
    for (const s of DRAW_SCHEDULE_RIO) {
      const f = faixaDelays.get(s.timeType);
      delayInFaixa[s.timeType] = f ? f.groups.get(g.group) ?? f.editions : 0;
    }
    return { ...g, delayInFaixa, tens: tensOfGroup(g.group) };
  });

  const latest = list[0] ?? all[0] ?? null;
  const today = all[0]?.date ?? null;
  const todayContests = today ? all.filter((c) => c.date === today) : [];
  const next = getNextDraw("rio");
  const topN = Math.max(3, Math.min(25, input.topN ?? 10));

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      position,
      faixa,
      window: windowSize,
      days: input.days ?? 0,
      dateStart: dateStart ?? null,
      dateEnd: input.dateEnd ?? null,
      sampleSize: list.length,
    },
    faixas: RIO_FAIXAS,
    summary: {
      lastDate: latest?.date ?? null,
      lastFaixa: latest ? drawLabel("rio", latest.time_type) : null,
      publishedToday: todayContests.length,
      numbersToday: todayContests.length * 5,
      nextDraw: next ? { label: next.label ?? null, timeValue: next.timeValue ?? null } : null,
      source: "soresultados.info (robô automatizado)",
      status: todayContests.length >= 6 ? "dia completo" : "aguardando resultados do dia",
      historyContests: all.length,
    },
    todayResults: todayContests.map((c) => ({
      date: c.date,
      timeType: c.time_type,
      label: drawLabel("rio", c.time_type),
      prizes: c.prizes.map((p, i) => ({ position: i + 1, ...normalizePrize(p) })),
    })),
    totals: {
      contests: core.totalContests,
      prizes: core.totalPrizes,
      historyContests: all.length,
    },
    latest: latest
      ? {
          date: latest.date,
          label: drawLabel("rio", latest.time_type),
          prizes: latest.prizes.map((p, i) => ({ position: i + 1, ...normalizePrize(p) })),
        }
      : null,
    tens,
    groups,
    rankings: {
      tensMostDelayed: [...tens].sort((a, b) => b.delay - a.delay).slice(0, 25),
      tensHottest: [...tens].sort((a, b) => b.freqTotal - a.freqTotal).slice(0, 25),
      groupsMostDelayed: [...groups].sort((a, b) => b.delay - a.delay).slice(0, 25),
      groupsHottest: [...groups].sort((a, b) => b.freqTotal - a.freqTotal).slice(0, 25),
      topScore: [...tens].sort((a, b) => b.score - a.score).slice(0, 25),
      combined: [...tens]
        .filter((t) => (t.delayIndex ?? 0) >= 1.5)
        .filter((t) => (groups.find((g) => g.group === t.group)?.delayIndex ?? 0) >= 1.2)
        .sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0))
        .slice(0, 20),
      byPosition: frequencyByPosition(list),
    },
    probabilities: {
      tenPerPosition: 1,
      tenAnyOfFive: (1 - Math.pow(0.99, 5)) * 100,
      groupPerPosition: 4,
      groupAnyOfFive: (1 - Math.pow(0.96, 5)) * 100,
    },
    backtest: list.length >= 40 ? backtest(list.slice(0, 200), position, topN) : null,
  };
}

export { groupOfTen, tensOfGroup, normalizePrize };
