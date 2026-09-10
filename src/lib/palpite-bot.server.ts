import { buildRioIntel } from "./rio-intel.server";
import { buildFederalIntel } from "./federal-intel.server";

export type BotLocation = "rio" | "capital" | "federal";

const pct = (v: number) => Math.round(v * 1000) / 10;

/** Probabilidade empírica de aparecer em pelo menos um dos 5 prêmios. */
function chanceEmPeloMenosUm(freq: number, totalPremios: number) {
  if (!totalPremios) return null;
  const p = Math.min(1, freq / totalPremios);
  return pct(1 - Math.pow(1 - p, 5));
}

function digitStats(tens: any[], totalPremios: number) {
  const left = new Map<string, { freq: number; delay: number }>();
  const right = new Map<string, { freq: number; delay: number }>();
  for (const t of tens) {
    const d = String(t.ten).padStart(2, "0");
    const acc = (m: Map<string, { freq: number; delay: number }>, k: string) => {
      const cur = m.get(k) ?? { freq: 0, delay: Number.POSITIVE_INFINITY };
      cur.freq += t.freqTotal ?? 0;
      cur.delay = Math.min(cur.delay, t.delay ?? 0);
      m.set(k, cur);
    };
    acc(left, d[0]!);
    acc(right, d[1]!);
  }
  const fmt = (m: Map<string, { freq: number; delay: number }>) =>
    [...m.entries()]
      .map(([d, v]) => ({
        digito: d,
        freq: v.freq,
        participacaoPct: totalPremios ? pct(v.freq / totalPremios) : null,
        menorAtraso: Number.isFinite(v.delay) ? v.delay : null,
      }))
      .sort((a, b) => b.freq - a.freq);
  return { esquerda: fmt(left), direita: fmt(right) };
}

const slimTens = (rows: any[] = [], n = 15) =>
  rows.slice(0, n).map((r: any) => ({
    dezena: r.ten,
    grupo: r.group,
    freq: r.freqTotal,
    indiceFrequencia: r.freqIndex,
    atraso: r.delay,
    indiceAtraso: r.delayIndex,
    classificacao: r.classification,
    intervaloMedio: r.avgInterval,
    maiorAtraso: r.maxDelay,
    ultimaData: r.lastDate,
    ultimaPosicao: r.lastPosition,
    posicoesJaSaiu: r.positions,
  }));

const slimGroups = (rows: any[] = [], totalPremios = 0, n = 15) =>
  rows.slice(0, n).map((r: any) => ({
    grupo: r.group,
    dezenas: r.tens,
    freq: r.freqTotal,
    indiceFrequencia: r.freqIndex,
    atraso: r.delay,
    indiceAtraso: r.delayIndex,
    classificacao: r.classification,
    intervaloMedio: r.avgInterval,
    ultimaData: r.lastDate,
    ultimaDezena: r.lastTen,
    probabilidadeProximoConcursoPct: chanceEmPeloMenosUm(r.freqTotal ?? 0, totalPremios),
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
    const intel: any = await buildFederalIntel({
      position: 0,
      window: opts.window ?? 0,
      dateStart: undefined,
      dateEnd: undefined,
      topN: 12,
    } as any);
    const totalPremios = intel.totals?.prizes ?? 0;
    return {
      loteria: "LOTERIA FEDERAL",
      fonte: "soresultados.info (robô automatizado)",
      amostraConcursos: intel.filters?.sampleSize ?? null,
      historicoConcursos: intel.totals?.historyContests ?? null,
      totalPremiosAnalisados: totalPremios,
      ultimoResultado: intel.latest,
      dezenasMaisAtrasadas: slimTens(intel.rankings?.tensMostDelayed),
      dezenasMaisPuxadas: slimTens(intel.rankings?.tensHottest),
      gruposMaisAtrasados: slimGroups(intel.rankings?.groupsMostDelayed, totalPremios),
      gruposMaisPuxados: slimGroups(intel.rankings?.groupsHottest, totalPremios),
      atrasoElevadoMaisGrupoAtrasado: slimTens(intel.rankings?.combined),
      frequenciaPorPosicao: intel.rankings?.byPosition,
      digitos: digitStats(intel.tens as any[], totalPremios),
      probabilidadesTeoricas: intel.probabilities,
      validacaoHistorica: intel.backtest,
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
  const totalPremios = intel.totals?.prizes ?? 0;

  return {
    loteria: location === "capital" ? "CAPITAL & LCAP" : "RIO DE JANEIRO",
    fonte: "soresultados.info (robô automatizado)",
    filtros: intel.filters,
    horariosOficiais: intel.faixas,
    resumo: intel.summary,
    totalPremiosAnalisados: totalPremios,
    ultimoResultado: intel.latest,
    resultadosDoDia: intel.todayResults ?? [],
    dezenasMaisAtrasadas: slimTens(r.tensMostDelayed ?? [...tens].sort((a, b) => b.delay - a.delay)),
    dezenasMaisPuxadas: slimTens(r.tensHottest ?? [...tens].sort((a, b) => b.freqTotal - a.freqTotal)),
    gruposMaisAtrasados: slimGroups(r.groupsMostDelayed ?? [...groups].sort((a, b) => b.delay - a.delay), totalPremios),
    gruposMaisPuxados: slimGroups(r.groupsHottest ?? [...groups].sort((a, b) => b.freqTotal - a.freqTotal), totalPremios),
    atrasoElevadoMaisGrupoAtrasado: slimTens(r.combined ?? []),
    frequenciaPorPosicao: r.byPosition,
    digitos: digitStats(tens, totalPremios),
    probabilidadesTeoricas: intel.probabilities,
    validacaoHistorica: intel.backtest ?? null,
  };
}

/** Pesquisa aberta na web (opcional — o robô responde com a base interna por padrão). */
export async function fetchWebSource(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FlexGerenciadorBot/1.0)" },
    });
    if (!res.ok) return `Fonte ${url} respondeu ${res.status}.`;
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch (e: any) {
    return `Não foi possível consultar ${url}: ${e?.message ?? "erro de rede"}`;
  }
}
