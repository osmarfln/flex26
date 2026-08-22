# Plano de Sincronização de Histórico Capital 2026

Implementar a coleta completa do histórico de resultados da loteria "Capital" (Florianópolis) para o ano de 2026, utilizando a base de dados externa sincronizada com o site soresultados.info.

## Alterações Técnicas

### 1. API de Sincronização (`src/routes/api/public/sync-results.ts`)
- Ajustar a lógica para diferenciar a fonte de dados baseada na localização:
  - **Rio**: Mantém a consulta à tabela `draw_results` (removendo o filtro de coluna `location` que não existe na origem).
  - **Capital**: Passa a consultar a tabela `capital_results` na API externa.
- Implementar mapeamento de horários da Capital:
  - Mapear códigos como `LCAP_09`, `CAP_14`, `BAND_15`, `LCAP_2230`, etc., para os padrões internos `L-09`, `L-14`, `L-15`, `L-22`.
- Aumentar ou remover o limite de `offset` para permitir a sincronização de todo o histórico de 2026.
- Garantir que o campo `time_value` seja extraído corretamente para os novos horários da Capital.

### 2. Página de Histórico (`src/routes/_authenticated/historico.tsx`)
- Refinar a interface para garantir que a troca entre Rio e Capital seja intuitiva.
- O botão "Sincronizar Tudo" deve estar configurado para buscar todo o histórico de 2026 da banca selecionada.
- Adicionar um feedback visual mais claro durante a sincronização em massa.

### 3. Funções de Sorteio (`src/lib/draw-order.ts` e `src/lib/lottery.functions.ts`)
- Revisar a ordenação e os horários para garantir que os resultados importados apareçam na ordem correta no histórico e nos arquivos.

## Passos de Execução
1. Modificar `sync-results.ts` com a nova lógica de fontes e mapeamento.
2. Atualizar `historico.tsx` para melhorar a experiência de sincronização histórica.
3. Realizar uma sincronização de teste para a Capital 2026.
4. Validar se os dados aparecem corretamente na aba de histórico filtrada por "Capital".

## Auditoria e Segurança
- Todas as ações de sincronização manual serão registradas na tabela `sync_logs` para acompanhamento.
- O uso de `supabaseAdmin` no servidor garante permissões adequadas para inserção em massa sem conflitos de RLS.
