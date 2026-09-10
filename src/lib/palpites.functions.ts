import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGroupFromTen } from "@/lib/animals";
import { drawLabel } from "@/lib/draw-order";

const LOCATIONS = ["rio", "capital", "federal"] as const;

const SaveSchema = z.object({
  location: z.enum(LOCATIONS),
  targetDate: z.string().min(8),
  targetTimeType: z.string().min(1),
  targetLabel: z.string().optional().nullable(),
  tens: z.array(z.string()).min(1).max(40),
  note: z.string().max(4000).optional().nullable(),
});

const norm = (v: string) => String(v).replace(/\D/g, "").slice(-2).padStart(2, "0");

/** Salva um palpite gerado pelo robô para conferência futura. */
export const savePalpite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const tens = [...new Set(data.tens.map(norm))].filter((t) => /^\d{2}$/.test(t));
    if (!tens.length) throw new Error("Nenhuma dezena válida no palpite");
    const groups = [...new Set(tens.map((t) => getGroupFromTen(t)).filter(Boolean))] as string[];

    const { error } = await context.supabase.from("bot_palpites").insert({
      user_id: context.userId,
      location: data.location,
      target_date: data.targetDate,
      target_time_type: data.targetTimeType,
      target_label: data.targetLabel ?? drawLabel(data.location, data.targetTimeType, data.targetDate),
      tens,
      groups,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, tens, groups };
  });

/** Lista os palpites anteriores já conferidos com os resultados reais. */
export const listPalpites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().min(1).max(200).optional().default(50) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("bot_palpites")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    if (!list.length) return { palpites: [], resumo: { total: 0, conferidos: 0, acertos: 0, taxaPct: 0 } };

    const dates = [...new Set(list.map((r: any) => r.target_date))];
    const { data: results } = await context.supabase
      .from("lottery_results")
      .select("date, time_type, location, results")
      .in("date", dates);

    const byKey = new Map<string, string[]>();
    for (const r of (results ?? []) as any[]) {
      byKey.set(`${r.location}|${r.date}|${r.time_type}`, ((r.results as string[]) ?? []).filter(Boolean));
    }

    let conferidos = 0;
    let acertos = 0;

    const palpites = list.map((p: any) => {
      const prizes = byKey.get(`${p.location}|${p.target_date}|${p.target_time_type}`);
      if (!prizes || prizes.length < 1) {
        return { ...p, status: "aguardando", sorteadas: [], acertosDezenas: [], acertosGrupos: [] };
      }
      const drawn = prizes.map((pr, i) => {
        const ten = norm(pr);
        return { position: i + 1, dezena: ten, grupo: getGroupFromTen(ten) ?? null, premio: pr };
      });
      const drawnTens = new Set(drawn.map((d) => d.dezena));
      const drawnGroups = new Set(drawn.map((d) => d.grupo).filter(Boolean) as string[]);
      const acertosDezenas = (p.tens as string[]).filter((t) => drawnTens.has(t));
      const acertosGrupos = (p.groups as string[]).filter((g) => drawnGroups.has(g));
      conferidos += 1;
      if (acertosDezenas.length || acertosGrupos.length) acertos += 1;
      return {
        ...p,
        status: acertosDezenas.length ? "acerto de dezena" : acertosGrupos.length ? "acerto de grupo" : "sem acerto",
        sorteadas: drawn,
        acertosDezenas,
        acertosGrupos,
      };
    });

    return {
      palpites,
      resumo: {
        total: list.length,
        conferidos,
        acertos,
        taxaPct: conferidos ? Math.round((acertos / conferidos) * 1000) / 10 : 0,
      },
    };
  });

/** Remove um palpite salvo. */
export const deletePalpite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bot_palpites")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
