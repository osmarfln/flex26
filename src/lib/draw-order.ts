// Ordem oficial dos horários de sorteio (do primeiro ao último do dia)
export const TIME_ORDER = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"] as const;

const PRIORITY: Record<string, number> = {
  PPT: 0,
  PTM: 1,
  PT: 2,
  PTV: 3,
  PTN: 4,
  COR: 5,
};

export function timePriority(timeType?: string | null): number {
  if (!timeType) return 99;
  const key = String(timeType).toUpperCase().trim();
  return PRIORITY[key] ?? 99;
}

/**
 * Ordena os concursos do mais recente para o mais antigo:
 * primeiro por data, depois pelo horário oficial do dia.
 */
export function sortDrawsDesc<T extends { date: string; time_type?: string | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return timePriority(b.time_type) - timePriority(a.time_type);
  });
}
