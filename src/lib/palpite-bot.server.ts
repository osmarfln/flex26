import { buildRioIntel, loadRioContests } from "./rio-intel.server";
import { buildFederalIntel, loadFederalContests, type Contest } from "./federal-intel.server";
import { PUXADAS } from "./puxadas";
import { ANIMAL_GROUPS_MAP, getGroupFromTen } from "./animals";

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

/** Ranking geral de atrasos: TODAS as dezenas e TODOS os grupos, ordenados por atraso. */
function rankingGeralAtrasos(tens: any[] = [], groups: any[] = []) {
  return {
    dezenas: [...tens]
      .sort((a, b) => (b.delay ?? 0) - (a.delay ?? 0))
      .map((t, i) => ({
        posicao: i + 1,
        dezena: t.ten,
        grupo: t.group,
        atraso: t.delay,
        indiceAtraso: t.delayIndex,
        classificacao: t.classification,
        intervaloMedio: t.avgInterval,
        maiorAtraso: t.maxDelay,
        freq: t.freqTotal,
        ultimaData: t.lastDate,
      })),
    grupos: [...groups]
      .sort((a, b) => (b.delay ?? 0) - (a.delay ?? 0))
      .map((g, i) => ({
        posicao: i + 1,
        grupo: g.group,
        bicho: ANIMAL_GROUPS_MAP[String(g.group).padStart(2, "0")]?.name ?? null,
        dezenas: g.tens,
        atraso: g.delay,
        indiceAtraso: g.delayIndex,
        classificacao: g.classification,
        intervaloMedio: g.avgInterval,
        freq: g.freqTotal,
        ultimaData: g.lastDate,
      })),
  };
}

/** Tabela de puxadas tradicional + probabilidade real medida no histórico (P(B|A)). */
function puxadasComProbabilidade(contests: Contest[]) {
  const pairs: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  // contests vem em ordem decrescente: percorre do mais antigo para o mais novo
  for (let i = contests.length - 1; i >= 1; i--) {
    const prev = contests[i];
    const curr = contests[i - 1];
    const a = getGroupFromTen(String(prev?.prizes?.[0] ?? "").slice(-2));
    const b = getGroupFromTen(String(curr?.prizes?.[0] ?? "").slice(-2));
    if (!a || !b) continue;
    pairs[a] = pairs[a] ?? {};
    pairs[a][b] = (pairs[a][b] ?? 0) + 1;
    totals[a] = (totals[a] ?? 0) + 1;
  }
  const base = 100 / 25; // 4% = probabilidade aleatória de um grupo específico

  return PUXADAS.map((p) => {
    const total = totals[p.groupId] ?? 0;
    const counts = pairs[p.groupId] ?? {};
    const tradicionais = p.puxa
      .filter((t) => t.id)
      .map((t) => {
        const c = counts[t.id] ?? 0;
        const prob = total ? Number(((c / total) * 100).toFixed(1)) : 0;
        return {
          grupo: t.id,
          bicho: t.name,
          ocorrencias: c,
          probabilidadeObservadaPct: prob,
          indiceSobreAleatorio: total ? Number((prob / base).toFixed(2)) : null,
          confirmadaPeloHistorico: prob > base,
        };
      })
      .sort((a, b) => b.probabilidadeObservadaPct - a.probabilidadeObservadaPct);

    const estatisticas = Object.entries(counts)
      .map(([id, c]) => ({
        grupo: id,
        bicho: ANIMAL_GROUPS_MAP[id]?.name ?? "?",
        ocorrencias: c,
        probabilidadeObservadaPct: total ? Number(((c / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.probabilidadeObservadaPct - a.probabilidadeObservadaPct)
      .slice(0, 5);

    return {
      grupoOrigem: p.groupId,
      bichoOrigem: p.name,
      amostraTransicoes: total,
      puxadasTradicionais: tradicionais,
      puxadasEstatisticasTop5: estatisticas,
    };
  });
}

/** Monitoramento inteligente: situação de cada horário/faixa do jogo. */
function monitoramentoInteligente(contests: Contest[], hoje: string) {
  const byFaixa = new Map<string, Contest[]>();
  for (const c of contests) {
    const arr = byFaixa.get(c.time_type) ?? [];
    arr.push(c);
    byFaixa.set(c.time_type, arr);
  }
  return [...byFaixa.entries()].map(([faixa, list]) => {
    // list já está em ordem decrescente
    const lastSeen = new Map<string, number>();
    list.forEach((c, idx) => {
      for (const p of c.prizes ?? []) {
        const ten = String(p).slice(-2);
        if (!lastSeen.has(ten)) lastSeen.set(ten, idx);
      }
    });
    const atrasadas: { dezena: string; grupo: string | null; atrasoNaFaixa: number }[] = [];
    for (let n = 0; n < 100; n++) {
      const ten = String(n).padStart(2, "0");
      const idx = lastSeen.get(ten);
      atrasadas.push({
        dezena: ten,
        grupo: getGroupFromTen(ten) ?? null,
        atrasoNaFaixa: idx === undefined ? list.length : idx,
      });
    }
    atrasadas.sort((a, b) => b.atrasoNaFaixa - a.atrasoNaFaixa);
    const ultimo = list[0];
    return {
      faixa,
      edicoesAnalisadas: list.length,
      ultimaData: ultimo?.date ?? null,
      ultimoResultado: ultimo?.prizes ?? [],
      grupoUltimo1oPremio: ultimo ? getGroupFromTen(String(ultimo.prizes?.[0] ?? "").slice(-2)) : null,
      publicadoHoje: ultimo?.date === hoje,
      status: ultimo?.date === hoje ? "resultado do dia publicado" : "aguardando resultado",
      dezenasMaisAtrasadasNaFaixa: atrasadas.slice(0, 5),
    };
  });
}

/** Alertas automáticos de atraso (dezenas, grupos e faixas). */
function alertasAutomaticos(tens: any[] = [], groups: any[] = [], monitor: any[] = []) {
  const clas = (i: number) => (i >= 2.5 ? "atraso muito elevado" : i >= 1.5 ? "atraso elevado" : "normal");
  const dezenas = tens
    .filter((t) => (t.delayIndex ?? 0) >= 1.5)
    .sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0))
    .slice(0, 20)
    .map((t) => ({
      alerta: clas(t.delayIndex ?? 0),
      dezena: t.ten,
      grupo: t.group,
      atraso: t.delay,
      indiceAtraso: t.delayIndex,
      intervaloMedio: t.avgInterval,
    }));
  const grupos = groups
    .filter((g) => (g.delayIndex ?? 0) >= 1.5)
    .sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0))
    .slice(0, 12)
    .map((g) => ({
      alerta: clas(g.delayIndex ?? 0),
      grupo: g.group,
      bicho: ANIMAL_GROUPS_MAP[String(g.group).padStart(2, "0")]?.name ?? null,
      atraso: g.delay,
      indiceAtraso: g.delayIndex,
      intervaloMedio: g.avgInterval,
    }));
  const faixas = monitor
    .filter((m) => !m.publicadoHoje)
    .map((m) => ({ faixa: m.faixa, alerta: "sem resultado publicado hoje", ultimaData: m.ultimaData }));
  return { dezenas, grupos, faixas, totalAlertas: dezenas.length + grupos.length + faixas.length };
}

const hojeBrasilia = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

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
    const contests = await loadFederalContests();
    const monitor = monitoramentoInteligente(contests, hojeBrasilia());
    return {
      loteria: "LOTERIA FEDERAL",
      rankingGeralDeAtrasos: rankingGeralAtrasos(intel.tens ?? [], intel.groups ?? []),
      tabelaPuxadasTradicional: puxadasComProbabilidade(contests),
      monitoramentoInteligente: monitor,
      alertasAutomaticosDeAtraso: alertasAutomaticos(intel.tens ?? [], intel.groups ?? [], monitor),
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
