import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const Input = z.object({
  limit: z.number().min(10).max(4000).optional().default(4000),
});

export type MegaDraw = {
  concurso: number;
  data_apuracao: string;
  dezenas: number[];
  acumulou: boolean;
  valor_estimado_proximo: number | null;
  valor_acumulado: number | null;
  data_proximo_concurso: string | null;
  proximo_concurso: number | null;
  ganhadores_sena: number | null;
  premio_sena: number | null;
  rateio: Array<{ faixa: number; descricaoFaixa: string; numeroDeGanhadores: number; valorPremio: number }> | null;
  local_sorteio?: string | null;
  municipio_uf?: string | null;
};

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]);

const MEGA_SOURCES = [
  "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena",
  "https://api.guidi.dev.br/loteria/megasena",
  "https://loteriascaixa-api.herokuapp.com/api/megasena",
];

async function fetchMegaDraw(concurso?: number): Promise<any> {
  const urls = MEGA_SOURCES.map((base) => concurso
    ? `${base}/${concurso}`
    : base.includes("guidi.dev.br") ? `${base}/ultimo`
    : base.includes("herokuapp.com") ? `${base}/latest`
    : base);
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (!response.ok) continue;
      const raw: any = await response.json();
      const data = raw?.loteria === "megasena" ? {
        numero: raw.concurso,
        dataApuracao: raw.data,
        listaDezenas: raw.dezenas,
        acumulado: raw.acumulou,
        numeroConcursoProximo: raw.proximoConcurso,
        dataProximoConcurso: raw.dataProximoConcurso,
        valorEstimadoProximoConcurso: raw.valorEstimadoProximoConcurso,
        valorAcumuladoProximoConcurso: raw.valorAcumuladoProximoConcurso,
        valorAcumuladoConcurso_0_5: raw.valorAcumuladoConcurso_0_5,
      } : raw;
      if (data && Number.isFinite(Number(data.numero)) && Array.isArray(data.listaDezenas)) return data;
    } catch {
      // tenta a próxima fonte
    }
  }
  return null;
}

async function loadDraws(limit: number): Promise<MegaDraw[]> {
  const { data, error } = await supabase
    .from("mega_sena_results" as any)
    .select(
      "concurso, data_apuracao, dezenas, acumulou, valor_estimado_proximo, valor_acumulado, data_proximo_concurso, proximo_concurso, ganhadores_sena, premio_sena, rateio, local_sorteio, municipio_uf",
    )
    .order("concurso", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map((d) => ({
    ...d,
    dezenas: (d.dezenas ?? []).map((n: any) => Number(n)).sort((a: number, b: number) => a - b),
  })) as MegaDraw[];
}

/** Último resultado oficial + informações do próximo concurso. */
export const getMegaLatest = createServerFn({ method: "GET" }).handler(async () => {
  const draws = await loadDraws(12);
  return {
    latest: draws[0] ?? null,
    recent: draws,
    total: draws.length,
  };
});

/** Estatísticas descritivas completas da Mega-Sena (histórico oficial). */
export const getMegaStats = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data }) => {
    const draws = await loadDraws(data.limit);
    const total = draws.length;

    const freq: Record<number, number> = {};
    const lastIdx: Record<number, number> = {};
    const lastDate: Record<number, string> = {};
    const intervals: Record<number, number[]> = {};
    const prevSeen: Record<number, number> = {};

    const parity: Record<string, number> = {};
    const sums: number[] = [];
    const faixas = [
      { label: "01-10", min: 1, max: 10 },
      { label: "11-20", min: 11, max: 20 },
      { label: "21-30", min: 21, max: 30 },
      { label: "31-40", min: 31, max: 40 },
      { label: "41-50", min: 41, max: 50 },
      { label: "51-60", min: 51, max: 60 },
    ];
    const faixaCount: Record<string, number> = {};
    const repeatCount: Record<number, number> = {};
    const consecCount: Record<number, number> = {};
    const primeCount: Record<number, number> = {};
    const pairCount: Record<string, number> = {};

    draws.forEach((draw, index) => {
      const dz = draw.dezenas;
      let even = 0;
      let consec = 0;
      let primes = 0;
      dz.forEach((n, i) => {
        freq[n] = (freq[n] ?? 0) + 1;
        if (lastIdx[n] === undefined) {
          lastIdx[n] = index;
          lastDate[n] = draw.data_apuracao;
        }
        if (prevSeen[n] !== undefined) {
          (intervals[n] ??= []).push(prevSeen[n]! - index);
        }
        prevSeen[n] = index;
        if (n % 2 === 0) even += 1;
        if (PRIMES.has(n)) primes += 1;
        if (i > 0 && n === dz[i - 1]! + 1) consec += 1;
        for (const f of faixas) if (n >= f.min && n <= f.max) faixaCount[f.label] = (faixaCount[f.label] ?? 0) + 1;
      });
      parity[`${even}p/${6 - even}i`] = (parity[`${even}p/${6 - even}i`] ?? 0) + 1;
      sums.push(dz.reduce((a, b) => a + b, 0));
      consecCount[consec] = (consecCount[consec] ?? 0) + 1;
      primeCount[primes] = (primeCount[primes] ?? 0) + 1;

      // repetição com o concurso anterior (o próximo da lista, que é mais antigo)
      const prev = draws[index + 1];
      if (prev) {
        const rep = dz.filter((n) => prev.dezenas.includes(n)).length;
        repeatCount[rep] = (repeatCount[rep] ?? 0) + 1;
      }
      for (let i = 0; i < dz.length; i++) {
        for (let j = i + 1; j < dz.length; j++) {
          const key = `${dz[i]}-${dz[j]}`;
          pairCount[key] = (pairCount[key] ?? 0) + 1;
        }
      }
    });

    const numbers = Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
      const count = freq[n] ?? 0;
      const idx = lastIdx[n];
      const iv = intervals[n] ?? [];
      const avgInterval = iv.length ? iv.reduce((a, b) => a + b, 0) / iv.length : 0;
      const delay = idx === undefined ? total : idx;
      return {
        numero: n,
        count,
        percent: total ? (count / total) * 100 : 0,
        delay,
        lastDate: lastDate[n] ?? null,
        avgInterval,
        delayIndex: avgInterval ? delay / avgInterval : 0,
        maxInterval: iv.length ? Math.max(...iv) : 0,
      };
    });

    const sumBuckets: Record<string, number> = {};
    for (const s of sums) {
      const bucket = `${Math.floor(s / 20) * 20}-${Math.floor(s / 20) * 20 + 19}`;
      sumBuckets[bucket] = (sumBuckets[bucket] ?? 0) + 1;
    }

    const totalNumbersDrawn = total * 6;

    return {
      total,
      firstDate: draws[total - 1]?.data_apuracao ?? null,
      lastDate: draws[0]?.data_apuracao ?? null,
      lastConcurso: draws[0]?.concurso ?? null,
      numbers,
      hot: [...numbers].sort((a, b) => b.count - a.count).slice(0, 12),
      cold: [...numbers].sort((a, b) => a.count - b.count).slice(0, 12),
      delayed: [...numbers].sort((a, b) => b.delay - a.delay).slice(0, 12),
      parity: Object.entries(parity)
        .map(([label, count]) => ({ label, count, percent: total ? (count / total) * 100 : 0 }))
        .sort((a, b) => b.count - a.count),
      faixas: faixas.map((f) => ({
        label: f.label,
        count: faixaCount[f.label] ?? 0,
        percent: totalNumbersDrawn ? ((faixaCount[f.label] ?? 0) / totalNumbersDrawn) * 100 : 0,
      })),
      sums: {
        min: sums.length ? Math.min(...sums) : 0,
        max: sums.length ? Math.max(...sums) : 0,
        avg: sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0,
        buckets: Object.entries(sumBuckets)
          .map(([label, count]) => ({ label, count, start: Number(label.split("-")[0]) }))
          .sort((a, b) => a.start - b.start),
      },
      repetition: Object.entries(repeatCount)
        .map(([k, count]) => ({ repetidas: Number(k), count, percent: total ? (count / total) * 100 : 0 }))
        .sort((a, b) => a.repetidas - b.repetidas),
      consecutivas: Object.entries(consecCount)
        .map(([k, count]) => ({ pares: Number(k), count, percent: total ? (count / total) * 100 : 0 }))
        .sort((a, b) => a.pares - b.pares),
      primos: Object.entries(primeCount)
        .map(([k, count]) => ({ primos: Number(k), count, percent: total ? (count / total) * 100 : 0 }))
        .sort((a, b) => a.primos - b.primos),
      duplas: Object.entries(pairCount)
        .map(([key, count]) => {
          const [a, b] = key.split("-").map(Number);
          return { a: a!, b: b!, count, percent: total ? (count / total) * 100 : 0 };
        })
        .sort((x, y) => y.count - x.count)
        .slice(0, 20),
    };
  });

/** Histórico paginado / pesquisável de concursos. */
export const getMegaHistory = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.number().min(0).optional().default(0),
        pageSize: z.number().min(5).max(100).optional().default(20),
        concurso: z.number().optional(),
        date: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let query: any = (supabase as any)
      .from("mega_sena_results")
      .select("concurso, data_apuracao, dezenas, acumulou, ganhadores_sena, premio_sena", { count: "exact" })
      .order("concurso", { ascending: false });

    if (data.concurso) query = query.eq("concurso", data.concurso);
    if (data.date) query = query.eq("data_apuracao", data.date);

    const from = data.page * data.pageSize;
    const { data: rows, error, count } = await query.range(from, from + data.pageSize - 1);
    if (error) throw error;
    return {
      rows: ((rows ?? []) as any[]).map((r) => ({
        ...r,
        dezenas: (r.dezenas ?? []).map((n: any) => Number(n)),
      })),
      count: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

/**
 * Robô de auditoria da Mega-Sena.
 * Compara o último concurso gravado no banco com o concurso publicado agora
 * na API oficial da CAIXA. Sem dados simulados: tudo vem das duas fontes reais.
 */
export const getMegaRobotStatus = createServerFn({ method: "GET" }).handler(async () => {
  const fonte = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
  const fonteFallback = "https://api.guidi.dev.br/loteria/megasena/ultimo";
  const site = "https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx";
  const checadoEm = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("mega_sena_results" as any)
    .select("concurso, data_apuracao, updated_at, proximo_concurso, data_proximo_concurso")
    .order("concurso", { ascending: false })
    .limit(1);
  if (error) throw error;
  const local = (rows ?? [])[0] as any | undefined;

  const { count } = await supabase
    .from("mega_sena_results" as any)
    .select("concurso", { count: "exact", head: true });

  let oficial: {
    concurso: number;
    data: string | null;
    proximoConcurso: number | null;
    dataProximo: string | null;
  } | null = null;
  let erroFonte: string | null = null;

  const iso = (br: string | null | undefined) => {
    if (!br || !/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return null;
    const [dd, mm, yyyy] = br.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  try {
    const d = await fetchMegaDraw();
    if (!d) throw new Error("CAIXA indisponível e fonte alternativa sem resposta");
    let current: any = d;
    // o endpoint "último" da CAIXA fica em cache: sondamos os próximos números
    for (let n = Number(current.numero) + 1; n <= Number(current.numero) + 8; n++) {
      const nd = await fetchMegaDraw(n);
      if (!nd || Number(nd.numero) !== n) break;
      current = nd;
    }
    oficial = {
      concurso: Number(current.numero),
      data: iso(current.dataApuracao),
      proximoConcurso: current.numeroConcursoProximo ? Number(current.numeroConcursoProximo) : null,
      dataProximo: iso(current.dataProximoConcurso),
    };
  } catch (e: any) {
    erroFonte = String(e?.message ?? e);
  }


  const atrasoConcursos =
    oficial && local ? Math.max(0, oficial.concurso - Number(local.concurso)) : null;

  return {
    fonte: erroFonte ? fonteFallback : fonte,
    site,
    checadoEm,
    erroFonte,
    total: count ?? 0,
    banco: local
      ? {
          concurso: Number(local.concurso),
          data: local.data_apuracao as string,
          atualizadoEm: local.updated_at as string,
          proximoConcurso: local.proximo_concurso as number | null,
          dataProximo: local.data_proximo_concurso as string | null,
        }
      : null,
    oficial,
    atrasoConcursos,
    emDia: erroFonte === null && atrasoConcursos === 0,
  };
});

/**
 * Próximos sorteios da Mega-Sena.
 * Base real: concurso/data/estimativa publicados pela CAIXA (com fallback no banco).
 * Os sorteios seguintes seguem o calendário oficial: terças, quintas e sábados.
 */
export const getMegaNextDraws = createServerFn({ method: "GET" }).handler(async () => {
  const fonte = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
  const consultadoEm = new Date().toISOString();

  const iso = (br: string | null | undefined) => {
    if (!br || !/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return null;
    const [dd, mm, yyyy] = br.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const { data: rows } = await supabase
    .from("mega_sena_results" as any)
    .select(
      "concurso, data_apuracao, acumulou, proximo_concurso, data_proximo_concurso, valor_estimado_proximo, valor_acumulado, updated_at",
    )
    .order("concurso", { ascending: false })
    .limit(1);
  const local = (rows ?? [])[0] as any | undefined;

  let origem: "oficial" | "banco" = "banco";
  let erroFonte: string | null = null;
  let proximoConcurso: number | null = local?.proximo_concurso ?? null;
  let dataProximo: string | null = local?.data_proximo_concurso ?? null;
  let estimativa: number | null = local?.valor_estimado_proximo ?? null;
  let acumulado: number | null = local?.valor_acumulado ?? null;
  let ultimoConcurso: number | null = local ? Number(local.concurso) : null;
  let ultimaData: string | null = local?.data_apuracao ?? null;
  let acumulou: boolean = !!local?.acumulou;

  try {
    const d = await fetchMegaDraw();
    if (!d) throw new Error("CAIXA indisponível e fonte alternativa sem resposta");
    let current: any = d;
    for (let n = Number(current.numero) + 1; n <= Number(current.numero) + 8; n++) {
      const nd = await fetchMegaDraw(n);
      if (!nd || Number(nd.numero) !== n) break;
      current = nd;
    }
    origem = "oficial";
    ultimoConcurso = Number(current.numero);
    ultimaData = iso(current.dataApuracao);
    acumulou = !!current.acumulado;
    proximoConcurso = current.numeroConcursoProximo ? Number(current.numeroConcursoProximo) : Number(current.numero) + 1;
    dataProximo = iso(current.dataProximoConcurso);
    estimativa = current.valorEstimadoProximoConcurso ?? null;
    acumulado = current.valorAcumuladoProximoConcurso ?? current.valorAcumuladoConcurso_0_5 ?? null;
  } catch (e: any) {
    erroFonte = String(e?.message ?? e);
  }

  // Calendário oficial: terça (2), quinta (4) e sábado (6)
  const DIAS = [2, 4, 6];
  const nomeDia = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const proximos: Array<{ concurso: number | null; data: string; diaSemana: string; estimado: number | null }> = [];

  let cursor: Date;
  if (dataProximo) {
    const [y = 1970, m = 1, dd = 1] = dataProximo.split("-").map(Number);
    cursor = new Date(Date.UTC(y, m - 1, dd));

  } else {
    const hoje = new Date();
    cursor = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
    while (!DIAS.includes(cursor.getUTCDay())) cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let numero = proximoConcurso;
  for (let i = 0; i < 6; i++) {
    if (i > 0) {
      do {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      } while (!DIAS.includes(cursor.getUTCDay()));
      if (numero !== null) numero += 1;
    }
    proximos.push({
      concurso: numero,
      data: cursor.toISOString().slice(0, 10),
      diaSemana: nomeDia[cursor.getUTCDay()]!,
      estimado: i === 0 ? estimativa : null,
    });
  }

  return {
    fonte,
    origem,
    erroFonte,
    consultadoEm,
    atualizadoEm: (local?.updated_at as string | null) ?? null,
    ultimo: ultimoConcurso ? { concurso: ultimoConcurso, data: ultimaData, acumulou } : null,
    proximoConcurso,
    dataProximo,
    estimativa,
    acumulado,
    proximos,
  };
});
