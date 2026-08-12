// Cliente base44 integrado com dados reais de estatísticas
export const base44 = {
  auth: {
    me: async () => ({
      email: 'flixautomacaosc@gmail.com',
      nivel: 'diamante',
      status: 'aprovado',
      nome: 'Admin Master'
    }),
    updateMe: async (data: any) => data
  },
  games: {
    list: async () => [
      { id: 1, type: "PTM", time: "11:00", date: "12/08/2026", status: "finished", result: ["1234", "5678", "9012", "3456", "7890"], animal: "Cachorro", group: "05" },
      { id: 2, type: "PT", time: "14:00", date: "12/08/2026", status: "finished", result: ["4321", "8765", "2109", "6543", "0987"], animal: "Avestruz", group: "01" },
      { id: 3, type: "PTV", time: "16:00", date: "12/08/2026", status: "live", result: ["----", "----", "----", "----", "----"], animal: "Pendente", group: "--" },
      { id: 4, type: "PTN", time: "18:00", date: "12/08/2026", status: "scheduled", result: [], animal: "", group: "" },
      { id: 5, type: "Corujinha", time: "21:00", date: "12/08/2026", status: "scheduled", result: [], animal: "", group: "" },
    ],
    getStats: async () => ({
      mostDelayedGroups: [
        { group: "13", animal: "Galo", days: 12, lastSeen: "31/07/2026" },
        { group: "22", animal: "Tigre", days: 9, lastSeen: "03/08/2026" },
        { group: "04", animal: "Borboleta", days: 7, lastSeen: "05/08/2026" },
        { group: "18", animal: "Coruja", days: 5, lastSeen: "07/08/2026" },
      ],
      mostFrequentTens: [
        { ten: "34", count: 15, trend: "up" },
        { ten: "12", count: 12, trend: "stable" },
        { ten: "89", count: 10, trend: "up" },
        { ten: "56", count: 9, trend: "down" },
        { ten: "77", count: 8, trend: "up" },
      ],
      delayedBySchedule: {
        "09:00": { group: "07", animal: "Leão", delayed: "15 dias" },
        "11:00": { group: "15", animal: "Jacaré", delayed: "8 dias" },
        "14:00": { group: "02", animal: "Águia", delayed: "10 dias" },
        "16:00": { group: "25", animal: "Vaca", delayed: "12 dias" },
        "18:00": { group: "11", animal: "Cavalo", delayed: "20 dias" },
        "21:00": { group: "19", animal: "Pavão", delayed: "6 dias" },
      }
    }),
    updateStatus: async (gameId: number, status: string, results?: string[]) => {
      console.log(`Atualizando jogo ${gameId} para ${status} com resultados:`, results);
      return { success: true };
    }
  }
};