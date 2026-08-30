import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import { getScheduleForDate, brasiliaDateISO } from "@/lib/draw-order";
import { z } from "zod";


const EXTERNAL_REST_URL = "https://tembxrechkrpabvrfrmk.supabase.co/rest/v1";
const EXTERNAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbWJ4cmVjaGtycGFidnJmcm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzkzODYsImV4cCI6MjA5NjkxNTM4Nn0.-GjcGBLvDHqng5Rtgj32o2IVJOetcr_a9smJUity_Mc";

type ScheduleRow = {
  timeType: string;
  timeValue: string;
  label: string;
  status: "sincronizado" | "divergente" | "pendente" | "aguardando";
  ourFirstPrize: string | null;
  sourceFirstPrize: string | null;
  animal: string | null;
  capturedAt: string | null;
  sourceUpdatedAt: string | null;
};

async function fetchSource(date: string, location: string = 'rio') {
  const externalTable = location === 'capital' ? 'capital_results' : 'draw_results';
  const url = `${EXTERNAL_REST_URL}/${externalTable}?draw_date=eq.${date}&select=*`;
  
  const res = await fetch(url, {
    headers: {
      apikey: EXTERNAL_ANON_KEY,
      Authorization: `Bearer ${EXTERNAL_ANON_KEY}`,
    },
  });
  
  if (!res.ok) throw new Error(`Fonte respondeu ${res.status}`);
  return (await res.json()) as any[];
}

/**
 * Compara, horário por horário, o que existe na plataforma com o que existe
 * na base de origem — prova de que o robô está capturando corretamente.
 */
export const getScheduleSyncMatrix = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital', 'federal']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data: { location } }) => {

    const date = brasiliaDateISO();
    const nowBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const minutesNow = nowBrasilia.getUTCHours() * 60 + nowBrasilia.getUTCMinutes();

    const { data: ours, error } = await supabase
      .from("lottery_results")
      .select("time_type, time_value, results, animal, created_at, location")
      .eq("date", date)
      .eq("location", location);

    if (error) throw error;

    let source: any[] = [];
    let sourceOnline = true;
    let sourceError: string | null = null;
    try {
      source = await fetchSource(date, location);
    } catch (e: any) {
      sourceOnline = false;
      sourceError = e?.message ?? "Falha ao consultar a base de origem";
    }

    const rows: ScheduleRow[] = getScheduleForDate(location, date).map((s: any) => {
      const mine = (ours ?? []).find((r) => r.time_type === s.timeType);
      const src = source.find((r) => {
        // Capital: somente siglas oficiais LCAP_/CAP_ são aceitas na origem
        if (location === 'capital') {
          const key = String(r.draw_time ?? '').trim().toUpperCase();
          if (!key.startsWith('LCAP_') && !key.startsWith('CAP_')) return false;
          const capMap: Record<string, string> = {
            'LCAP_09': 'L-09', 'CAP_09': 'L-09', 'LCAP_10': 'L-10', 'CAP_10': 'L-10',
            'LCAP_11': 'L-11', 'CAP_11': 'L-11', 'LCAP_13': 'L-13', 'CAP_13': 'L-13',
            'LCAP_14': 'L-14', 'CAP_14': 'L-14', 'LCAP_15': 'L-15', 'CAP_15': 'L-15',
            'LCAP_16': 'L-16', 'CAP_16': 'L-16', 'LCAP_18': 'L-18', 'CAP_18': 'L-18',
            'LCAP_19': 'L-19', 'CAP_19': 'L-19', 'LCAP_20': 'L-20', 'CAP_20': 'L-20',
            'LCAP_2230': 'L-22', 'CAP_2230': 'L-22'
          };
          const mapped = capMap[key];
          return !!mapped && mapped === s.timeType;
        }
        const RIO_KEYS = ['PPT', 'PTM', 'PT', 'PTV', 'PTN', 'COR'];
        return RIO_KEYS.includes(r.draw_time) && r.draw_time === s.timeType;
      });

      const [hh, mm] = s.timeValue.split(":").map(Number);
      const drawMinutes = (hh ?? 0) * 60 + (mm ?? 0);

      const ourFirstPrize = mine?.results?.[0] ?? null;
      const sourceFirstPrize = src?.prize_1_milhar ?? null;

      let status: ScheduleRow["status"];
      if (ourFirstPrize && sourceFirstPrize) {
        status = ourFirstPrize === sourceFirstPrize ? "sincronizado" : "divergente";
      } else if (ourFirstPrize) {
        status = "sincronizado";
      } else if (sourceFirstPrize) {
        status = "pendente"; // existe na origem, ainda não importado
      } else {
        status = "aguardando"; // sorteio ainda não publicado
      }

      return {
        timeType: s.timeType,
        timeValue: s.timeValue,
        label: s.label,
        status,
        ourFirstPrize,
        sourceFirstPrize,
        animal: mine?.animal ?? src?.prize_1_bicho ?? null,
        capturedAt: mine?.created_at ?? null,
        sourceUpdatedAt: src?.updated_at ?? src?.scraped_at ?? null,
        past: drawMinutes <= minutesNow,
      } as ScheduleRow & { past: boolean };
    });

    return {
      date,
      generatedAt: new Date().toISOString(),
      sourceOnline,
      sourceError,
      rows,
    };
  },
);

/** Dispara uma sincronização imediata do robô. */
export const runSyncNow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital', 'federal']).optional().default('rio'),
    daysToSync: z.number().optional().default(2)
  }).optional().default({}).parse(data ?? {}))
  .handler(async ({ data: { location, daysToSync } }) => {

  const origin = new URL(getRequest().url).origin;
  const res = await fetch(`${origin}/api/public/sync-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daysToSync, location }),
  });
  const payload = (await res.json().catch(() => ({}))) as any;
  return {
    ok: res.ok && payload?.success !== false,
    synced: payload?.synced ?? 0,
    error: payload?.error ?? (res.ok ? null : `HTTP ${res.status}`),
  };
});
