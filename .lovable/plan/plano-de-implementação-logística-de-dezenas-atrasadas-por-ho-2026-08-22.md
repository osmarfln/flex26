# Plano de Implementação: Logística de Dezenas Atrasadas por Horário

Implementação de análises avançadas de probabilidade e atraso de dezenas segmentadas por horário para Rio e Capital, integrando o histórico com os resultados diários em tempo real.

## Alterações Técnicas

### Backend (`src/lib/lottery.functions.ts`)
- **Nova função `getTenDelayByScheduleStats`**:
  - Calcula o atraso de dezenas (00-99) filtrado por `time_type` (horário).
  - Cruza o histórico longo (600+ sorteios) com os resultados do dia atual.
  - Retorna métricas de probabilidade baseadas na frequência da dezena naquele horário específico vs. média global.
  - Implementa lógica de "Soma/Logística" para prever dezenas com maior probabilidade de aparecer baseada no ciclo de atraso.

### Frontend - Componentes (`src/components/`)
- **Novo componente `TenDelayBySchedule.tsx`**:
  - Exibição em cards para cada horário.
  - Cada card mostrará o cálculo de probabilidade e a dezena mais atrasada daquele horário.
  - Visual diferenciado para Rio e Capital (conforme seletor de localidade).

### Frontend - Páginas (`src/routes/_authenticated/estatisticas.tsx`)
- Adicionar nova aba "Atraso por Horário".
- Integrar os novos cards de análise logística.
- Garantir que o botão "Sincronizar agora" invalide também esses novos dados.

## Experiência do Usuário
- O usuário poderá ver quais dezenas estão "maduras" para sair em horários específicos (ex: PTM no Rio ou L-13 na Capital).
- Cards detalhados com a soma e probabilidade calculada pelo robô AI.
- Separação clara entre as praças Rio e Capital.
