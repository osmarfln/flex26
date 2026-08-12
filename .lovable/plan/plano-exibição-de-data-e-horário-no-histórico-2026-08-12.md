# Plano: Exibição de Data e Horário no Histórico

O usuário relatou que na página de arquivo (Histórico), os resultados estão aparecendo sem a data e o horário do sorteio. Analisando o código atual de `src/routes/historico.tsx`, verificamos que a data do dia não está sendo exibida em cada card de resultado, o que dificulta a identificação quando não há filtro por data selecionado.

## Alterações Propostas

### 1. Interface do Histórico (`src/routes/historico.tsx`)
- Adicionar a exibição da data no cabeçalho de cada card de resultado.
- Melhorar a exibição do horário (`time_value`) para garantir que seja visível.
- Formatar a data para o padrão brasileiro (DD/MM/AAAA).

### 2. Funções de Dados (`src/lib/lottery.functions.ts`)
- Garantir que o campo `date` seja retornado corretamente na consulta ao banco de dados (já parece estar correto, mas verificaremos a consistência).

## Detalhes Técnicos
- Utilizar `date-fns` para formatar a data `res.date` dentro do loop de renderização dos resultados no histórico.
- Incluir um pequeno ícone de calendário ao lado da data no card para melhor identificação visual.

## Próximos Passos
1. Modificar `src/routes/historico.tsx` para incluir `format` de `date-fns` e atualizar o cabeçalho do `Card`.
2. Validar se o horário (`time_value`) está sendo preenchido corretamente no banco de dados.
