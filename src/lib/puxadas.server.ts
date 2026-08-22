import { ANIMAL_GROUPS_MAP, getGroupFromTen } from "@/lib/animals";
import { sortDrawsDesc } from "@/lib/draw-order";

/**
 * LÓGICA DE PUXADAS ESTATÍSTICAS
 * Analisa as ocorrências reais para determinar quais bichos realmente "puxam" outros.
 */
export function calculateStatisticalPuxadas(results: any[]) {
  if (!results || results.length < 2) return {};

  const sorted = sortDrawsDesc(results);
  const pairs: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};

  // Inicializa mapas para todos os 25 grupos
  for (let i = 1; i <= 25; i++) {
    const id = String(i).padStart(2, '0');
    pairs[id] = {};
    totals[id] = 0;
  }

  // Percorre os resultados comparando o atual com o anterior (na ordem cronológica)
  for (let i = sorted.length - 2; i >= 0; i--) {
    const current = sorted[i];
    const previous = sorted[i + 1];

    if (!current || !previous) continue;

    const prevTen = previous.results?.[0]?.slice(-2);
    const currTen = current.results?.[0]?.slice(-2);

    if (prevTen && currTen) {
      const prevGroup = getGroupFromTen(prevTen);
      const currGroup = getGroupFromTen(currTen);

      if (prevGroup && currGroup) {
        // Garantir que a estrutura exista antes de incrementar
        if (!pairs[prevGroup]) pairs[prevGroup] = {};
        
        totals[prevGroup] = (totals[prevGroup] || 0) + 1;
        pairs[prevGroup][currGroup] = (pairs[prevGroup][currGroup] || 0) + 1;
      }
    }
  }

  const stats: Record<string, any[]> = {};
  const groupIds = Object.keys(pairs);
  
  for (const groupId of groupIds) {
    const total = totals[groupId] || 0;
    const groupPairs = pairs[groupId] || {};
    
    const targets = Object.entries(groupPairs)
      .map(([targetId, count]) => {
        const animal = ANIMAL_GROUPS_MAP[targetId];
        return {
          id: targetId,
          name: animal?.name || '?',
          icon: animal?.icon || '',
          probability: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
          count
        };
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
    
    stats[groupId] = targets;
  }

  return stats;
}
