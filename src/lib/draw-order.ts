// Ordem oficial dos horários de sorteio (do primeiro ao último do dia)
export const TIME_ORDER_RIO = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"] as const;
export const TIME_ORDER_CAPITAL = ["L-09", "L-10", "L-11", "L-13", "L-14", "L-15", "L-16", "L-18", "L-19", "L-20", "L-22"] as const;

/** Legado para manter compatibilidade com componentes que ainda não foram migrados para suporte a Capital */
export const TIME_ORDER = TIME_ORDER_RIO;

const PRIORITY_RIO: Record<string, number> = {
  PPT: 0,
  PTM: 1,
  PT: 2,
  PTV: 3,
  PTN: 4,
  COR: 5,
};

const PRIORITY_CAPITAL: Record<string, number> = {
  "L-09": 0, "L-10": 1, "L-11": 2, "L-13": 3, "L-14": 4, "L-15": 5, "L-16": 6, "L-18": 7, "L-19": 8, "L-20": 9, "L-22": 10
};

export function timePriority(timeType?: string | null, location: 'rio' | 'capital' = 'rio'): number {
  if (!timeType) return 99;
  const key = String(timeType).toUpperCase().trim();
  if (location === 'capital') return PRIORITY_CAPITAL[key] ?? 99;
  return PRIORITY_RIO[key] ?? 99;
}

/**
 * Ordena os concursos do mais recente para o mais antigo:
 * primeiro por data, depois pelo horário oficial do dia.
 */
export function sortDrawsDesc<T extends { date: string; time_type?: string | null; location?: any }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const locA = a.location || 'rio';
    const locB = b.location || 'rio';
    return timePriority(b.time_type, locB) - timePriority(a.time_type, locA);
  });
}

/** Horários oficiais do Rio (RJ) publicados diariamente. */
export const DRAW_SCHEDULE_RIO: { timeType: string; timeValue: string; label: string }[] = [
  { timeType: "PPT", timeValue: "09:20", label: "PPT" },
  { timeType: "PTM", timeValue: "11:20", label: "PTM" },
  { timeType: "PT", timeValue: "14:20", label: "PT" },
  { timeType: "PTV", timeValue: "16:20", label: "PTV" },
  { timeType: "PTN", timeValue: "18:20", label: "PTN" },
  { timeType: "COR", timeValue: "21:30", label: "COROADO" },
];

/** Legado para manter compatibilidade */
export const DRAW_SCHEDULE = DRAW_SCHEDULE_RIO;

/** Horários oficiais da Capital (Florianópolis). */
export const DRAW_SCHEDULE_CAPITAL: { timeType: string; timeValue: string; label: string }[] = [
  { timeType: "L-09", timeValue: "09:00", label: "LCap 09:00" },
  { timeType: "L-10", timeValue: "10:00", label: "LCap 10:00" },
  { timeType: "L-11", timeValue: "11:00", label: "LCap 11:00" },
  { timeType: "L-13", timeValue: "13:00", label: "LCap 13:00" },
  { timeType: "L-14", timeValue: "14:00", label: "LCap 14:00" },
  { timeType: "L-15", timeValue: "15:00", label: "LCap 15:00" },
  { timeType: "L-16", timeValue: "16:00", label: "LCap 16:00" },
  { timeType: "L-18", timeValue: "18:00", label: "LCap 18:00" },
  { timeType: "L-19", timeValue: "19:00", label: "Cap 19:00" },
  { timeType: "L-20", timeValue: "20:30", label: "LCap 20:30" },
  { timeType: "L-22", timeValue: "22:30", label: "LCap 22:30" },
];

/** Data de hoje no fuso de Brasília (UTC-3) no formato YYYY-MM-DD. */
export function brasiliaDateISO(d: Date = new Date()): string {
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().split("T")[0]!;
}

/** Obtém a data e hora atual em Brasília (UTC-3) */
export function getBrasiliaTime(): Date {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

/** Calcula o próximo sorteio baseado na localização e hora atual de Brasília */
export function getNextDraw(location: 'rio' | 'capital' = 'rio') {
  const now = new Date();
  
  // Format current Brasília time as HH:mm
  const brasiliaTimeStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  
  const schedule = location === 'capital' ? DRAW_SCHEDULE_CAPITAL : DRAW_SCHEDULE_RIO;
  
  // Find the first draw in the schedule that is later than the current time
  const next = schedule.find(s => s.timeValue > brasiliaTimeStr);
  
  if (next) {
    // Current date in Brasília context
    const brasiliaToday = new Date(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo'
    }).format(now));
    
    return {
      ...next,
      date: brasiliaToday
    };
  }
  
  // If all draws for today have passed, get the first draw of tomorrow
  const tomorrow = new Date(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo'
  }).format(now));
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    ...schedule[0],
    date: tomorrow
  };
}
