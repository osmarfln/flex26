import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Tipos para os resultados
export interface LotteryResult {
  id: string;
  date: string;
  time_type: string;
  time_value: string | null;
  results: string[];
  animal: string | null;
  animal_group: string | null;
  created_at: string;
}

const ANIMAL_GROUPS: Record<string, { name: string, icon: string }> = {
  "01": { name: "Avestruz", icon: "🦩" }, "02": { name: "Águia", icon: "🦅" }, "03": { name: "Burro", icon: "🫏" }, "04": { name: "Borboleta", icon: "🦋" }, "05": { name: "Cachorro", icon: "🐕" },
  "06": { name: "Cabra", icon: "🐐" }, "07": { name: "Leão", icon: "🦁" }, "08": { name: "Macaco", icon: "🐒" }, "09": { name: "Cobra", icon: "🐍" }, "10": { name: "Coelho", icon: "🐰" },
  "11": { name: "Cavalo", icon: "🐎" }, "12": { name: "Elefante", icon: "🐘" }, "13": { name: "Galo", icon: "🐓" }, "14": { name: "Gato", icon: "🐈" }, "15": { name: "Jacaré", icon: "🐊" },
  "16": { name: "Leopardo", icon: "🐆" }, "17": { name: "Porco", icon: "🐖" }, "18": { name: "Coruja", icon: "🦉" }, "19": { name: "Pavão", icon: "🦚" }, "20": { name: "Peru", icon: "🦃" },
  "21": { name: "Touro", icon: "🐂" }, "22": { name: "Tigre", icon: "🐅" }, "23": { name: "Urso", icon: "🐻" }, "24": { name: "Veado", icon: "🦌" }, "25": { name: "Vaca", icon: "🐄" },
};

export const getResults = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    date: z.string().optional(),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0)
  }).parse(data))
  .handler(async ({ data }) => {
    let query = supabase
      .from("lottery_results")
      .select("*")
      .order("date", { ascending: false })
      .order("time_type", { ascending: true });

    if (data.date) {
      query = query.eq("date", data.date);
    }

    const { data: results, error } = await query
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw error;
    return results as LotteryResult[];
  });

export const getStats = createServerFn({ method: "GET" })
  .handler(async () => {
    // Buscar últimos 30 dias de resultados para calcular estatísticas
    const { data: results, error } = await supabase
      .from("lottery_results")
      .select("*")
      .order("date", { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!results) return { mostDelayedGroups: [], mostFrequentTens: [], delayedBySchedule: {} };

    // Calcular atrasos
    const lastSeen: Record<string, string> = {};
    const tenCounts: Record<string, number> = {};
    const scheduleDelay: Record<string, { group: string, date: string }> = {};

    results.forEach(res => {
      const group = res.animal_group;
      if (group) {
        if (!lastSeen[group]) lastSeen[group] = res.date;
        
        // Dezenas (últimos 2 dígitos do 1º prêmio)
        const firstPrize = res.results[0];
        if (firstPrize && firstPrize.length >= 2) {
          const ten = firstPrize.slice(-2);
          tenCounts[ten] = (tenCounts[ten] || 0) + 1;
        }

        // Atraso por horário
        const key = res.time_type;
        if (!scheduleDelay[key]) scheduleDelay[key] = { group, date: res.date };
      }
    });

    const mostDelayedGroups = Object.keys(ANIMAL_GROUPS)
      .map(group => {
        const lastDate = lastSeen[group];
        const lastDateObj = lastDate ? new Date(lastDate) : null;
        const days = lastDateObj ? Math.floor((new Date().getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)) : 99;
        return {
          group,
          animal: ANIMAL_GROUPS[group].name,
          days,
          lastSeen: lastDateObj ? lastDateObj.toLocaleDateString('pt-BR') : "Nunca"
        };
      })
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    const mostFrequentTens = Object.entries(tenCounts)
      .map(([ten, count]) => ({ ten, count, trend: (count > 3 ? "up" : "stable") as "up" | "stable" | "down" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const delayedBySchedule: Record<string, any> = {};
    Object.keys(scheduleDelay).forEach(time => {
      const entry = scheduleDelay[time];
      if (entry) {
        const entryDate = new Date(entry.date);
        const days = Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        const groupInfo = ANIMAL_GROUPS[entry.group];
        delayedBySchedule[time] = {
          group: entry.group,
          animal: groupInfo ? groupInfo.name : "Desconhecido",
          delayed: `${days} dias`
        };
      }
    });

    return {
      mostDelayedGroups,
      mostFrequentTens,
      delayedBySchedule
    };
  });
