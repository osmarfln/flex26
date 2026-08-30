import { supabase } from "@/integrations/supabase/client";

/**
 * Inteligência estatística da LOTERIA FEDERAL.
 * Todos os cálculos usam SOMENTE o histórico já armazenado (tabela lottery_results,
 * location = 'federal'), medindo atraso em CONCURSOS REALIZADOS — nunca em dias
 * corridos — porque a Federal sorteia apenas 2 vezes por semana
 * (quarta 20:30 e domingo 11:00).
 */

export type PositionFilter = 0 | 1 | 2 | 3 | 4 | 5; // 0 = 1º ao 5º
export type WeekdayFilter = "all" | "wed" | "sun";

export interface FederalIntelInput {
  position?: PositionFilter;
  weekday?: WeekdayFilter;
  window?: number; // 0 = todo o histórico
  dateStart?: string;
  dateEnd?: string;
  topN?: number; // dezenas selecionadas no backtest
}

export interface Contest {
  date: string;
  time_type: string;
  time_value: string | null;
  weekday: number;
  prizes: string[]; // 5 números completos (string)
}

/** Padroniza um prêmio preservando zeros à esquerda. */
export function normalizePrize(raw: string | number) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const n = Number(digits || "0");
  const quatro = String(n % 10000).padStart(4, "0");
  const centena = String(n % 1000).padStart(3, "0");
  const dezena = String(n % 100).padStart(2, "0");
  const unidade = String(n % 10);
  return { full: digits || quatro, quatro, centena, dezena, unidade, grupo: groupOfTen(dezena) };
}

/** Grupo (01..25) de uma dezena "00".."99" — dezena 00 pertence ao grupo 25. */
export function groupOfTen(dezena: string): string {
  const n = Number(dezena);
  if (!Number.isFinite(n)) return "";
  return String(n === 0 ? 25 : Math.ceil(n / 4)).padStart(2, "0");
}

export function tensOfGroup(group: string): string[] {
  const g = Number(group);
  if (g === 25) return ["97", "98", "99", "00"];
  const base = (g - 1) * 4 + 1;
  return [base, base + 1, base + 2, base + 3].map((d) => String(d).padStart(2, "0"));
}

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

/** Normaliza 0..100 com corte no percentil 95 para evitar valores extremos dominarem. */
function normalize(values: number[]): (v: number) => number {
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const cap = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]! : 1;
  const max = cap && cap > 0 ? cap : 1;
  return (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
}

/** Lê o histórico Federal já armazenado (mais recente primeiro). */
export async function loadFederalContests(dateStart?: string, dateEnd?: string): Promise<Contest[]> {
  let q = supabase
    .from("lottery_results")
    .select("date, time_type, time_value, results")
    .eq("location", "federal")
    .order("date", { ascending: false })
    .limit(5000);
  if (dateStart) q = q.gte("date", dateStart);
  if (dateEnd) q = q.lte("date", dateEnd);
  const { data, error } = await q;
  if (error) throw error;

  const seen = new Set<string>();
  const out: Contest[] = [];
  for (const r of data ?? []) {
    const key = `${r.date}|${r.time_type}`;
    if (seen.has(key)) continue; // proteção contra duplicidade
    const prizes = ((r.results as string[]) ?? []).filter((p) => String(p ?? "").replace(/\D/g, "").length > 0);
    if (prizes.length < 5) continue; // resultado incompleto não entra nos cálculos
    seen.add(key);
    out.push({
      date: String(r.date),
      time_type: String(r.time_type),
      time_value: r.time_value ?? null,
      weekday: new Date(`${r.date}T12:00:00`).getDay(),
      prizes: prizes.slice(0, 5),
    });
  }
  return out;
}

function applyFilters(all: Contest[], input: FederalIntelInput) {
  const weekday = input.weekday ?? "all";
  let list = all;
  if (weekday === "wed") list = list.filter((c) => c.weekday === 3);
  if (weekday === "sun") list = list.filter((c) => c.weekday === 0);
  const w = input.window ?? 0;
  if (w > 0) list = list.slice(0, w);
  return list;
}

/** Dezenas de um concurso conforme o filtro de posição. */
function tensOf(contest: Contest, position: PositionFilter) {
  const prizes = position === 0 ? contest.prizes : [contest.prizes[position - 1] ?? ""];
  return prizes
    .filter(Boolean)
    .map((p, i) => ({ ...normalizePrize(p), position: position === 0 ? i + 1 : position }));
}

export interface TenRow {
  ten: string;
  group: string;
  delay: number;
  daysSince: number | null;
  lastDate: string | null;
  lastContest: string | null;
  lastPosition: number | null;
  avgInterval: number | null;
  maxDelay: number;
  freqTotal: number;
  freqRecent: number;
  freqPct: number;
  expected: number;
  freqIndex: number;
  delayIndex: number | null;
  classification: string;
  positions: number[];
  score: number;
  scoreLabel: string;
  components: { A: number; R: number; G: number; E: number };
}

export interface GroupRow {
  group: string;
  tens: string[];
  delay: number;
  avgInterval: number | null;
  delayIndex: number | null;
  maxDelay: number;
  lastTen: string | null;
  lastDate: string | null;
  freqTotal: number;
  freqRecent: number;
  freqPct: number;
  expected: number;
  freqIndex: number;
  classification: string;
  topTen: string | null;
}

/** Núcleo matemático: gera as métricas de dezenas e grupos para uma lista de concursos. */
export function computeIntel(list: Contest[], position: PositionFilter, recentWindow = 20) {
  const totalContests = list.length;
  const totalPrizes = list.reduce((acc, c) => acc + (position === 0 ? c.prizes.length : 1), 0);

  const tenOccurrences = new Map<string, number[]>(); // índices de concurso (0 = mais recente)
  const tenCount = new Map<string, number>();
  const tenPositions = new Map<string, Set<number>>();
  const tenLastInfo = new Map<string, { date: string; contest: string; position: number }>();
  const groupOccurrences = new Map<string, number[]>();
  const groupCount = new Map<string, number>();
  const groupLastTen = new Map<string, { ten: string; date: string }>();

  list.forEach((contest, idx) => {
    const items = tensOf(contest, position);
    const tensSeen = new Set<string>();
    const groupsSeen = new Set<string>();
    for (const it of items) {
      const ten = it.dezena;
      const grp = it.grupo;
      tenCount.set(ten, (tenCount.get(ten) ?? 0) + 1);
      groupCount.set(grp, (groupCount.get(grp) ?? 0) + 1);
      if (!tenPositions.has(ten)) tenPositions.set(ten, new Set());
      tenPositions.get(ten)!.add(it.position);
      if (!tenLastInfo.has(ten))
        tenLastInfo.set(ten, { date: contest.date, contest: `${contest.date} ${contest.time_type}`, position: it.position });
      if (!groupLastTen.has(grp)) groupLastTen.set(grp, { ten, date: contest.date });
      tensSeen.add(ten);
      groupsSeen.add(grp);
    }
    // atraso conta por concurso (repetição na mesma extração não conta duas vezes)
    for (const t of tensSeen) {
      if (!tenOccurrences.has(t)) tenOccurrences.set(t, []);
      tenOccurrences.get(t)!.push(idx);
    }
    for (const g of groupsSeen) {
      if (!groupOccurrences.has(g)) groupOccurrences.set(g, []);
      groupOccurrences.get(g)!.push(idx);
    }
  });

  const recent = list.slice(0, Math.min(recentWindow, list.length));
  const recentTen = new Map<string, number>();
  const recentGroup = new Map<string, number>();
  recent.forEach((c) => {
    for (const it of tensOf(c, position)) {
      recentTen.set(it.dezena, (recentTen.get(it.dezena) ?? 0) + 1);
      recentGroup.set(it.grupo, (recentGroup.get(it.grupo) ?? 0) + 1);
    }
  });

  const today = new Date();
  const metrics = (occ: number[] | undefined) => {
    if (!occ || occ.length === 0) {
      return { delay: totalContests, avgInterval: null as number | null, maxDelay: totalContests, stability: 0 };
    }
    const delay = occ[0]!;
    const gaps: number[] = [];
    for (let i = 0; i < occ.length - 1; i++) gaps.push(occ[i + 1]! - occ[i]!);
    const tail = totalContests - 1 - occ[occ.length - 1]!;
    const avgInterval = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : totalContests / occ.length;
    const maxDelay = Math.max(delay, tail, ...(gaps.length ? gaps : [0]));
    // estabilidade = inverso do desvio relativo dos intervalos (0..1)
    let stability = 0;
    if (gaps.length > 1 && avgInterval > 0) {
      const mean = avgInterval;
      const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length;
      const cv = Math.sqrt(variance) / mean;
      stability = Math.max(0, 1 - cv);
    } else if (gaps.length === 1) {
      stability = 0.5;
    }
    return { delay, avgInterval, maxDelay, stability };
  };

  const expectedTen = totalPrizes * 0.01;
  const expectedGroup = totalPrizes * 0.04;

  const rawTens = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0")).map((ten) => {
    const m = metrics(tenOccurrences.get(ten));
    const last = tenLastInfo.get(ten) ?? null;
    const freqTotal = tenCount.get(ten) ?? 0;
    return {
      ten,
      group: groupOfTen(ten),
      ...m,
      last,
      freqTotal,
      freqRecent: recentTen.get(ten) ?? 0,
      freqPct: totalPrizes ? (freqTotal / totalPrizes) * 100 : 0,
      expected: expectedTen,
      freqIndex: expectedTen ? freqTotal / expectedTen : 0,
      daysSince: last ? Math.floor((today.getTime() - new Date(`${last.date}T12:00:00`).getTime()) / 86400000) : null,
      positions: Array.from(tenPositions.get(ten) ?? []).sort((a, b) => a - b),
    };
  });

  const groups: GroupRow[] = Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, "0")).map((group) => {
    const m = metrics(groupOccurrences.get(group));
    const freqTotal = groupCount.get(group) ?? 0;
    const last = groupLastTen.get(group) ?? null;
    const tens = tensOfGroup(group);
    const topTen = tens.reduce<{ t: string | null; c: number }>(
      (acc, t) => ((tenCount.get(t) ?? 0) > acc.c ? { t, c: tenCount.get(t) ?? 0 } : acc),
      { t: null, c: -1 },
    ).t;
    const delayIndex = m.avgInterval && m.avgInterval > 0 ? m.delay / m.avgInterval : null;
    return {
      group,
      tens,
      delay: m.delay,
      avgInterval: m.avgInterval,
      delayIndex,
      maxDelay: m.maxDelay,
      lastTen: last?.ten ?? null,
      lastDate: last?.date ?? null,
      freqTotal,
      freqRecent: recentGroup.get(group) ?? 0,
      freqPct: totalPrizes ? (freqTotal / totalPrizes) * 100 : 0,
      expected: expectedGroup,
      freqIndex: expectedGroup ? freqTotal / expectedGroup : 0,
      classification: classify(delayIndex),
      topTen,
    };
  });

  const groupByIdIdx = new Map(groups.map((g) => [g.group, g] as const));

  const normA = normalize(rawTens.map((t) => (t.avgInterval && t.avgInterval > 0 ? t.delay / t.avgInterval : 0)));
  const normR = normalize(rawTens.map((t) => t.freqRecent));
  const normG = normalize(groups.map((g) => (g.avgInterval && g.avgInterval > 0 ? g.delay / g.avgInterval : 0)));

  const tens: TenRow[] = rawTens.map((t) => {
    const delayIndex = t.avgInterval && t.avgInterval > 0 ? t.delay / t.avgInterval : null;
    const g = groupByIdIdx.get(t.group);
    const A = normA(delayIndex ?? 0);
    const R = normR(t.freqRecent);
    const G = normG(g && g.avgInterval && g.avgInterval > 0 ? g.delay / g.avgInterval : 0);
    const E = Math.max(0, Math.min(100, t.stability * 100));
    const score = 0.4 * A + 0.3 * R + 0.2 * G + 0.1 * E;
    return {
      ten: t.ten,
      group: t.group,
      delay: t.delay,
      daysSince: t.daysSince,
      lastDate: t.last?.date ?? null,
      lastContest: t.last?.contest ?? null,
      lastPosition: t.last?.position ?? null,
      avgInterval: t.avgInterval,
      maxDelay: t.maxDelay,
      freqTotal: t.freqTotal,
      freqRecent: t.freqRecent,
      freqPct: t.freqPct,
      expected: t.expected,
      freqIndex: t.freqIndex,
      delayIndex,
      classification: classify(delayIndex),
      positions: t.positions,
      score: Math.round(score * 10) / 10,
      scoreLabel: scoreLabel(score),
      components: {
        A: Math.round(A),
        R: Math.round(R),
        G: Math.round(G),
        E: Math.round(E),
      },
    };
  });

  return { tens, groups, totalContests, totalPrizes };
}

/** Frequência por posição do prêmio (1º ao 5º). */
export function frequencyByPosition(list: Contest[]) {
  return [1, 2, 3, 4, 5].map((pos) => {
    const counts = new Map<string, number>();
    list.forEach((c) => {
      const p = c.prizes[pos - 1];
      if (!p) return;
      const ten = normalizePrize(p).dezena;
      counts.set(ten, (counts.get(ten) ?? 0) + 1);
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([ten, count]) => ({ ten, count, group: groupOfTen(ten) }));
    return { position: pos, total: list.filter((c) => c.prizes[pos - 1]).length, top };
  });
}

/**
 * Backtest sem vazamento de dados futuros:
 * para cada concurso, o ranking é calculado APENAS com os concursos anteriores.
 */
export function backtest(list: Contest[], position: PositionFilter, topN = 10, minHistory = 20) {
  // list vem do mais recente para o mais antigo
  const asc = [...list].reverse();
  let tested = 0;
  let hits = 0;
  let hitsDelay = 0;
  let hitsHot = 0;
  let wedTested = 0, wedHits = 0, sunTested = 0, sunHits = 0;
  let positionHits = [0, 0, 0, 0, 0];

  for (let i = minHistory; i < asc.length; i++) {
    const history = asc.slice(0, i).reverse(); // mais recente primeiro
    const target = asc[i]!;
    const { tens } = computeIntel(history, position);
    const pick = (arr: TenRow[]) => new Set(arr.slice(0, topN).map((t) => t.ten));
    const byScore = pick([...tens].sort((a, b) => b.score - a.score));
    const byDelay = pick([...tens].sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0)));
    const byHot = pick([...tens].sort((a, b) => b.freqRecent - a.freqRecent));

    const drawn = tensOf(target, position);
    const drawnSet = new Set(drawn.map((d) => d.dezena));
    const hit = [...drawnSet].some((d) => byScore.has(d));
    tested++;
    if (hit) hits++;
    if ([...drawnSet].some((d) => byDelay.has(d))) hitsDelay++;
    if ([...drawnSet].some((d) => byHot.has(d))) hitsHot++;
    drawn.forEach((d) => {
      if (byScore.has(d.dezena) && d.position >= 1 && d.position <= 5) positionHits[d.position - 1]!++;
    });
    if (target.weekday === 3) { wedTested++; if (hit) wedHits++; }
    if (target.weekday === 0) { sunTested++; if (hit) sunHits++; }
  }

  const prizesPerContest = position === 0 ? 5 : 1;
  // acaso: probabilidade de um conjunto aleatório de topN dezenas acertar ao menos uma
  const randomRate = (1 - Math.pow((100 - topN) / 100, prizesPerContest)) * 100;
  const rate = tested ? (hits / tested) * 100 : 0;
  // intervalo de confiança 95% (aproximação normal)
  const p = rate / 100;
  const se = tested ? Math.sqrt((p * (1 - p)) / tested) * 100 : 0;

  return {
    tested,
    topN,
    hits,
    rate,
    ci95: [Math.max(0, rate - 1.96 * se), Math.min(100, rate + 1.96 * se)] as [number, number],
    delayRate: tested ? (hitsDelay / tested) * 100 : 0,
    hotRate: tested ? (hitsHot / tested) * 100 : 0,
    randomRate,
    edge: rate - randomRate,
    wed: { tested: wedTested, rate: wedTested ? (wedHits / wedTested) * 100 : 0 },
    sun: { tested: sunTested, rate: sunTested ? (sunHits / sunTested) * 100 : 0 },
    positionHits,
  };
}

export const FEDERAL_PROBABILITIES = {
  tenPerPosition: 1,
  tenAnyOfFive: (1 - Math.pow(0.99, 5)) * 100,
  groupPerPosition: 4,
  groupAnyOfFive: (1 - Math.pow(0.96, 5)) * 100,
};

/** Monta o pacote completo de inteligência da Federal. */
export async function buildFederalIntel(input: FederalIntelInput) {
  const all = await loadFederalContests(input.dateStart, input.dateEnd);
  const position = (input.position ?? 0) as PositionFilter;
  const list = applyFilters(all, input);
  const core = computeIntel(list, position);

  const previousWindow = input.window && input.window > 0 ? applyFilters(all, input).length : 0;
  const prevList = input.window && input.window > 0 ? all.slice(input.window, input.window * 2) : [];
  const prevCore = prevList.length ? computeIntel(prevList, position) : null;
  const prevFreq = new Map((prevCore?.tens ?? []).map((t) => [t.ten, t.freqTotal] as const));

  const tens = core.tens.map((t) => ({ ...t, prevFreq: prevFreq.get(t.ten) ?? null }));

  const latest = list[0] ?? null;
  const topN = Math.max(3, Math.min(25, input.topN ?? 10));

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      position,
      weekday: input.weekday ?? "all",
      window: input.window ?? 0,
      dateStart: input.dateStart ?? null,
      dateEnd: input.dateEnd ?? null,
      sampleSize: list.length,
      previousWindow,
    },
    totals: {
      contests: core.totalContests,
      prizes: core.totalPrizes,
      historyContests: all.length,
    },
    latest: latest
      ? {
          date: latest.date,
          time_type: latest.time_type,
          time_value: latest.time_value,
          weekday: latest.weekday,
          prizes: latest.prizes.map((p, i) => ({ position: i + 1, ...normalizePrize(p) })),
        }
      : null,
    tens,
    groups: core.groups,
    rankings: {
      tensMostDelayed: [...tens].sort((a, b) => b.delay - a.delay).slice(0, 20),
      tensHottest: [...tens].sort((a, b) => b.freqTotal - a.freqTotal).slice(0, 20),
      groupsMostDelayed: [...core.groups].sort((a, b) => b.delay - a.delay).slice(0, 15),
      groupsHottest: [...core.groups].sort((a, b) => b.freqTotal - a.freqTotal).slice(0, 15),
      topScore: [...tens].sort((a, b) => b.score - a.score).slice(0, 20),
      combined: [...tens]
        .filter((t) => (t.delayIndex ?? 0) >= 1.5)
        .map((t) => ({ t, g: core.groups.find((g) => g.group === t.group) }))
        .filter((x) => (x.g?.delayIndex ?? 0) >= 1.2)
        .sort((a, b) => (b.t.delayIndex ?? 0) - (a.t.delayIndex ?? 0))
        .slice(0, 15)
        .map((x) => x.t),
      regular: [...tens]
        .filter((t) => t.freqTotal >= 3)
        .sort((a, b) => b.components.E - a.components.E)
        .slice(0, 15),
      biggestHistoricDelays: [...tens].sort((a, b) => b.maxDelay - a.maxDelay).slice(0, 15),
      byPosition: frequencyByPosition(list),
    },
    probabilities: FEDERAL_PROBABILITIES,
    backtest: list.length >= 30 ? backtest(list.slice(0, 160), position, topN) : null,
  };
}
