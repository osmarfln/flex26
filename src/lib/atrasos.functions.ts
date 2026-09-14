import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getAnimalByTen, getAnimalByGroup, getGroupFromTen } from "@/lib/animals";
import { sortDrawsDesc, drawLabel, brasiliaDateISO } from "@/lib/draw-order";

export interface DelayItem {
  /** grupo (01-25), dezena (00-99) ou centena (000-999) */
  value: string;
  label: string;
  /** Último concurso em que saiu */
  lastDate: string | null;
  lastTimeType: string | null;
  lastTimeLabel: string | null;
  /** Atraso em concursos e em dias corridos */
  drawsDelay: number;
  daysDelay: number | null;
  occurrences: number;
}

export interface GeneralDelayPanel {
  location: "rio" | "capital" | "federal";
  totalDraws: number;
  lastDraw: { date: string; timeType: string; timeLabel: string; results: string[] } | null;
  updatedAt: string;
  groups: DelayItem[];
  tens: DelayItem[];
  hundreds: DelayItem[];
}

function daysBetween(fromISO: string | null, toISO: string): number | null {
  if (!fromISO) return null;
  const a = new Date(`${fromISO}T12:00:00`).getTime();
  const b = new Date(`${toISO}T12:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * Painel geral de atrasos (grupos, dezenas e centenas) por loteria.
 * Recalculado a cada chamada usando os concursos já sincronizados,
 * então basta invalidar as queries quando um novo resultado chega.
 */
export const getGeneralDelayPanel = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        location: z.enum(["rio", "capital", "federal"]).optional().default("rio"),
        draws: z.number().optional().default(800),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<GeneralDelayPanel> => {
    const { data: rows, error } = await supabase
      .from("lottery_results")
      .select("date,time_type,time_value,results,location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(data.draws);

    if (error) throw error;

    const draws = sortDrawsDesc((rows ?? []) as any[]) as {
      date: string;
      time_type: string;
      results: string[] | null;
    }[];

    const today = brasiliaDateISO();
    const loc = data.location;

    // índice do concurso (0 = mais recente) em que cada valor apareceu pela última vez
    const lastIdx: Record<string, number> = {};
    const lastDraw: Record<string, { date: string; timeType: string }> = {};
    const count: Record<string, number> = {};

    draws.forEach((d, idx) => {
      const prizes = (d.results ?? []).filter((p) => /^\d{4}$/.test(String(p ?? "")));
      const seen = new Set<string>();
      for (const p of prizes) {
        const ten = p.slice(-2);
        const hundred = p.slice(-3);
        const group = getGroupFromTen(ten);
        const keys = [`T:${ten}`, `H:${hundred}`];
        if (group && group !== "00") keys.push(`G:${group}`);
        for (const k of keys) {
          count[k] = (count[k] ?? 0) + 1;
          if (!seen.has(k)) seen.add(k);
          if (lastIdx[k] === undefined) {
            lastIdx[k] = idx;
            lastDraw[k] = { date: d.date, timeType: d.time_type };
          }
        }
      }
    });

    const build = (key: string, value: string, label: string): DelayItem => {
      const last = lastDraw[key] ?? null;
      const idx = lastIdx[key];
      return {
        value,
        label,
        lastDate: last?.date ?? null,
        lastTimeType: last?.timeType ?? null,
        lastTimeLabel: last ? drawLabel(loc as any, last.timeType, last.date) : null,
        drawsDelay: idx === undefined ? draws.length : idx,
        daysDelay: daysBetween(last?.date ?? null, today),
        occurrences: count[key] ?? 0,
      };
    };

    const groups: DelayItem[] = Array.from({ length: 25 }, (_, i) => {
      const g = String(i + 1).padStart(2, "0");
      const animal = getAnimalByGroup(g)?.name ?? "";
      return build(`G:${g}`, g, animal ? `${g} · ${animal}` : g);
    }).sort((a, b) => b.drawsDelay - a.drawsDelay);

    const tens: DelayItem[] = Array.from({ length: 100 }, (_, i) => {
      const t = String(i).padStart(2, "0");
      const animal = getAnimalByTen(t)?.name ?? "";
      return build(`T:${t}`, t, animal ? `${t} · ${animal}` : t);
    }).sort((a, b) => b.drawsDelay - a.drawsDelay);

    const hundredKeys = new Set<string>(Object.keys(lastIdx).filter((k) => k.startsWith("H:")));
    const hundreds: DelayItem[] = Array.from(hundredKeys)
      .map((k) => build(k, k.slice(2), k.slice(2)))
      .sort((a, b) => b.drawsDelay - a.drawsDelay)
      .slice(0, 60);

    const first = draws[0];
    return {
      location: loc,
      totalDraws: draws.length,
      lastDraw: first
        ? {
            date: first.date,
            timeType: first.time_type,
            timeLabel: drawLabel(loc as any, first.time_type, first.date),
            results: (first.results ?? []) as string[],
          }
        : null,
      updatedAt: new Date().toISOString(),
      groups,
      tens,
      hundreds,
    };
  });
