import { type Contest, groupOfTen, normalizePrize, tensOfGroup } from "./federal-intel.server";

/**
 * Atraso calculado EXCLUSIVAMENTE pelo 1º prêmio.
 *
 * Regra do negócio: o grupo (ou a dezena) só sai da lista de atrasados quando
 * aparecer no 1º prêmio. Enquanto isso não acontecer, o atraso continua
 * crescendo resultado por resultado e a ordem do ranking não muda.
 *
 * Tudo é medido sobre o histórico real já sincronizado (lottery_results),
 * concurso a concurso e horário a horário — sem dados simulados.
 */

export interface FirstPrizeFaixa {
  timeType: string;
  label: string;
  /** Extrações daquele horário desde a última aparição no 1º prêmio */
  delay: number;
  editions: number;
  occurrences: number;
  lastDate: string | null;
}

export interface FirstPrizeRow {
  value: string;
  /** dezena que gerou a última aparição (para grupos) */
  lastTen: string | null;
  /** Concursos (qualquer horário) desde a última vez no 1º prêmio */
  delay: number;
  /** Dias corridos desde a última vez no 1º prêmio */
  daysDelay: number | null;
  lastDate: string | null;
  lastTimeType: string | null;
  occurrences: number;
  avgInterval: number | null;
  delayIndex: number | null;
  maxDelay: number;
  /** % dos ciclos históricos já superados pelo atraso atual (0-100) */
  percentile: number;
  classification: string;
  byFaixa: Record<string, FirstPrizeFaixa>;
}

export interface FirstPrizeDelay {
  totalContests: number;
  lastContest: { date: string; timeType: string; firstPrize: string; ten: string; group: string } | null;
  groups: FirstPrizeRow[];
  tens: FirstPrizeRow[];
  faixas: { timeType: string; label: string; editions: number }[];
}

function classify(index: number | null): string {
  if (index === null) return "sem dados";
  if (index < 0.75) return "atraso baixo";
  if (index < 1.5) return "atraso normal";
  if (index < 2.5) return "atraso elevado";
  return "atraso muito elevado";
}

function daysBetween(fromISO: string | null): number | null {
  if (!fromISO) return null;
  const a = new Date(`${fromISO}T12:00:00`).getTime();
  return Math.max(0, Math.round((Date.now() - a) / 86_400_000));
}

function buildRows(
  contests: Contest[],
  keys: string[],
  keyOf: (ten: string) => string,
  schedule: { timeType: string; label: string }[],
): FirstPrizeRow[] {
  const total = contests.length;

  const occ = new Map<string, number[]>(); // índices de concurso (0 = mais recente)
  const lastTen = new Map<string, string>();
  const faixaOcc = new Map<string, Map<string, number[]>>(); // timeType -> key -> índices dentro da faixa
  const faixaEditions = new Map<string, number>();
  const faixaLastDate = new Map<string, string>(); // `${timeType}|${key}`

  for (const s of schedule) {
    faixaOcc.set(s.timeType, new Map());
    faixaEditions.set(s.timeType, 0);
  }

  contests.forEach((c, idx) => {
    const prize = c.prizes[0];
    if (!prize) return;
    const { dezena } = normalizePrize(prize);
    const key = keyOf(dezena);
    if (!occ.has(key)) occ.set(key, []);
    occ.get(key)!.push(idx);
    if (!lastTen.has(key)) lastTen.set(key, dezena);

    const fo = faixaOcc.get(c.time_type);
    if (fo) {
      const edIdx = faixaEditions.get(c.time_type) ?? 0;
      faixaEditions.set(c.time_type, edIdx + 1);
      if (!fo.has(key)) fo.set(key, []);
      fo.get(key)!.push(edIdx);
      const lk = `${c.time_type}|${key}`;
      if (!faixaLastDate.has(lk)) faixaLastDate.set(lk, c.date);
    }
  });

  return keys.map((key) => {
    const list = occ.get(key) ?? [];
    const delay = list.length ? list[0]! : total;
    const gaps: number[] = [];
    for (let i = 0; i < list.length - 1; i++) gaps.push(list[i + 1]! - list[i]!);
    const tail = list.length ? total - 1 - list[list.length - 1]! : total;
    const avgInterval = gaps.length
      ? gaps.reduce((a, b) => a + b, 0) / gaps.length
      : list.length
        ? total / list.length
        : null;
    const maxDelay = Math.max(delay, tail, ...(gaps.length ? gaps : [0]));
    const delayIndex = avgInterval && avgInterval > 0 ? delay / avgInterval : null;
    const percentile = gaps.length
      ? (gaps.filter((g) => g <= delay).length / gaps.length) * 100
      : delay >= total
        ? 100
        : 0;

    const lastIdx = list.length ? list[0]! : null;
    const lastContest = lastIdx !== null ? contests[lastIdx] ?? null : null;

    const byFaixa: Record<string, FirstPrizeFaixa> = {};
    for (const s of schedule) {
      const editions = faixaEditions.get(s.timeType) ?? 0;
      const fl = faixaOcc.get(s.timeType)?.get(key) ?? [];
      byFaixa[s.timeType] = {
        timeType: s.timeType,
        label: s.label,
        delay: fl.length ? fl[0]! : editions,
        editions,
        occurrences: fl.length,
        lastDate: faixaLastDate.get(`${s.timeType}|${key}`) ?? null,
      };
    }

    return {
      value: key,
      lastTen: lastTen.get(key) ?? null,
      delay,
      daysDelay: daysBetween(lastContest?.date ?? null),
      lastDate: lastContest?.date ?? null,
      lastTimeType: lastContest?.time_type ?? null,
      occurrences: list.length,
      avgInterval,
      delayIndex,
      maxDelay,
      percentile: Math.round(percentile),
      classification: classify(delayIndex),
      byFaixa,
    };
  });
}

/**
 * Monta o ranking de atraso por 1º prêmio (grupos e dezenas).
 * `contests` precisa vir do mais recente para o mais antigo.
 */
export function buildFirstPrizeDelay(
  contests: Contest[],
  schedule: { timeType: string; label: string }[],
): FirstPrizeDelay {
  const groupKeys = Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, "0"));
  const tenKeys = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));

  const groups = buildRows(contests, groupKeys, (ten) => groupOfTen(ten), schedule).sort(
    (a, b) => b.delay - a.delay || Number(a.value) - Number(b.value),
  );
  const tens = buildRows(contests, tenKeys, (ten) => ten, schedule).sort(
    (a, b) => b.delay - a.delay || Number(a.value) - Number(b.value),
  );

  const first = contests[0] ?? null;
  const firstPrize = first?.prizes[0] ?? null;
  const norm = firstPrize ? normalizePrize(firstPrize) : null;

  return {
    totalContests: contests.length,
    lastContest:
      first && norm
        ? {
            date: first.date,
            timeType: first.time_type,
            firstPrize: norm.quatro,
            ten: norm.dezena,
            group: norm.grupo,
          }
        : null,
    groups,
    tens,
    faixas: schedule.map((s) => ({
      timeType: s.timeType,
      label: s.label,
      editions: contests.filter((c) => c.time_type === s.timeType && c.prizes[0]).length,
    })),
  };
}

export { tensOfGroup };
