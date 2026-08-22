# Plano de Implementação: Loterias Capital e Rio

Adição da localidade "Florianópolis" (Loterias Capital) à plataforma, com suporte a múltiplos horários, histórico separado, monitoramento via robô e estatísticas segmentadas.

## Alterações Sugeridas

### Backend (Supabase)
- Criar coluna `location` (ENUM 'rio', 'capital') na tabela `lottery_results`.
- Atualizar índice único para `(date, time_type, location)`.
- Adicionar `location` à tabela `sync_logs` para rastrear execuções por praça.
- Atualizar `has_role` e políticas de RLS se necessário (embora o acesso pareça ser global para autenticados).

### Scraper e Sincronização
- Modificar o endpoint `src/routes/api/public/sync-results.ts`:
  - Aceitar parâmetro `location`.
  - Implementar a lógica de busca para Loterias Capital no site `soresultados.info`.
  - Mapear os 11 horários da Capital (09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 18:00, 19:00, 20:30, 22:30).
  - Puxar histórico completo (2024-2026).

### Frontend - Componentes e Rotas
- **Navegação**: Adicionar seletor de localidade no cabeçalho ou logo abaixo do boas-vindas.
- **Página Inicial (`/`)**:
  - Filtrar os cards de resultados pela localidade selecionada.
  - Exibir a grade de 11 horários para Capital e 6 para Rio.
- **Histórico (`/historico`)**:
  - Adicionar abas/filtro para alternar entre Rio e Capital.
- **Estatísticas (`/estatisticas`)**:
  - Adicionar abas para escolher a base de dados (Rio ou Capital) para os cálculos de atraso, dezenas quentes, etc.
- **Robô (`/robot-status`)**:
  - Segmentar o monitoramento por localidade.

### Utilitários
- Atualizar `src/lib/lottery.functions.ts` para aceitar `location` em todas as funções de busca e estatísticas.
- Atualizar `src/lib/draw-order.ts` com a definição dos horários da Capital.

## Detalhes Técnicos
- Migração SQL para adicionar `location` e migrar dados existentes para `rio`.
- Ajuste nas `createServerFn` para incluir `location` nos validadores Zod.
- Persistência da preferência de localidade no `localStorage` ou `URL query param`.
