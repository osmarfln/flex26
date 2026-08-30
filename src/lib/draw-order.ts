// Ordem oficial dos horários de sorteio (do primeiro ao último do dia)
export const TIME_ORDER_RIO = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"] as const;
export const TIME_ORDER_FEDERAL = ["FED-11", "FED-20"] as const;
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

const PRIORITY_FEDERAL: Record<string, number> = { "FED-11": 0, "FED-20": 1 };

export function timePriority(timeType?: string | null, location: 'rio' | 'capital' | 'federal' = 'rio'): number {
  if (!timeType) return 99;
  const key = String(timeType).toUpperCase().trim();
  if (location === 'capital') return PRIORITY_CAPITAL[key] ?? 99;
  if (location === 'federal') return PRIORITY_FEDERAL[key] ?? 99;
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
  { timeType: "COR", timeValue: "21:30", label: "CORUJA 21:30" },
];

/** Legado para manter compatibilidade */
export const DRAW_SCHEDULE = DRAW_SCHEDULE_RIO;

/** Horários oficiais da Capital (Florianópolis). Rótulos: CAPITAL nos 14:00/18:00 e LCAP nos demais. */
export const DRAW_SCHEDULE_CAPITAL: { timeType: string; timeValue: string; label: string }[] = [
  { timeType: "L-09", timeValue: "09:00", label: "LCAP 09:00" },
  { timeType: "L-10", timeValue: "10:00", label: "LCAP 10:00" },
  { timeType: "L-11", timeValue: "11:00", label: "LCAP 11:00" },
  { timeType: "L-13", timeValue: "13:00", label: "LCAP 13:00" },
  { timeType: "L-14", timeValue: "14:00", label: "CAPITAL 14:00" },
  { timeType: "L-15", timeValue: "15:00", label: "LCAP 15:00" },
  { timeType: "L-16", timeValue: "16:00", label: "LCAP 16:00" },
  { timeType: "L-18", timeValue: "18:00", label: "CAPITAL 18:00" },
  { timeType: "L-19", timeValue: "19:00", label: "CAPITAL 19:00" },
  { timeType: "L-20", timeValue: "20:30", label: "LCAP 20:30" },
  { timeType: "L-22", timeValue: "22:30", label: "LCAP 22:30" },
];

/**
 * Horários oficiais da LOTERIA FEDERAL.
 * Quartas-feiras às 20:30 e domingos às 11:00 (2 extrações por semana).
 */
export const DRAW_SCHEDULE_FEDERAL: { timeType: string; timeValue: string; label: string }[] = [
  { timeType: "FED-11", timeValue: "11:00", label: "FEDERAL 11:00" },
  { timeType: "FED-20", timeValue: "20:30", label: "FEDERAL 20:30" },
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

/** Dia da semana (0=domingo ... 6=sábado) de uma data YYYY-MM-DD. */
export function weekdayOfISO(dateISO?: string | null): number {
  const iso = dateISO || brasiliaDateISO();
  return new Date(`${iso}T12:00:00`).getDay();
}

/**
 * Grade oficial válida para a data informada:
 * - Rio: aos domingos há apenas PT (14:20) e PTV (16:20).
 * - Capital:
 *   - Seg a sex e domingo: 09, 10, 11, 13, CAPITAL 14, 15, 16, CAPITAL 18, 20:30, 22:30.
 *   - Sábado: no lugar da CAPITAL 18:00 entra LCAP 18:00 e é adicionada a CAPITAL 19:00.
 */
export function getScheduleForDate(
  location: 'rio' | 'capital' | 'federal' = 'rio',
  dateISO?: string | null,
) {
  const weekday = weekdayOfISO(dateISO);
  if (location === 'federal') {
    // Quarta-feira (3) -> 20:30 | Domingo (0) -> 11:00 | demais dias sem extração
    if (weekday === 3) return DRAW_SCHEDULE_FEDERAL.filter((s) => s.timeType === 'FED-20');
    if (weekday === 0) return DRAW_SCHEDULE_FEDERAL.filter((s) => s.timeType === 'FED-11');
    return [];
  }
  if (location === 'capital') {
    const isSaturday = weekday === 6;
    return DRAW_SCHEDULE_CAPITAL
      .filter((s) => (s.timeType === 'L-19' ? isSaturday : true))
      .map((s) =>
        s.timeType === 'L-18' && isSaturday ? { ...s, label: 'LCAP 18:00' } : s,
      );
  }
  if (weekday === 0) {
    return DRAW_SCHEDULE_RIO.filter((s) => s.timeType === 'PT' || s.timeType === 'PTV');
  }
  return DRAW_SCHEDULE_RIO;
}

/** Rótulo oficial de um horário (ex.: "CAPITAL 14:00", "LCAP 09:00", "PTM"). */
export function drawLabel(
  location: 'rio' | 'capital' | 'federal' | string | null | undefined,
  timeType?: string | null,
  dateISO?: string | null,
): string {
  const key = String(timeType ?? '').toUpperCase().trim();
  if (!key) return '--';
  const loc = location === 'capital' ? 'capital' : location === 'federal' ? 'federal' : 'rio';
  const all = loc === 'capital' ? DRAW_SCHEDULE_CAPITAL : loc === 'federal' ? DRAW_SCHEDULE_FEDERAL : DRAW_SCHEDULE_RIO;
  const found = getScheduleForDate(loc, dateISO).find((s) => s.timeType === key)
    ?? all.find((s) => s.timeType === key);
  return found?.label ?? key;
}

/** Horário oficial (HH:mm) de um time_type. */
export function drawTimeValue(
  location: 'rio' | 'capital' | 'federal' | string | null | undefined,
  timeType?: string | null,
): string {
  const key = String(timeType ?? '').toUpperCase().trim();
  const list = location === 'capital' ? DRAW_SCHEDULE_CAPITAL : location === 'federal' ? DRAW_SCHEDULE_FEDERAL : DRAW_SCHEDULE_RIO;
  return list.find((s) => s.timeType === key)?.timeValue ?? '--:--';
}

/** Calcula o próximo sorteio baseado na localização e hora atual de Brasília */
export function getNextDraw(location: 'rio' | 'capital' | 'federal' = 'rio') {
  const now = new Date();
  
  // Format current Brasília time as HH:mm
  const brasiliaTimeStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  
  const schedule = getScheduleForDate(location, brasiliaDateISO());
  
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
  
  // If all draws for today have passed, walk forward until the next day with draws
  const base = new Date(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo'
  }).format(now));
  for (let i = 1; i <= 8; i++) {
    const day = new Date(base);
    day.setDate(day.getDate() + i);
    const dayISO = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const daySchedule = getScheduleForDate(location, dayISO);
    if (daySchedule.length > 0) {
      return { ...daySchedule[0]!, date: day };
    }
  }

  return { ...(schedule[0] ?? DRAW_SCHEDULE_RIO[0]!), date: base };
}

/** Nome oficial da localidade em letras maiúsculas. */
export function locationName(location: 'rio' | 'capital' | 'federal'): string {
  if (location === 'federal') return 'LOTERIA FEDERAL';
  return location === 'rio' ? 'RIO DE JANEIRO' : 'CAPITAL & LCAP';
}
