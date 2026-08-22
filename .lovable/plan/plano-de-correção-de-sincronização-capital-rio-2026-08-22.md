# Plano de Correção de Sincronização Capital/Rio

O objetivo é garantir que os resultados da Capital (Florianópolis) e Rio sejam capturados corretamente, mapeando identificadores como `PTSP_15` para o horário de 15:00 da Capital e removendo menções a "BAND" onde não se aplicam, além de reforçar a automação sem intervenção humana.

## Alterações Técnicas

### 1. Backend: Refinamento do Mapeamento de Sincronização
- **Arquivo:** `src/routes/api/public/sync-results.ts`
- **Ação:** Adicionar `PTSP_15` ao `capMap` para mapear corretamente para `L-15` (15:00) na Capital.
- **Ação:** Garantir que a lógica de upsert considere corretamente a localização para evitar sobreposição ou falta de dados.

### 2. Interface: Atualização de Textos e Labels
- **Arquivo:** `src/routes/_authenticated/index.tsx`
- **Ação:** Atualizar o texto de boas-vindas e sub-hero para reforçar que os resultados são automatizados via robô e sem intervenção humana.
- **Ação:** Ajustar labels de localidade para serem precisas ("Capital (Florianópolis)" e "Rio de Janeiro").

### 3. Verificação de Integridade
- **Ação:** Verificar no banco de dados se existem entradas marcadas incorretamente e garantir que o próximo ciclo de sincronização (ou manual via Robô) corrija os dados retroativos (janela de 3 dias).

## Próximos Passos
1. Aplicar as alterações de mapeamento no backend (concluído parcialmente).
2. Atualizar as strings de UI na homepage.
3. Testar a sincronização via painel do Robô para o horário de 15:00.
