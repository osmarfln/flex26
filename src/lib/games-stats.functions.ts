import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getGroupFromTen, getAnimalByTen, getAnimalByGroup } from "@/lib/animals";
import { sortDrawsDesc } from "@/lib/draw-order";

const LocationInput = z.object({
  location: z.enum(["rio", "capital", "federal"]).optional().default("rio"),
  limit: z.number().optional().default(800),
});

async function loadDraws(location: string, limit: number) {
  const { data, error } = await supabase
    .from("lottery_results")
    .select("results, date, time_type, location")
    .eq("location" as any, location)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return sortDrawsDesc((data ?? []) as any[]) as any[];
}

const tenOf = (prize: string) => (prize && prize.length >= 2 ? prize.slice(-2) : "");

/** Laboratório de jogos: dezenas, pares/ímpares, somas, combinações e esquerda/direita. */
export const getGameLabStats = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => LocationInput.parse(d))
  .handler(async ({ data }) => {
    const draws = await loadDraws(data.location, data.limit);

    const tenCount: Record<string, number> = {};
    const leftCount: Record<string, number> = {};
    const rightCount: Record<string, number> = {};
    const sumCount: Record<string, number> = {};
    const comboCount: Record<string, number> = {};
    let even = 0;
    let odd = 0;
    let totalTens = 0;

    for (const draw of draws) {
      const prizes: string[] = Array.isArray(draw.results) ? draw.results.slice(0, 5) : [];
      const tens = prizes.map(tenOf).filter((t) => t.length === 2);
      for (const ten of tens) {
        totalTens += 1;
        tenCount[ten] = (tenCount[ten] ?? 0) + 1;
        const left = ten[0]!;
        const right = ten[1]!;
        leftCount[left] = (leftCount[left] ?? 0) + 1;
        rightCount[right] = (rightCount[right] ?? 0) + 1;
        const sum = String(Number(left) + Number(right));
        sumCount[sum] = (sumCount[sum] ?? 0) + 1;
        if (Number(ten) % 2 === 0) even += 1;
        else odd += 1;
      }
      const uniq = Array.from(new Set(tens)).sort();
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const key = `${uniq[i]}-${uniq[j]}`;
          comboCount[key] = (comboCount[key] ?? 0) + 1;
        }
      }
    }

    const tens = Object.entries(tenCount)
      .map(([ten, count]) => {
        const animal = getAnimalByTen(ten);
        return {
          ten,
          count,
          percent: totalTens ? (count / totalTens) * 100 : 0,
          group: getGroupFromTen(ten),
          animal: animal?.name ?? "",
          icon: animal?.icon ?? "",
        };
      })
      .sort((a, b) => b.count - a.count);

    const digits = (map: Record<string, number>) =>
      Array.from({ length: 10 }, (_, i) => {
        const d = String(i);
        const count = map[d] ?? 0;
        return { digit: d, count, percent: totalTens ? (count / totalTens) * 100 : 0 };
      });

    const sums = Array.from({ length: 19 }, (_, i) => {
      const s = String(i);
      const count = sumCount[s] ?? 0;
      return { sum: s, count, percent: totalTens ? (count / totalTens) * 100 : 0 };
    });

    const combos = Object.entries(comboCount)
      .map(([key, count]) => {
        const [a, b] = key.split("-") as [string, string];
        return {
          a,
          b,
          count,
          percent: draws.length ? (count / draws.length) * 100 : 0,
          animalA: getAnimalByTen(a)?.name ?? "",
          animalB: getAnimalByTen(b)?.name ?? "",
        };
      })
      .sort((x, y) => y.count - x.count)
      .slice(0, 30);

    return {
      totalDraws: draws.length,
      totalTens,
      lastDate: draws[0]?.date ?? null,
      tens,
      coldTens: [...tens].sort((a, b) => a.count - b.count).slice(0, 15),
      parity: {
        even,
        odd,
        evenPercent: totalTens ? (even / totalTens) * 100 : 0,
        oddPercent: totalTens ? (odd / totalTens) * 100 : 0,
      },
      sums,
      combos,
      left: digits(leftCount),
      right: digits(rightCount),
    };
  });

/** Ações estratégicas: grupo/dezena/bicho mais atrasados + sugestões de jogos. */
export const getStrategicActions = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => LocationInput.parse(d))
  .handler(async ({ data }) => {
    const draws = await loadDraws(data.location, data.limit);

    // Atraso de grupo no 1º prêmio
    const groupFirstIdx: Record<string, number> = {};
    const groupFirstDate: Record<string, string> = {};
    const tenAnyIdx: Record<string, number> = {};
    const tenAnyDate: Record<string, string> = {};
    const hotGroup: Record<string, number> = {};
    const hotTen: Record<string, number> = {};

    draws.forEach((draw, index) => {
      const prizes: string[] = Array.isArray(draw.results) ? draw.results.slice(0, 5) : [];
      const first = tenOf(prizes[0] ?? "");
      if (first) {
        const g = getGroupFromTen(first);
        if (g && groupFirstIdx[g] === undefined) {
          groupFirstIdx[g] = index;
          groupFirstDate[g] = draw.date;
        }
        if (index < 20 && g) hotGroup[g] = (hotGroup[g] ?? 0) + 1;
      }
      prizes.map(tenOf).forEach((ten) => {
        if (ten.length !== 2) return;
        if (tenAnyIdx[ten] === undefined) {
          tenAnyIdx[ten] = index;
          tenAnyDate[ten] = draw.date;
        }
        if (index < 20) hotTen[ten] = (hotTen[ten] ?? 0) + 1;
      });
    });

    const total = draws.length;
    const allGroups = Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, "0"));
    const groups = allGroups
      .map((g) => {
        const animal = getAnimalByGroup(g);
        const idx = groupFirstIdx[g];
        return {
          group: g,
          animal: animal?.name ?? "",
          icon: animal?.icon ?? "",
          delay: idx === undefined ? total : idx,
          lastDate: groupFirstDate[g] ?? null,
          never: idx === undefined,
        };
      })
      .sort((a, b) => b.delay - a.delay);

    const allTens = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));
    const tens = allTens
      .map((ten) => {
        const idx = tenAnyIdx[ten];
        return {
          ten,
          animal: getAnimalByTen(ten)?.name ?? "",
          delay: idx === undefined ? total : idx,
          lastDate: tenAnyDate[ten] ?? null,
        };
      })
      .sort((a, b) => b.delay - a.delay);

    const hotGroups = Object.entries(hotGroup)
      .map(([g, count]) => ({
        group: g,
        count,
        animal: getAnimalByGroup(g)?.name ?? "",
        icon: getAnimalByGroup(g)?.icon ?? "",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const hotTens = Object.entries(hotTen)
      .map(([ten, count]) => ({ ten, count, animal: getAnimalByTen(ten)?.name ?? "" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topDelayedGroups = groups.slice(0, 5);
    const topDelayedTens = tens.slice(0, 8);

    const suggestions = [
      {
        title: "Grupo em atraso máximo",
        detail: topDelayedGroups[0]
          ? `${topDelayedGroups[0].icon} ${topDelayedGroups[0].group} — ${topDelayedGroups[0].animal} está há ${topDelayedGroups[0].delay} concursos sem sair no 1º prêmio.`
          : "Sem dados suficientes.",
        play: topDelayedGroups[0]
          ? `Jogar grupo ${topDelayedGroups[0].group} nas próximas extrações (dezenas ${allTens.filter((t) => getGroupFromTen(t) === topDelayedGroups[0]!.group).join(", ")}).`
          : "-",
      },
      {
        title: "Dezena mais atrasada",
        detail: topDelayedTens[0]
          ? `Dezena ${topDelayedTens[0].ten} (${topDelayedTens[0].animal}) há ${topDelayedTens[0].delay} concursos sem aparecer de 1º ao 5º.`
          : "Sem dados suficientes.",
        play: topDelayedTens
          .slice(0, 4)
          .map((t) => t.ten)
          .join(" · "),
      },
      {
        title: "Bicho em alta (últimos 20 concursos)",
        detail: hotGroups[0]
          ? `${hotGroups[0].icon} ${hotGroups[0].animal} lidera o 1º prêmio com ${hotGroups[0].count} aparições.`
          : "Sem dados suficientes.",
        play: hotTens
          .slice(0, 4)
          .map((t) => t.ten)
          .join(" · "),
      },
      {
        title: "Cruzamento atraso x força",
        detail: "Combine o grupo mais atrasado com a dezena mais quente para cobrir os dois cenários.",
        play:
          topDelayedGroups[0] && hotTens[0]
            ? `Grupo ${topDelayedGroups[0].group} + dezena ${hotTens[0].ten}`
            : "-",
      },
    ];

    return {
      totalDraws: total,
      lastDate: draws[0]?.date ?? null,
      lastTime: draws[0]?.time_type ?? null,
      topDelayedGroups,
      topDelayedTens,
      hotGroups,
      hotTens,
      suggestions,
    };
  });
