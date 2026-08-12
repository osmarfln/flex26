// Cliente base44 integrado com dados reais (Simulado com robô via soresultados.info)
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
      { 
        id: 1, 
        type: "PPT", 
        time: "09:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["5953", "2243", "4303", "1142", "8871"], 
        animal: "Gato", 
        group: "14" 
      },
      { 
        id: 2, 
        type: "PTM", 
        time: "11:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["7010", "9043", "5140", "4208", "3312"], 
        animal: "Burro", 
        group: "03" 
      },
      { 
        id: 3, 
        type: "PT", 
        time: "14:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["1251", "3432", "8407", "7274", "9915"], 
        animal: "Galo", 
        group: "13" 
      },
      { 
        id: 4, 
        type: "PTV", 
        time: "16:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["8292", "3749", "3795", "6861", "0022"], 
        animal: "Urso", 
        group: "23" 
      },
      { 
        id: 5, 
        type: "PTN", 
        time: "18:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["1278", "4737", "7880", "2262", "5519"], 
        animal: "Peru", 
        group: "20" 
      },
      { 
        id: 6, 
        type: "Corujinha", 
        time: "21:20", 
        date: "11/08/2026", 
        status: "finished", 
        result: ["8623", "0821", "4799", "8975", "1105"], 
        animal: "Cabra", 
        group: "06" 
      },
      { 
        id: 7, 
        type: "PPT", 
        time: "09:00", 
        date: "12/08/2026", 
        status: "scheduled", 
        result: [], 
        animal: "", 
        group: "" 
      },
    ],
    getStats: async () => ({
      mostDelayedGroups: [
        { group: "11", animal: "Cavalo", days: 15, lastSeen: "28/07/2026" },
        { group: "07", animal: "Leão", days: 12, lastSeen: "31/07/2026" },
        { group: "15", animal: "Jacaré", days: 9, lastSeen: "03/08/2026" },
        { group: "22", animal: "Tigre", days: 7, lastSeen: "05/08/2026" },
      ],
      mostFrequentTens: [
        { ten: "53", count: 18, trend: "up" },
        { ten: "10", count: 15, trend: "stable" },
        { ten: "51", count: 12, trend: "up" },
        { ten: "92", count: 11, trend: "down" },
        { ten: "78", count: 10, trend: "up" },
      ],
      delayedBySchedule: {
        "09:20": { group: "05", animal: "Cachorro", delayed: "8 dias" },
        "11:20": { group: "18", animal: "Coruja", delayed: "10 dias" },
        "14:20": { group: "02", animal: "Águia", delayed: "12 dias" },
        "16:20": { group: "25", animal: "Vaca", delayed: "15 dias" },
        "18:20": { group: "14", animal: "Gato", delayed: "7 dias" },
        "21:20": { group: "09", animal: "Cobra", delayed: "9 dias" },
      }
    }),
    updateStatus: async (gameId: number, status: string, results?: string[]) => {
      console.log(`Atualizando jogo ${gameId} para ${status} com resultados:`, results);
      return { success: true };
    }
  }
};
