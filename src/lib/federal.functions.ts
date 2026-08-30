import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { brasiliaDateISO } from "@/lib/draw-order";

/**
 * Status de sincronização exclusivo da LOTERIA FEDERAL.
 * Traz a última atualização, a quantidade de concursos importados
 * (total e por ano) e as possíveis falhas (datas oficiais sem resultado).
 */
export const getFederalSyncStatus = createServerFn({ method: "GET" }).handler(async () => {
  const today = brasiliaDateISO();

  const { data: rows, error } = await supabase
    .from("lottery_results")
    .select("date, time_type, time_value, results, animal, animal_group, created_at")
    .eq("location", "federal")
    .order("date", { ascending: false })
    .limit(2000);

  if (error) throw error;

  const all = rows ?? [];

  const byYear: Record<string, number> = {};
  for (const r of all) {
    const y = String(r.date).slice(0, 4);
    byYear[y] = (byYear[y] ?? 0) + 1;
  }

  const lastImportedAt = all.reduce<string | null>((acc, r) => {
    const c = r.created_at ?? null;
    if (!c) return acc;
    return !acc || c > acc ? c : acc;
  }, null);

  // Concursos oficiais esperados em 2026: quarta-feira (20:30) e domingo (11:00)
  const have = new Set(all.map((r) => String(r.date)));
  const missing: string[] = [];
  const start = new Date("2026-01-01T12:00:00");
  const end = new Date(`${today}T12:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 3) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!have.has(iso)) missing.push(iso);
  }

  const { data: logs } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("location", "federal")
    .order("started_at", { ascending: false })
    .limit(20);

  const latest = all[0] ?? null;

  return {
    generatedAt: new Date().toISOString(),
    today,
    total: all.length,
    total2026: byYear["2026"] ?? 0,
    byYear,
    lastImportedAt,
    lastDrawDate: latest?.date ?? null,
    latest: latest
      ? {
          date: latest.date,
          time_type: latest.time_type,
          time_value: latest.time_value,
          results: (latest.results as string[]) ?? [],
          animal: latest.animal,
          animal_group: latest.animal_group,
        }
      : null,
    missing2026: missing,
    failures: missing.length,
    logs: logs ?? [],
    lastError: (logs ?? []).find((l: any) => l.status === "error")?.error_message ?? null,
  };
});

/**
 * Dados completos da LOTERIA FEDERAL para exportação (CSV/PDF):
 * histórico do ano escolhido + análise (frequência e atraso das dezenas e grupos).
 */
export const getFederalExport = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({ year: z.number().optional().default(2026) })
      .optional()
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data: { year } }) => {
    const { data: rows, error } = await supabase
      .from("lottery_results")
      .select("date, time_type, time_value, results, animal, animal_group")
      .eq("location", "federal")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: false });

    if (error) throw error;

    const history = (rows ?? []).map((r) => ({
      date: String(r.date),
      time_type: r.time_type,
      time_value: r.time_value ?? "",
      prizes: ((r.results as string[]) ?? []).slice(0, 5),
      animal: r.animal ?? "",
      animal_group: r.animal_group ?? "",
    }));

    // Frequência e atraso das dezenas (00-99) e dos grupos (01-25),
    // medidos em concursos — a Federal tem apenas 2 extrações por semana.
    const tenCount = new Map<string, number>();
    const tenLast = new Map<string, number>();
    const groupCount = new Map<string, number>();
    const groupLast = new Map<string, number>();

    history.forEach((row, index) => {
      row.prizes.forEach((p) => {
        const ten = String(p).slice(-2).padStart(2, "0");
        tenCount.set(ten, (tenCount.get(ten) ?? 0) + 1);
        if (!tenLast.has(ten)) tenLast.set(ten, index);
        const n = Number(ten);
        const grp = String(n === 0 ? 25 : Math.ceil(n / 4)).padStart(2, "0");
        groupCount.set(grp, (groupCount.get(grp) ?? 0) + 1);
        if (!groupLast.has(grp)) groupLast.set(grp, index);
      });
    });

    const tens = Array.from({ length: 100 }, (_, i) => {
      const ten = String(i).padStart(2, "0");
      return {
        ten,
        count: tenCount.get(ten) ?? 0,
        delay: tenLast.has(ten) ? tenLast.get(ten)! : history.length,
      };
    }).sort((a, b) => b.count - a.count);

    const groups = Array.from({ length: 25 }, (_, i) => {
      const grp = String(i + 1).padStart(2, "0");
      return {
        group: grp,
        count: groupCount.get(grp) ?? 0,
        delay: groupLast.has(grp) ? groupLast.get(grp)! : history.length,
      };
    }).sort((a, b) => b.count - a.count);

    return { year, generatedAt: new Date().toISOString(), history, tens, groups };
  });
