# Implementação da Loteria Capital (Florianópolis)

Este plano descreve a integração dos resultados da Loteria Capital ao lado dos resultados do Rio, permitindo que o usuário alterne entre as duas localizações em toda a plataforma.

## Ações Realizadas
- Criado o tipo `lottery_location` ('rio', 'capital') no banco de dados.
- Adicionada a coluna `location` às tabelas `lottery_results` e `sync_logs`.
- Atualizada a restrição de unicidade para considerar `(date, time_type, location)`.
- Atualizado `src/lib/draw-order.ts` com os horários oficiais da Capital (11 sorteios).

## Próximos Passos

### 1. Atualizar Scraping (Backend)
- Modificar `src/routes/api/public/sync-results.ts` para suportar o parâmetro `location`.
- Implementar a lógica de scraping para a Capital a partir da fonte `soresultados.info`.
- Garantir que o `supabaseAdmin` realize o upsert com a localização correta.

### 2. Atualizar Funções de Dados
- Modificar `src/lib/lottery.functions.ts` para aceitar `location` em todas as funções de busca (`getResults`, `getStats`, `getTenDelayStats`, etc.).
- Filtrar os resultados no banco de dados pela localização selecionada.

### 3. Interface do Usuário (Frontend)
- **Homepage (`index.tsx`):**
    - Adicionar seletor de localização (Rio / Capital).
    - Ajustar a grade de resultados para mostrar 11 cards (Capital) ou 6 cards (Rio).
    - Persistir a escolha do usuário.
- **Histórico e Estatísticas:**
    - Adicionar abas ou seletor para alternar entre Rio e Capital.
    - Garantir que todos os cálculos estatísticos (atrasos, dezenas quentes, puxadas) sejam baseados na localização selecionada.
- **Status do Robô:**
    - Mostrar o status de sincronização para ambas as localizações.
    - Permitir sincronização manual específica por localização.

## Detalhes Técnicos
- **Localização:** `rio` (default) ou `capital`.
- **Horários Capital:** 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 18:00, 19:00, 20:30, 22:30.
- **Filtros SQL:** Todas as queries devem incluir `.eq('location', selectedLocation)`.
- **Realtime:** As subscrições do Supabase devem considerar o canal da localização ativa.
