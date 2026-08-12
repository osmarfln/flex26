# Plano de Implementação - Correção de Reset de Resultados e Painéis

O usuário relatou que os painéis de horários não estão aparecendo corretamente e que os resultados devem ser "resetados" à meia-noite, voltando a exibir novos resultados apenas a partir das 09:00 (PTT). Atualmente, o painel mantém os resultados do dia anterior mesmo após a meia-noite se nenhum dado novo for carregado.

## Alterações Técnicas

### 1. Frontend (`src/routes/index.tsx`)
- **Filtro de Data nos Resultados**: Alterar a chamada `getResults` para filtrar apenas resultados do dia atual (em fuso local/Brasília).
- **Lógica de Exibição Condicional**: Se a hora atual for entre 00:00 e 09:00, exibir um estado de "Aguardando primeiro sorteio do dia (PTT 09:00)" em vez de mostrar resultados do dia anterior.
- **Seção de Estatísticas**: Garantir que as estatísticas reflitam que o painel está em modo de espera durante a madrugada.

### 2. Backend (`src/lib/lottery.functions.ts`)
- Ajustar a função `getResults` para aceitar um parâmetro opcional que restrinja a busca estritamente ao dia atual, se solicitado.

### 3. Melhoria no Robô (`src/routes/api/public/sync-results.ts`)
- O robô já roda de hora em hora, mas precisamos garantir que ele não tente processar dados "vazios" de forma que suje o log durante a madrugada, ou que o frontend saiba lidar com a ausência de dados do dia 12 (hoje) sem pegar do dia 11 (ontem) por engano na home.

## Detalhes da Implementação

### Reset à Meia-noite
Atualmente, a query na Home busca os 6 últimos resultados sem filtro de data:
```typescript
queryFn: () => getResults({ data: { limit: 6 } }),
```
Isso faz com que às 00:10 ele ainda mostre os resultados de ontem. 
**Mudança**: Vamos passar a data atual para o `getResults` na Home. Se não houver resultados para "hoje", a lista virá vazia, o que acionará o estado de "Aguardando" no frontend.

### Fluxo do Usuário
1. **00:00 - 08:59**: O painel da Home fica limpo (zerado). Um aviso informa que o primeiro sorteio é às 09:00.
2. **Consultar Passados**: O usuário deve ser direcionado ao link de **Histórico** para ver os resultados de ontem ou anos anteriores.
3. **09:00+**: Assim que o robô sincronizar o PTT, ele aparece na Home automaticamente via Realtime.

---
Vou prosseguir com a implementação destas mudanças.