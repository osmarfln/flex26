import { buildRioIntel } from "./rio-intel.server";
import { buildFederalIntel } from "./federal-intel.server";

export type BotLocation = "rio" | "capital" | "federal";

function digitStats(tens: any[]) {
  const left = new Map<string, { freq: number; delay: number }>();
  const right = new Map<string, { freq: number; delay: number }>();
  for (const t of tens) {
    const d = String(t.ten).padStart(2, "0");
    const l = d[0]!;
    const r = d[1]!;
    const acc = (m: Map<string, { freq: number; delay: number }>, k: string) => {
      const cur = m.get(k) ?? { freq: 0, delay: 0 };
      cur.freq += t.freqTotal ?? 0;
      cur.delay = Math.max(cur.delay, t.delay ?? 0);
      m.set(k, cur);
    };
    acc(left, l);
    acc(right, r);
  }
  const fmt = (m: Map<string, { freq: number; delay: number }>) =>
    [...m.entries()]
      .map(([d, v]) => ({ digito: d, freq: v.freq, maiorAtraso: v.delay }))
      .sort((a, b) => b.freq - a.freq);
  return { esquerda: fmt(left), direita: fmt(right) };
}

const slim = (rows: any[] = [], n = 12) =>
  rows.slice(0, n).map((r: any) => ({
    dezena: r.ten ?? undefined,
    grupo: r.group,
    freq: r.freqTotal,
    atraso: r.delay,
    indiceAtraso: r.delayIndex,
    classificacao: r.classification ?? undefined,
    score: r.score,
  }));

/** Fotografia estatística real da loteria escolhida, para alimentar o robô. */
export async function buildBotSnapshot(opts: {
  location: BotLocation;
  days?: number;
  faixa?: string;
  window?: number;
}) {
  const { location } = opts;

  if (location === "federal") {
    const intel = await buildFederalIntel({
      position: 0,
      window: opts.window ?? 0,
      dateStart: undefined,
      dateEnd: undefined,
      topN: 12,
    } as any);
    return {
      loteria: "LOTERIA FEDERAL",
      amostra: intel.filters.sampleSize,
      historico: intel.totals.historyContests,
      ultimoResultado: intel.latest,
      dezenasMaisAtrasadas: slim(intel.rankings.tensMostDelayed),
      dezenasMaisPuxadas: slim(intel.rankings.tensHottest),
      gruposMaisAtrasados: slim(intel.rankings.groupsMostDelayed),
      gruposMaisPuxados: slim(intel.rankings.groupsHottest),
      melhoresScores: slim(intel.rankings.topScore),
      atrasoElevadoMaisGrupoAtrasado: slim(intel.rankings.combined),
      digitos: digitStats(intel.tens as any[]),
      probabilidades: intel.probabilities,
      backtest: intel.backtest,
    };
  }

  const intel: any = await buildRioIntel({
    location,
    position: 0,
    faixa: opts.faixa && opts.faixa !== "all" ? opts.faixa : "all",
    days: opts.days ?? 0,
    window: opts.window ?? 0,
    topN: 12,
  } as any);

  const tens: any[] = intel.tens ?? [];
  const groups: any[] = intel.groups ?? [];
  const r = intel.rankings ?? {};

  return {
    loteria: location === "capital" ? "CAPITAL & LCAP" : "RIO DE JANEIRO",
    filtros: intel.filters,
    faixas: intel.faixas,
    resumo: intel.summary,
    dezenasMaisAtrasadas: slim(r.tensMostDelayed ?? [...tens].sort((a, b) => b.delay - a.delay)),
    dezenasMaisPuxadas: slim(r.tensHottest ?? [...tens].sort((a, b) => b.freqTotal - a.freqTotal)),
    gruposMaisAtrasados: slim(r.groupsMostDelayed ?? [...groups].sort((a, b) => b.delay - a.delay)),
    gruposMaisPuxados: slim(r.groupsHottest ?? [...groups].sort((a, b) => b.freqTotal - a.freqTotal)),
    melhoresScores: slim(r.topScore ?? [...tens].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))),
    atrasoElevadoMaisGrupoAtrasado: slim(r.combined ?? []),
    digitos: digitStats(tens),
    resultadosDoDia: intel.todayContests ?? intel.summary?.publishedToday ?? null,
    backtest: intel.backtest ?? null,
  };
}

/** Pesquisa aberta na web (bichocerto.com e outras fontes públicas). */
export async function fetchWebSource(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FlexGerenciadorBot/1.0)" },
    });
    if (!res.ok) return `Fonte ${url} respondeu ${res.status}.`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 4000);
  } catch (e: any) {
    return `Não foi possível consultar ${url}: ${e?.message ?? "erro de rede"}`;
  }
}
