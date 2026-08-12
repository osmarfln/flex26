import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ANIMAL_GROUPS_MAP, getGroupFromTen as tenToGroup } from "@/lib/animals";

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

const ANIMAL_GROUPS_DATA = ANIMAL_GROUPS_MAP;

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
    const { data: results, error } = await supabase
      .from("lottery_results")
      .select("*")
      .order("date", { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!results) return { mostDelayedGroups: [], mostFrequentTens: [], delayedBySchedule: {} };

    const lastSeen: Record<string, string> = {};
    const tenCounts: Record<string, number> = {};
    const scheduleDelay: Record<string, { group: string, date: string }> = {};

    results.forEach(res => {
      const group = res.animal_group;
      if (group) {
        if (!lastSeen[group]) lastSeen[group] = res.date;
        const firstPrize = res.results?.[0];
        if (firstPrize && firstPrize.length >= 2) {
          const ten = firstPrize.slice(-2);
          tenCounts[ten] = (tenCounts[ten] || 0) + 1;
        }
        const key = res.time_type;
        if (key && !scheduleDelay[key]) scheduleDelay[key] = { group, date: res.date };
      }
    });

    const mostDelayedGroups = Object.keys(ANIMAL_GROUPS_DATA)
      .map(group => {
        const lastDate = lastSeen[group];
        const lastDateObj = lastDate ? new Date(lastDate) : null;
        const days = lastDateObj ? Math.floor((new Date().getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)) : 99;
        const animalInfo = ANIMAL_GROUPS_DATA[group];
        return {
          group,
          animal: animalInfo ? animalInfo.name : "Desconhecido",
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
        const groupInfo = ANIMAL_GROUPS_DATA[entry.group];
        delayedBySchedule[time] = {
          group: entry.group,
          animal: groupInfo ? groupInfo.name : "Desconhecido",
          delayed: `${days} dias`
        };
      }
    });

    return { mostDelayedGroups, mostFrequentTens, delayedBySchedule };
  });

export const getTenDelayStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: results, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type")
      .order("date", { ascending: false })
      .limit(600); // Need more data for comparative periods (300 current + 300 previous)

    if (error) throw error;
    if (!results) return [];

    const stats: any[] = [];
    const allTens = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

    const current300 = results.slice(0, 300);
    const previous300 = results.slice(300, 600);

    allTens.forEach(ten => {
      let currentDelay = -1;
      const intervals: number[] = [];
      let lastIndex = -1;
      
      const freq10 = current300.slice(0, 10).filter(r => r.results?.[0]?.slice(-2) === ten).length;
      const freq30 = current300.slice(0, 30).filter(r => r.results?.[0]?.slice(-2) === ten).length;
      const freq50 = current300.slice(0, 50).filter(r => r.results?.[0]?.slice(-2) === ten).length;
      const freq100 = current300.slice(0, 100).filter(r => r.results?.[0]?.slice(-2) === ten).length;
      const freq300 = current300.filter(r => r.results?.[0]?.slice(-2) === ten).length;
      
      const prevFreq300 = previous300.filter(r => r.results?.[0]?.slice(-2) === ten).length;
      const periodComparison = prevFreq300 > 0 ? ((freq300 - prevFreq300) / prevFreq300) * 100 : (freq300 > 0 ? 100 : 0);

      results.forEach((res, index) => {
        const firstPrize = res.results?.[0];
        const drawnTen = firstPrize?.slice(-2);
        if (drawnTen === ten) {
          if (currentDelay === -1) currentDelay = index;
          if (lastIndex !== -1) intervals.push(index - lastIndex);
          lastIndex = index;
        }
      });

      if (currentDelay === -1) currentDelay = 500;
      const avgDelay = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 100;
      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const medianDelay = sortedIntervals.length > 0 ? sortedIntervals[Math.floor(sortedIntervals.length / 2)] : 100;
      const maxDelay = intervals.length > 0 ? Math.max(...intervals) : currentDelay;
      const minDelay = intervals.length > 0 ? Math.min(...intervals) : currentDelay;
      const relativeIndex = currentDelay / avgDelay;

      // Regularidade (Coeficiente de Variação Inverso do Atraso)
      const variance = intervals.length > 1 ? intervals.reduce((acc, val) => acc + Math.pow(val - avgDelay, 2), 0) / (intervals.length - 1) : 0;
      const stdDev = Math.sqrt(variance);
      const regularityScore = avgDelay > 0 ? stdDev / avgDelay : 1;
      
      let regularity = "Média";
      if (regularityScore < 0.5) regularity = "Alta";
      else if (regularityScore > 1.2) regularity = "Baixa";

      stats.push({
        ten,
        currentDelay,
        avgDelay: Number(avgDelay.toFixed(2)),
        medianDelay,
        maxDelay,
        minDelay,
        relativeIndex: Number(relativeIndex.toFixed(2)),
        freqs: { 10: freq10, 30: freq30, 50: freq50, 100: freq100, 300: freq300 },
        regularity,
        periodComparison: Number(periodComparison.toFixed(2))
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
  .handler(async () => {
    const { data: results, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, animal_group")
      .order("date", { ascending: false })
      .limit(600);

    if (error) throw error;
    if (!results) return [];

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

      results.forEach((res, index) => {
        let foundInThisResult = false;
        res.results?.slice(0, 5).forEach((prize, pIdx) => {
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

      stats.push({
        groupId,
        animal: ANIMAL_GROUPS_DATA[groupId] ? ANIMAL_GROUPS_DATA[groupId].name : "Desconhecido",
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
  .handler(async () => {
    const { data: results, error } = await supabase
      .from("lottery_results")
      .select("results, date, time_type, animal_group")
      .order("date", { ascending: false })
      .limit(300);

    if (error) throw error;
    if (!results || results.length < 2) return null;

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
