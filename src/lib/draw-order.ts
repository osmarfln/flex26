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

/** Horários oficiais do Rio (RJ) publicados diariamente. */
export const DRAW_SCHEDULE: { timeType: string; timeValue: string; label: string }[] = [
  { timeType: "PPT", timeValue: "09:20", label: "PPT" },
  { timeType: "PTM", timeValue: "11:20", label: "PTM" },
  { timeType: "PT", timeValue: "14:20", label: "PT" },
  { timeType: "PTV", timeValue: "16:20", label: "PTV" },
  { timeType: "PTN", timeValue: "18:20", label: "PTN" },
  { timeType: "COR", timeValue: "21:20", label: "COROADO" },
];

/** Data de hoje no fuso de Brasília (UTC-3) no formato YYYY-MM-DD. */
export function brasiliaDateISO(d: Date = new Date()): string {
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().split("T")[0]!;
}
