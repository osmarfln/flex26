import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ANIMAL_GROUPS_MAP, getGroupFromTen as tenToGroup } from "@/lib/animals";
import { sortDrawsDesc } from "@/lib/draw-order";
import { PUXADAS as PUXADAS_TABLE } from "@/lib/puxadas";


// Tipos para os resultados
export interface LotteryResult {
  id: string;
  date: string;
  time_type: string;
  time_value: string | null;
  results: string[];
  animal: string | null;
  animal_group: string | null;
  location: any;
  created_at: string;
}


const ANIMAL_GROUPS_DATA = ANIMAL_GROUPS_MAP;

export const getResults = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    date: z.string().optional(),
    location: z.enum(['rio', 'capital']).optional().default('rio'),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0)
  }).parse(data))

  .handler(async ({ data }) => {
    let query = supabase
      .from("lottery_results")
      .select("*")
      .eq("location" as any, data.location)
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

/** Busca resultados por intervalo de datas e horários (filtros das Análises). */
export const getResultsRange = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        start: z.string(),
        end: z.string(),
        location: z.enum(['rio', 'capital']).optional().default('rio'),
        timeTypes: z.array(z.string()).optional(),
        limit: z.number().optional().default(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("lottery_results")
      .select("*")
      .eq("location" as any, data.location)
      .gte("date", data.start)
      .lte("date", data.end)
      .order("date", { ascending: false })
      .limit(data.limit);


    if (data.timeTypes && data.timeTypes.length > 0) {
      query = query.in("time_type", data.timeTypes);
    }

    const { data: results, error } = await query;
    if (error) throw error;
    return sortDrawsDesc((results ?? []) as any[]) as LotteryResult[];
  });




export const getStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawResults, error } = await supabase
      .from("lottery_results")
      .select("*")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(300);



    if (error) throw error;
    if (!rawResults) return { mostDelayedGroups: [], mostFrequentTens: [], delayedBySchedule: {} };
    const results = sortDrawsDesc(rawResults as any[]);


    // Atraso medido em CONCURSOS (mesma métrica usada em Estatísticas)
    const lastIndexByGroup: Record<string, number> = {};
    const lastDateByGroup: Record<string, string> = {};
    const tenCounts: Record<string, number> = {};
    const scheduleDelay: Record<string, { group: string; date: string; index: number }> = {};

    results.forEach((res: any, index: number) => {
      const prizes: string[] = Array.isArray(res.results) ? res.results.slice(0, 5) : [];

      prizes.forEach((prize: string) => {
        if (!prize || prize.length < 2) return;
        const group = tenToGroup(prize.slice(-2));
        if (!group) return;
        if (lastIndexByGroup[group] === undefined) {
          lastIndexByGroup[group] = index;
          lastDateByGroup[group] = res.date;
        }
      });

      const firstPrize = prizes[0];
      if (firstPrize && firstPrize.length >= 2) {
        const ten = firstPrize.slice(-2);
        tenCounts[ten] = (tenCounts[ten] || 0) + 1;
      }

      const key = res.time_type;
      const firstGroup = firstPrize && firstPrize.length >= 2 ? tenToGroup(firstPrize.slice(-2)) : null;
      if (key && firstGroup && !scheduleDelay[key]) {
        scheduleDelay[key] = { group: firstGroup, date: res.date, index };
      }
    });

    const formatDate = (iso?: string) => {
      if (!iso) return "Nunca";
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };

    const mostDelayedGroups = Object.keys(ANIMAL_GROUPS_DATA)
      .map(group => {
        const idx = lastIndexByGroup[group];
        const days = idx === undefined ? results.length : idx;
        const animalInfo = ANIMAL_GROUPS_DATA[group];
        return {
          group,
          animal: animalInfo ? animalInfo.name : "Desconhecido",
          days,
          lastSeen: formatDate(lastDateByGroup[group])
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
        const groupInfo = ANIMAL_GROUPS_DATA[entry.group];
        delayedBySchedule[time] = {
          group: entry.group,
          animal: groupInfo ? groupInfo.name : "Desconhecido",
          delayed: `${entry.index} concursos`,
          lastSeen: formatDate(entry.date)
        };
      }
    });

    return { mostDelayedGroups, mostFrequentTens, delayedBySchedule };
  });


export const getTenDelayStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawRows, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(600);

    if (error) throw error;
    if (!rawRows) return [];
    const results = sortDrawsDesc(rawRows);

    const stats: any[] = [];
    const allTens = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

    const current300 = results.slice(0, 300);
    const previous300 = results.slice(300, 600);

    allTens.forEach(ten => {
      let currentDelay = -1;
      let dailyDelay = 0; // Atraso em horários do mesmo dia
      const intervals: number[] = [];
      let lastIndex = -1;
      let hitInFirstPrize = false;
      const sparklineData: number[] = [];
      
      const freq10 = current300.slice(0, 10).filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      const freq30 = current300.slice(0, 30).filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      const freq50 = current300.slice(0, 50).filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      const freq100 = current300.slice(0, 100).filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      const freq300 = current300.filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      
      const prevFreq300 = previous300.filter(r => r.results?.slice(0, 5).some(p => p.slice(-2) === ten)).length;
      const periodComparison = prevFreq300 > 0 ? ((freq300 - prevFreq300) / prevFreq300) * 100 : (freq300 > 0 ? 100 : 0);

      // Cálculo do atraso diário (horários do dia atual sem sair)
      if (results.length > 0 && results[0]) {
        const lastDate = results[0].date;
        let dDelay = 0;
        for (const res of results) {
          if (!res || res.date !== lastDate) break;
          const hit = res.results?.slice(0, 5).some(p => p?.slice(-2) === ten);
          if (hit) break;
          dDelay++;
        }
        dailyDelay = dDelay;
      }

      results.forEach((res, index) => {
        const hit = res.results?.slice(0, 5).some(p => p?.slice(-2) === ten);
        const firstPrizeHit = res.results?.[0]?.slice(-2) === ten;

        if (hit) {
          if (currentDelay === -1) {
            currentDelay = index;
            if (firstPrizeHit && index === 0) hitInFirstPrize = true;
          }
          if (lastIndex !== -1) intervals.push(index - lastIndex);
          lastIndex = index;
        }
      });

      // Simplified history for sparkline (last 30 draws)
      let tempDelay = 0;
      for (let j = 29; j >= 0; j--) {
        const res = results[j];
        const hit = res?.results?.slice(0, 5).some((p: string) => p?.slice(-2) === ten);
        if (hit) tempDelay = 0;
        else tempDelay++;
        sparklineData.push(tempDelay);
      }

      if (currentDelay === -1) currentDelay = 500;
      const avgDelay = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 100;
      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const medianDelay = sortedIntervals.length > 0 ? sortedIntervals[Math.floor(sortedIntervals.length / 2)] : 100;
      const maxDelay = intervals.length > 0 ? Math.max(...intervals) : currentDelay;
      const minDelay = intervals.length > 0 ? Math.min(...intervals) : currentDelay;
      const relativeIndex = currentDelay / avgDelay;

      // Regularidade
      const variance = intervals.length > 1 ? intervals.reduce((acc, val) => acc + Math.pow(val - avgDelay, 2), 0) / (intervals.length - 1) : 0;
      const stdDev = Math.sqrt(variance);
      const regularityScore = avgDelay > 0 ? stdDev / avgDelay : 1;
      
      let regularity = "Média";
      if (regularityScore < 0.5) regularity = "Alta";
      else if (regularityScore > 1.2) regularity = "Baixa";

      stats.push({
        ten,
        currentDelay,
        dailyDelay,
        avgDelay: Number(avgDelay.toFixed(2)),
        medianDelay,
        maxDelay,
        minDelay,
        relativeIndex: Number(relativeIndex.toFixed(2)),
        freqs: { 10: freq10, 30: freq30, 50: freq50, 100: freq100, 300: freq300 },
        regularity,
        periodComparison: Number(periodComparison.toFixed(2)),
        hitInFirstPrize,
        history: sparklineData
      });
    });

    // Calculate percentiles
    const sortedByDelay = [...stats].sort((a, b) => a.currentDelay - b.currentDelay);
    stats.forEach(s => {
      const rank = sortedByDelay.findIndex(x => x.ten === s.ten);
      s.percentile = Number(((rank / 99) * 100).toFixed(0));
      
      let classification = "Dentro da média";
      if (s.relativeIndex < 0.75) classification = "Atraso baixo";
      else if (s.relativeIndex >= 0.75 && s.relativeIndex <= 1.25) classification = "Dentro da média";
      else if (s.relativeIndex > 1.25 && s.relativeIndex <= 2.00) classification = "Atraso elevado";
      else if (s.relativeIndex > 2.00) classification = "Muito acima da média";
      s.classification = classification;
    });

    return stats.sort((a, b) => b.currentDelay - a.currentDelay);
  });


export const getGroupDelayStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawRows, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, animal_group, location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(600);



    if (error) throw error;
    if (!rawRows) return [];
    const results = sortDrawsDesc(rawRows);


    const stats: any[] = [];
    const allGroups = Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, '0'));
    
    const current300 = results.slice(0, 300);
    const previous300 = results.slice(300, 600);

    allGroups.forEach(groupId => {
      let currentDelay = -1;
      let lastOccurrenceDate: string | null = null;
      const intervals: number[] = [];
      let lastIndex = -1;
      const hourlyFreq: Record<string, number> = {};
      const positionFreq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalFreq = 0;
      
      const countGroup = (list: any[]) => list.filter(r => 
        r.results?.slice(0, 5).some((prize: string) => {
          const ten = prize.slice(-2);
          const tenInt = parseInt(ten);
          return !isNaN(tenInt) && tenToGroup(ten) === groupId;
        })
      ).length;

      const freq10 = countGroup(current300.slice(0, 10));
      const freq30 = countGroup(current300.slice(0, 30));
      const freq50 = countGroup(current300.slice(0, 50));
      const freq100 = countGroup(current300.slice(0, 100));
      const freq300 = countGroup(current300);
      const prevFreq300 = countGroup(previous300);
      
      const periodComparison = prevFreq300 > 0 ? ((freq300 - prevFreq300) / prevFreq300) * 100 : (freq300 > 0 ? 100 : 0);

      results.forEach((res: any, index: number) => {
        let foundInThisResult = false;
        res.results?.slice(0, 5).forEach((prize: string, pIdx: number) => {

          const ten = prize.slice(-2);
          const tenInt = parseInt(ten);
          if (!isNaN(tenInt)) {
            const calculatedGroup = tenToGroup(ten);
            if (calculatedGroup === groupId) {
              foundInThisResult = true;
              totalFreq++;
              const pos = (pIdx + 1) as 1 | 2 | 3 | 4 | 5;
              (positionFreq as any)[pos]++;
              if (res.time_type) hourlyFreq[res.time_type] = (hourlyFreq[res.time_type] || 0) + 1;
            }
          }
        });
        if (foundInThisResult) {
          if (currentDelay === -1) {
            currentDelay = index;
            lastOccurrenceDate = res.date;
          }
          if (lastIndex !== -1) intervals.push(index - lastIndex);
          lastIndex = index;
        }
      });

      if (currentDelay === -1) currentDelay = 500;
      const avgDelay = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 50;
      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const medianDelay = sortedIntervals.length > 0 ? sortedIntervals[Math.floor(sortedIntervals.length / 2)] : 50;
      const maxDelay = intervals.length > 0 ? Math.max(...intervals) : currentDelay;
      const minDelay = intervals.length > 0 ? Math.min(...intervals) : currentDelay;
      const relativeIndex = currentDelay / avgDelay;
      
      const variance = intervals.length > 1 ? intervals.reduce((acc, val) => acc + Math.pow(val - avgDelay, 2), 0) / (intervals.length - 1) : 0;
      const stdDev = Math.sqrt(variance);
      const regularityScore = avgDelay > 0 ? stdDev / avgDelay : 1;
      let regularity = "Média";
      if (regularityScore < 0.5) regularity = "Alta";
      else if (regularityScore > 1.2) regularity = "Baixa";

      // Detalhe por dezena do grupo (frequência total e atraso atual, 1º ao 5º prêmio)
      const groupDezenas: string[] = ANIMAL_GROUPS_DATA[groupId]?.dezenas ?? [];
      const dezenaStats = groupDezenas.map((dz) => {
        let freq = 0;
        let delay = -1;
        const delayHistory: number[] = [];
        let hitInFirstPrize = false;

        results.forEach((res: any, index: number) => {
          const firstPrizeHit = res.results?.[0]?.slice(-2) === dz;
          const hit = res.results?.slice(0, 5).some((prize: string) => prize?.slice(-2) === dz);
          
          if (hit) {
            freq++;
            if (delay === -1) delay = index;
            if (firstPrizeHit) hitInFirstPrize = true;
          }
          
          // Track delay evolution (last 30 draws for sparkline)
          if (index < 30) {
            delayHistory.push(delay === -1 ? index + 1 : index - (results.findIndex((r, idx) => idx <= index && r.results?.slice(0, 5).some((p: string) => p?.slice(-2) === dz)) ?? index));
          }
        });

        // Simplified history for sparkline: just current delay at each point
        const sparklineData: number[] = [];
        let tempDelay = 0;
        for (let j = 29; j >= 0; j--) {
          const res = results[j];
          const hit = res?.results?.slice(0, 5).some((p: string) => p?.slice(-2) === dz);
          if (hit) tempDelay = 0;
          else tempDelay++;
          sparklineData.push(tempDelay);
        }

        return { 
          dezena: dz, 
          freq, 
          delay: delay === -1 ? results.length : delay,
          hitInFirstPrize,
          history: sparklineData
        };
      });

      const anyDezenaInFirstPrize = dezenaStats.some(d => d.hitInFirstPrize && d.delay === 0);

      stats.push({
        groupId,
        animal: ANIMAL_GROUPS_DATA[groupId] ? ANIMAL_GROUPS_DATA[groupId].name : "Desconhecido",
        dezenaStats,
        anyDezenaInFirstPrize,

        currentDelay,
        lastOccurrenceDate,
        avgDelay: Number(avgDelay.toFixed(2)),
        medianDelay,
        maxDelay,
        minDelay,
        frequency: totalFreq,
        relativeIndex: Number(relativeIndex.toFixed(2)),
        hourlyFreq,
        positionFreq,
        freqs: { 10: freq10, 30: freq30, 50: freq50, 100: freq100, 300: freq300 },
        regularity,
        periodComparison: Number(periodComparison.toFixed(2))
      });
    });

    const sortedByDelay = [...stats].sort((a, b) => a.currentDelay - b.currentDelay);
    stats.forEach(s => {
      const rank = sortedByDelay.findIndex(x => x.groupId === s.groupId);
      s.percentile = Number(((rank / 24) * 100).toFixed(0));

      let classification = "Dentro da média";
      if (s.relativeIndex < 0.75) classification = "Atraso baixo";
      else if (s.relativeIndex >= 0.75 && s.relativeIndex <= 1.25) classification = "Dentro da média";
      else if (s.relativeIndex > 1.25 && s.relativeIndex <= 2.00) classification = "Atraso elevado";
      else if (s.relativeIndex > 2.00) classification = "Muito acima da média";
      s.classification = classification;
    });

    return stats.sort((a, b) => b.currentDelay - a.currentDelay);
  });


export const getRepetitionStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawRows, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, animal_group, location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(300);



    if (error) throw error;
    if (!rawRows || rawRows.length < 2) return null;
    const results = sortDrawsDesc(rawRows);


    const lastResult = results[0];
    const firstResultInSample = results[results.length - 1];

    const repetitionStats = {
      tenNextDraw: 0,
      groupNextDraw: 0,
      animalNextDraw: 0,
      sameTimeRepetition: 0,
      consecutiveTimeRepetition: 0,
      differentPositionRepetition: 0,
      maxConsecutive: 0,
      historicalPercent: 0,
      sampleSize: results.length,
      periodAnalyzed: `${firstResultInSample?.date ? new Date(firstResultInSample.date).toLocaleDateString('pt-BR') : ''} - ${lastResult?.date ? new Date(lastResult.date).toLocaleDateString('pt-BR') : ''}`,
      timeRepetitionData: [] as { time: string, count: number }[],
      detailedRepetitions: [] as any[],
    };


    const getGroupFromTen = (ten: string) => tenToGroup(ten) || null;

    let totalRepetitions = 0;
    const timeRepMap: Record<string, number> = {};
    let currentConsecutive = 0;

    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];
      if (!current || !next) continue;

      const currentTens = current.results?.slice(0, 5).map(r => r.slice(-2)) || [];
      const nextTens = next.results?.slice(0, 5).map(r => r.slice(-2)) || [];
      const currentGroups = currentTens.map(t => getGroupFromTen(t));
      const nextGroups = nextTens.map(t => getGroupFromTen(t));

      const commonTens = currentTens.filter(t => nextTens.includes(t));
      if (commonTens.length > 0) {
        repetitionStats.tenNextDraw++;
        totalRepetitions++;
        currentConsecutive++;
        repetitionStats.maxConsecutive = Math.max(repetitionStats.maxConsecutive, currentConsecutive);
        
        // Add detailed repetition info
        commonTens.forEach(ten => {
          const group = getGroupFromTen(ten);
          const animal = group ? (ANIMAL_GROUPS_DATA[group]?.name || "Desconhecido") : "Desconhecido";
          const currentPos = currentTens.indexOf(ten) + 1;
          const nextPos = nextTens.indexOf(ten) + 1;
          
          repetitionStats.detailedRepetitions.push({
            type: 'consecutive',
            value: ten,
            group,
            animal,
            icon: ANIMAL_GROUPS_MAP[group || '']?.icon || '',
            groupDezenas: ANIMAL_GROUPS_MAP[group || '']?.dezenas || [],
            currentDate: current.date,
            currentTime: current.time_type,
            nextDate: next.date,
            nextTime: next.time_type,
            currentPos,
            nextPos
          });
        });
      } else {
        currentConsecutive = 0;
      }

      if (currentGroups.filter(g => g && nextGroups.includes(g)).length > 0) repetitionStats.groupNextDraw++;
      if (current.animal_group && current.animal_group === next.animal_group) repetitionStats.animalNextDraw++;

      const currentType = current.time_type;
      if (currentType) {
        const prevSameTime = results.slice(i + 1).find(r => r.time_type === currentType);
        if (prevSameTime) {
          const prevTens = prevSameTime.results?.slice(0, 5).map(r => r.slice(-2)) || [];
          const matchedTens = currentTens.filter(t => prevTens.includes(t));
          if (matchedTens.length > 0) {
            repetitionStats.sameTimeRepetition++;
            timeRepMap[currentType] = (timeRepMap[currentType] || 0) + 1;
            
            matchedTens.forEach(ten => {
              const group = getGroupFromTen(ten);
              const animal = group ? (ANIMAL_GROUPS_DATA[group]?.name || "Desconhecido") : "Desconhecido";
              repetitionStats.detailedRepetitions.push({
                type: 'same-time',
                value: ten,
                group,
                animal,
                icon: ANIMAL_GROUPS_MAP[group || '']?.icon || '',
                groupDezenas: ANIMAL_GROUPS_MAP[group || '']?.dezenas || [],
                currentDate: current.date,
                currentTime: current.time_type,
                prevDate: prevSameTime.date,
                prevTime: prevSameTime.time_type,
                currentPos: currentTens.indexOf(ten) + 1,
                prevPos: prevTens.indexOf(ten) + 1
              });
            });
          }
        }
      }

      if (currentTens.some(t => nextTens.includes(t))) repetitionStats.consecutiveTimeRepetition++;

      let diffPos = false;
      currentTens.forEach((t, idx) => {
        if (nextTens.includes(t) && nextTens.indexOf(t) !== idx) diffPos = true;
      });
      if (diffPos) repetitionStats.differentPositionRepetition++;
    }


    repetitionStats.historicalPercent = Number(((totalRepetitions / (results.length - 1)) * 100).toFixed(2));
    repetitionStats.timeRepetitionData = Object.entries(timeRepMap).map(([time, count]) => ({ time, count }));

    return repetitionStats;
  });


/**
 * LÓGICA DEZENA ESQUERDA x DEZENA DIREITA
 * DEZENA = 2 casas decimais (ex.: 25). Um número sozinho (5) é UNIDADE.
 * O milhar do 1º prêmio é sempre normalizado com 4 casas (ex.: 0570) e
 * dividido em duas dezenas: ESQUERDA (as 2 primeiras casas) e
 * DIREITA (as 2 últimas casas — a dezena tradicional do jogo).
 * O zero à esquerda NUNCA é cortado: 5 é sempre exibido como 05.
 */
export const getDigitDelayStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawRows, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, time_value, location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(600);



    if (error) throw error;
    if (!rawRows || rawRows.length === 0) {
      return { left: [], right: [], totalDraws: 0, period: null, schedules: [] as string[], daily: [] as any[] };
    }

    const results = sortDrawsDesc(rawRows as any[]);
    const schedules = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"];

    /** milhares do 1º ao 5º prêmio, sempre com 4 casas (zero nunca é cortado) */
    const milhares = (row: any): string[] => {
      const arr = Array.isArray(row?.results) ? row.results.slice(0, 5) : [];
      return arr
        .map((p: any) => String(p ?? "").replace(/\D/g, ""))
        .filter((raw: string) => raw.length > 0)
        .map((raw: string) => raw.slice(-4).padStart(4, "0"));
    };
    const milhar = (row: any): string | null => milhares(row)[0] ?? null;
    const sideOf = (m: string, side: "left" | "right") => (side === "left" ? m.slice(0, 2) : m.slice(2, 4));
    const sideDezenas = (row: any, side: "left" | "right"): string[] =>
      milhares(row).map((m) => sideOf(m, side));


    const build = (side: "left" | "right") => {
      return Array.from({ length: 100 }, (_, d) => {
        const dezena = String(d).padStart(2, "0");
        let currentDelay = -1;
        let last: any = null;
        const intervals: number[] = [];
        let lastIndex = -1;

        const scheduleDelay: Record<string, number> = {};
        const scheduleSeen: Record<string, boolean> = {};
        const scheduleCount: Record<string, number> = {};
        const scheduleFreq: Record<string, number> = {};
        schedules.forEach((s) => {
          scheduleDelay[s] = 0;
          scheduleSeen[s] = false;
          scheduleCount[s] = 0;
          scheduleFreq[s] = 0;
        });

        const posOf = (row: any) => sideDezenas(row, side).indexOf(dezena);
        const matches = (row: any) => posOf(row) >= 0;

        results.forEach((res: any, index: number) => {
          const pos = posOf(res);
          const hit = pos >= 0;
          const st = String(res.time_type || "").toUpperCase();
          if (schedules.includes(st)) {
            scheduleCount[st] = (scheduleCount[st] ?? 0) + 1;
            if (hit) {
              scheduleFreq[st] = (scheduleFreq[st] ?? 0) + 1;
              scheduleSeen[st] = true;
            } else if (!scheduleSeen[st]) {
              scheduleDelay[st] = (scheduleDelay[st] ?? 0) + 1;
            }
          }
          if (!hit) return;
          if (currentDelay === -1) {
            currentDelay = index;
            last = {
              date: res.date,
              time_type: res.time_type,
              time_value: res.time_value,
              ten: dezena,
              prize: milhares(res)[pos] ?? null,
              position: pos + 1,
            };
          }

          if (lastIndex !== -1) intervals.push(index - lastIndex);
          lastIndex = index;
        });

        if (currentDelay === -1) currentDelay = results.length;
        const freqIn = (n: number) => results.slice(0, n).filter(matches).length;
        const avgDelay = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : results.length;
        const sorted = [...intervals].sort((a, b) => a - b);
        const medianDelay = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)]! : 0;
        const maxDelay = intervals.length > 0 ? Math.max(...intervals) : currentDelay;
        const minDelay = intervals.length > 0 ? Math.min(...intervals) : 0;
        const relativeIndex = avgDelay > 0 ? currentDelay / avgDelay : 0;

        let classification = "Dentro da média";
        if (relativeIndex < 0.75) classification = "Atraso baixo";
        else if (relativeIndex > 2) classification = "Muito acima da média";
        else if (relativeIndex > 1.25) classification = "Atraso elevado";

        const worstSchedule = schedules
          .map((s) => ({ schedule: s, delay: scheduleDelay[s] ?? 0, freq: scheduleFreq[s] ?? 0, total: scheduleCount[s] ?? 0 }))
          .sort((a, b) => b.delay - a.delay)[0] ?? null;

        return {
          side,
          digit: dezena,
          dezena,
          currentDelay,
          avgDelay: Number(avgDelay.toFixed(2)),
          medianDelay,
          maxDelay,
          minDelay,
          relativeIndex: Number(relativeIndex.toFixed(2)),
          classification,
          last,
          freqs: { 10: freqIn(10), 30: freqIn(30), 50: freqIn(50), 100: freqIn(100), 300: freqIn(300) },
          scheduleDelay,
          scheduleFreq,
          worstSchedule,
        };
      }).sort((a, b) => b.currentDelay - a.currentDelay || Number(a.dezena) - Number(b.dezena));
    };

    // Série diária: milhar do 1º prêmio dividido em dezena esquerda/direita
    const dayMap: Record<string, any> = {};
    results.forEach((r: any) => {
      const m = milhar(r);
      if (!m) return;
      if (!dayMap[r.date]) dayMap[r.date] = { date: r.date, draws: [] };
      dayMap[r.date].draws.push({
        time_type: r.time_type,
        time_value: r.time_value,
        ten: m.slice(2, 4),
        milhar: m,
        left: m.slice(0, 2),
        right: m.slice(2, 4),
      });
    });
    const daily = Object.values(dayMap)
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
      .slice(0, 12);

    const oldest = results[results.length - 1] as any;
    const newest = results[0] as any;

    return {
      left: build("left"),
      right: build("right"),
      totalDraws: results.length,
      schedules,
      period: { start: oldest?.date ?? null, end: newest?.date ?? null },
      daily,
    };
  });


/**
 * TABELA DE PUXADAS — mede, a cada horário, quantas vezes o grupo que saiu
 * no 1º prêmio "puxou" um dos seus grupos associados no sorteio seguinte.
 */
export const getPuxadasStats = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: rawRows, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, time_value, location")
      .eq("location" as any, data.location)
      .order("date", { ascending: false })
      .limit(600);


    if (error) throw error;

    const schedules = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"];
    const empty = {
      totalDraws: 0,
      period: null as { start: string | null; end: string | null } | null,
      schedules,
      table: PUXADAS_TABLE.map((p) => ({
        ...p,
        occurrences: 0,
        hits: 0,
        hitRate: 0,
        byTarget: [] as any[],
        bySchedule: [] as any[],
        lastOccurrence: null as any,
      })),
    };

    if (!rawRows || rawRows.length < 2) return empty;

    const desc = sortDrawsDesc(rawRows as any[]);
    const asc = [...desc].reverse();

    const groupOf = (row: any): string | null => {
      const prize: string | undefined = row?.results?.[0];
      if (!prize || prize.length < 2) return null;
      return tenToGroup(prize.slice(-2)) || null;
    };

    const table = PUXADAS_TABLE.map((p) => {
      const targets = p.puxa.map((t) => t.id).filter(Boolean);
      let occurrences = 0;
      let hits = 0;
      const targetCount: Record<string, number> = {};
      const schedStats: Record<string, { occurrences: number; hits: number }> = {};
      schedules.forEach((s) => (schedStats[s] = { occurrences: 0, hits: 0 }));
      let lastOccurrence: any = null;

      for (let i = 0; i < asc.length - 1; i++) {
        const cur = asc[i];
        const next = asc[i + 1];
        if (groupOf(cur) !== p.groupId) continue;
        occurrences++;
        const st = String(cur.time_type || "").toUpperCase();
        if (schedStats[st]) schedStats[st].occurrences++;
        const nextGroup = groupOf(next);
        const hit = !!nextGroup && targets.includes(nextGroup);
        if (hit) {
          hits++;
          if (schedStats[st]) schedStats[st].hits++;
          if (nextGroup) targetCount[nextGroup] = (targetCount[nextGroup] ?? 0) + 1;
        }
        lastOccurrence = {
          date: cur.date,
          time_type: cur.time_type,
          time_value: cur.time_value,
          ten: cur.results?.[0]?.slice(-2) ?? null,
          nextGroup,
          nextDate: next.date,
          nextTime: next.time_type,
          hit,
        };
      }

      return {
        ...p,
        occurrences,
        hits,
        hitRate: occurrences > 0 ? Number(((hits / occurrences) * 100).toFixed(1)) : 0,
        byTarget: p.puxa.map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          count: targetCount[t.id] ?? 0,
        })),
        bySchedule: schedules.map((s) => ({
          schedule: s,
          occurrences: schedStats[s]!.occurrences,
          hits: schedStats[s]!.hits,
          rate: schedStats[s]!.occurrences > 0
            ? Number(((schedStats[s]!.hits / schedStats[s]!.occurrences) * 100).toFixed(1))
            : 0,
        })),
        lastOccurrence,
      };
    });

    const oldest = asc[0] as any;
    const newest = desc[0] as any;

    return {
      totalDraws: desc.length,
      period: { start: oldest?.date ?? null, end: newest?.date ?? null },
      schedules,
      table,
    };
  });
