// Cliente local apenas para perfil do painel de gerenciamento.
// Nenhum dado de resultado/estatística vem daqui: tudo é lido do banco em tempo real.
export const base44 = {
  auth: {
    me: async () => ({
      email: 'flixautomacaosc@gmail.com',
      nivel: 'diamante',
      status: 'aprovado',
      nome: 'Admin Master'
    }),
    updateMe: async (data: any) => data
  }
};
