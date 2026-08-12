---
title: Correção da exibição de Data e Horário no Histórico
description: Corrigir a exibição de data e horário na página de histórico, garantindo que os dados sincronizados sejam exibidos corretamente conforme a captura de tela.
---

## Problema
O usuário relatou que a página de histórico (arquivo) não está exibindo as datas e horários corretamente, conforme mostrado em uma captura de tela onde os horários aparecem como `--:--`.

## Análise
Ao revisar `src/routes/api/public/sync-results.ts`, notei que o campo `time_value` está sendo definido como `null` durante a sincronização:
```typescript
await supabase.from('lottery_results').upsert({
  date: res.draw_date,
  time_type: res.draw_time,
  time_value: null, // Aqui está o erro: deve mapear o horário real se disponível
  // ...
});
```
Na página `src/routes/historico.tsx`, o componente tenta renderizar `res.time_value || '--:--'`, o que resulta no comportamento observado.

## Mudanças Propostas

### Backend (Sincronização)
1.  **Atualizar `src/routes/api/public/sync-results.ts`**:
    *   Mapear o campo de horário da fonte externa (provavelmente algo como `res.draw_time_value` ou derivar do `draw_time` se for um horário fixo) para o campo `time_value` da tabela local.
    *   Se o site `soresultados.info` fornece o horário real (ex: "09:20"), usaremos esse valor. Caso contrário, definiremos horários padrão baseados no `time_type` (PPT = 09:20, PTM = 11:20, etc).

### Frontend (Interface)
1.  **Ajustar `src/routes/historico.tsx`**:
    *   Garantir que a data e o horário sejam exibidos de forma robusta.
    *   Verificar se a formatação brasileira da data está sendo aplicada corretamente em todos os cenários.

## Verificação
1.  Executar a sincronização novamente via `curl` ou botão no navegador.
2.  Validar se os novos registros no banco de dados possuem o campo `time_value` preenchido.
3.  Confirmar visualmente na página `/historico` se as datas e horários aparecem conforme a imagem de referência.
