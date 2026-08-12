// Mock do cliente base44 para manter a compatibilidade com o prompt
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
    updateStatus: async (gameId: number, status: string, results?: string[]) => {
      console.log(`Atualizando jogo ${gameId} para ${status} com resultados:`, results);
      return { success: true };
    }
  }
};