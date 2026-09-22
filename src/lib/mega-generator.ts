/**
 * Gerador transparente de combinações da Mega-Sena.
 * Nenhuma função aqui prevê resultado: apenas monta combinações válidas
 * respeitando os filtros escolhidos pelo usuário.
 */

export const PRIMOS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]);

export function combinations(n: number, k = 6): number {
  if (n < k) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** Preço oficial configurável (aposta simples de 6 dezenas). */
export const PRECO_APOSTA_SIMPLES = 6;

export function precoAposta(dezenas: number, precoSimples = PRECO_APOSTA_SIMPLES): number {
  return combinations(dezenas, 6) * precoSimples;
}

export type GeneratorFilters = {
  dezenasPorJogo: number;
  quantidadeJogos: number;
  minPares: number;
  maxPares: number;
  somaMin: number;
  somaMax: number;
  maxConsecutivas: number;
  obrigatorias: number[];
  excluidas: number[];
  maxRepeticaoUltimo: number;
  maxSobreposicao: number;
  orcamento: number | null;
  modo: "aleatorio" | "quentes" | "atrasadas" | "equilibrado";
};

export const defaultFilters: GeneratorFilters = {
  dezenasPorJogo: 6,
  quantidadeJogos: 5,
  minPares: 2,
  maxPares: 4,
  somaMin: 100,
  somaMax: 260,
  maxConsecutivas: 2,
  obrigatorias: [],
  excluidas: [],
  maxRepeticaoUltimo: 3,
  maxSobreposicao: 4,
  orcamento: null,
  modo: "equilibrado",
};

export type GeneratorResult = {
  jogos: number[][];
  custo: number;
  probabilidadeSena: number;
  diversidade: number;
  erro: string | null;
  metodo: string;
};

function secureRandom(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! % max;
  }
  return Math.floor(Math.random() * max);
}

function pickWeighted(pool: number[], weights: Map<number, number>, count: number): number[] {
  const chosen: number[] = [];
  const available = [...pool];
  const w = available.map((n) => Math.max(0.0001, weights.get(n) ?? 1));
  for (let k = 0; k < count && available.length; k++) {
    const totalW = w.reduce((a, b) => a + b, 0);
    let r = (secureRandom(1_000_000) / 1_000_000) * totalW;
    let idx = 0;
    while (idx < available.length - 1 && r > w[idx]!) {
      r -= w[idx]!;
      idx++;
    }
    chosen.push(available[idx]!);
    available.splice(idx, 1);
    w.splice(idx, 1);
  }
  return chosen.sort((a, b) => a - b);
}

function consecutivas(jogo: number[]): number {
  let max = 1;
  let run = 1;
  for (let i = 1; i < jogo.length; i++) {
    if (jogo[i] === jogo[i - 1]! + 1) {
      run++;
      max = Math.max(max, run);
    } else run = 1;
  }
  return max;
}

export function validarFiltros(f: GeneratorFilters): string | null {
  if (f.dezenasPorJogo < 6 || f.dezenasPorJogo > 20) return "A quantidade de dezenas por jogo deve ficar entre 6 e 20.";
  if (f.obrigatorias.length > f.dezenasPorJogo)
    return "Você marcou mais dezenas obrigatórias do que o tamanho do jogo.";
  if (f.obrigatorias.some((n) => f.excluidas.includes(n)))
    return "Uma mesma dezena não pode ser obrigatória e excluída ao mesmo tempo.";
  if (60 - f.excluidas.length < f.dezenasPorJogo)
    return "Você excluiu dezenas demais: não sobram números suficientes para montar o jogo.";
  if (f.minPares > f.maxPares) return "O mínimo de pares não pode ser maior que o máximo.";
  if (f.somaMin > f.somaMax) return "A soma mínima não pode ser maior que a soma máxima.";
  if (f.orcamento !== null && f.orcamento < precoAposta(f.dezenasPorJogo))
    return "O orçamento informado não cobre nem um jogo com essa quantidade de dezenas.";
  return null;
}

export function gerarJogos(
  f: GeneratorFilters,
  ctx: { quentes?: number[]; atrasadas?: number[]; ultimoConcurso?: number[] } = {},
): GeneratorResult {
  const erro = validarFiltros(f);
  const metodoLabel: Record<GeneratorFilters["modo"], string> = {
    aleatorio: "Aleatório com semente segura",
    quentes: "Ponderado pelas dezenas mais sorteadas do histórico",
    atrasadas: "Ponderado pelas dezenas com maior atraso",
    equilibrado: "Equilíbrio entre frequência e atraso",
  };
  if (erro) return { jogos: [], custo: 0, probabilidadeSena: 0, diversidade: 0, erro, metodo: metodoLabel[f.modo] };

  const pool = Array.from({ length: 60 }, (_, i) => i + 1).filter(
    (n) => !f.excluidas.includes(n) && !f.obrigatorias.includes(n),
  );

  const weights = new Map<number, number>();
  const quentes = ctx.quentes ?? [];
  const atrasadas = ctx.atrasadas ?? [];
  for (const n of pool) {
    let w = 1;
    if (f.modo === "quentes") w = quentes.includes(n) ? 3 : 1;
    if (f.modo === "atrasadas") w = atrasadas.includes(n) ? 3 : 1;
    if (f.modo === "equilibrado") w = quentes.includes(n) || atrasadas.includes(n) ? 2 : 1;
    weights.set(n, w);
  }

  const jogos: number[][] = [];
  const maxJogos = Math.max(1, Math.min(f.quantidadeJogos, 50));
  const custoUnitario = precoAposta(f.dezenasPorJogo);
  const limitePorOrcamento = f.orcamento !== null ? Math.floor(f.orcamento / custoUnitario) : maxJogos;
  const alvo = Math.min(maxJogos, Math.max(1, limitePorOrcamento));

  let tentativas = 0;
  while (jogos.length < alvo && tentativas < 20000) {
    tentativas++;
    const restantes = f.dezenasPorJogo - f.obrigatorias.length;
    const jogo = [...f.obrigatorias, ...pickWeighted(pool, weights, restantes)].sort((a, b) => a - b);
    if (new Set(jogo).size !== f.dezenasPorJogo) continue;

    const pares = jogo.filter((n) => n % 2 === 0).length;
    if (pares < f.minPares || pares > f.maxPares) continue;

    const soma = jogo.reduce((a, b) => a + b, 0);
    if (soma < f.somaMin || soma > f.somaMax) continue;
    if (consecutivas(jogo) > Math.max(1, f.maxConsecutivas)) continue;

    if (ctx.ultimoConcurso?.length) {
      const rep = jogo.filter((n) => ctx.ultimoConcurso!.includes(n)).length;
      if (rep > f.maxRepeticaoUltimo) continue;
    }
    if (jogos.some((j) => j.filter((n) => jogo.includes(n)).length > f.maxSobreposicao)) continue;
    if (jogos.some((j) => j.join(",") === jogo.join(","))) continue;

    jogos.push(jogo);
  }

  if (!jogos.length) {
    return {
      jogos: [],
      custo: 0,
      probabilidadeSena: 0,
      diversidade: 0,
      erro: "As regras escolhidas são incompatíveis entre si. Amplie a faixa de soma, de pares ou reduza as restrições.",
      metodo: metodoLabel[f.modo],
    };
  }

  let sobreposicoes = 0;
  let paresComparados = 0;
  for (let i = 0; i < jogos.length; i++) {
    for (let j = i + 1; j < jogos.length; j++) {
      sobreposicoes += jogos[i]!.filter((n) => jogos[j]!.includes(n)).length;
      paresComparados++;
    }
  }
  const diversidade = paresComparados ? 1 - sobreposicoes / paresComparados / f.dezenasPorJogo : 1;

  const combinacoesCobertas = jogos.length * combinations(f.dezenasPorJogo, 6);
  return {
    jogos,
    custo: jogos.length * custoUnitario,
    probabilidadeSena: combinacoesCobertas / 50_063_860,
    diversidade,
    erro: null,
    metodo: metodoLabel[f.modo],
  };
}
