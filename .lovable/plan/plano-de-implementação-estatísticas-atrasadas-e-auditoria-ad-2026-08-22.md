# Plano de Implementação - Estatísticas Atrasadas e Auditoria Admin

O objetivo é implementar a análise de dezenas em atraso (Rio e Capital) com base em cálculos diários e históricos, além de criar uma aba de auditoria no painel administrativo para registro de ações dos gestores.

## 1. Backend e Lógica

### Estatísticas de Atraso (Rio e Capital)
- **Cálculo de Atraso Diário**: Implementar lógica para identificar dezenas que não saíram entre horários do mesmo dia (ex: PTM -> PT).
- **Cálculo de Atraso Histórico**: Utilizar a base de dados (2024-2026) para identificar atrasos de longo prazo.
- **Predição de Atraso**: Criar "2 possibilidades" de atraso combinando a frequência diária com a tendência histórica.
- **Segmentação por Localidade**: Garantir que todos os cálculos respeitem o filtro `location` (Rio/Capital).

### Auditoria Administrativa
- **Nova Tabela `admin_audit`**:
  - `id`, `user_id` (admin), `action` (permitir, bloquear, excluir, limpar), `target_user_id`, `details`, `created_at`.
- **Registro Automático**: Modificar as funções administrativas existentes em `src/lib/admin.functions.ts` para inserir registros na tabela de auditoria ao realizar ações.

## 2. Interface do Usuário (Frontend)

### Aba de Estatísticas
- **Novos Filtros**: Adicionar filtros de localidade e intervalo de datas em Histórico, Estatísticas e Palpites.
- **Visualização de Atraso**: Adicionar cards ou gráficos detalhando as "2 possibilidades" de atraso (curto vs longo prazo).

### Painel Administrativo
- **Nova Aba "Auditoria"**:
  - Tabela listando as ações realizadas, com filtros por data e usuário responsável.
  - Ícones para identificar rapidamente o tipo de ação (verde para aprovação, vermelho para bloqueio/exclusão).

## 3. Detalhes Técnicos
- Atualização do `src/lib/lottery.functions.ts` para incluir as novas métricas de atraso diário.
- Migração SQL para criação da tabela `admin_audit` com RLS e GRANTs.
- Atualização do hook `useActivityTracker` se necessário, ou uso direto de uma nova função de log de auditoria.
