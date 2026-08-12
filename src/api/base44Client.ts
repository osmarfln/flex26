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
      { id: 1, homeTeam: "Flamengo", awayTeam: "Palmeiras", time: "20:00", date: "12/08/2026", status: "scheduled", league: "Série A" },
      { id: 2, homeTeam: "Real Madrid", awayTeam: "Barcelona", time: "16:00", date: "12/08/2026", status: "live", score: "1-0", league: "La Liga" },
      { id: 3, homeTeam: "Man City", awayTeam: "Liverpool", time: "14:30", date: "13/08/2026", status: "scheduled", league: "Premier League" },
    ],
    updateStatus: async (gameId: number, status: string) => {
      console.log(`Atualizando jogo ${gameId} para ${status}`);
      return { success: true };
    }
  }
};