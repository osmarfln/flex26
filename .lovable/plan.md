# Plano de Correção e Otimização do Robô de Sincronização

O usuário reportou que a Capital não está sendo atualizada automaticamente e que o robô não está captando os resultados corretamente de `soresultados.info`. Embora a plataforma use uma base externa intermediária (REST API), a sincronização automática parece estar falhando ou incompleta para a Capital.

## Problemas Identificados
1.  **Mapeamento de Horários da Capital:** O mapeamento entre a base de origem (`LCAP_XX`) e o sistema interno (`L-XX`) na rota `sync-results` pode estar incompleto ou falhando em capturar novos horários adicionados recentemente no site original.
2.  **Sincronização Periódica (Cron):** A sincronização automática precisa garantir que ambas as localizações (Rio e Capital) sejam processadas em cada ciclo.
3.  **Integridade de Dados:** Garantir que o robô tente sincronizar múltiplos dias para evitar lacunas caso o site de origem demore a publicar.

## Alterações Técnicas

### 1. Reforçar a Rota de Sincronização (`src/routes/api/public/sync-results.ts`)
*   Atualizar o `capMap` para incluir possíveis variações de nomes de horários da Capital encontrados na base de origem (ex: `PTSP`, `BAND`, `CAP` vs `LCAP`).
*   Garantir que o loop de sincronização diária sempre itere sobre `rio` e `capital` independente dos parâmetros, a menos que especificado o contrário.
*   Aumentar a janela de busca retrospectiva padrão de 2 para 3 dias nas execuções automáticas para garantir cobertura de finais de semana ou atrasos na origem.

### 2. Ajustar a Lógica do Robô (`src/lib/robot.functions.ts`)
*   Melhorar o `getScheduleSyncMatrix` para reportar corretamente o status da Capital, garantindo que o mapeamento de "fonte" reflita o que a API REST entrega.

### 3. Verificação de Cron e Logs
*   Verificar se o robô está sendo chamado via cron corretamente para ambas as localizações.
*   Adicionar logs mais detalhados na inserção/atualização para facilitar o rastreamento no painel de `/robot-status`.

## Benefícios
*   Automação 100% funcional para Capital e Rio.
*   Painel de status do robô preciso, refletindo a realidade da sincronização.
*   Fim da necessidade de intervenção humana para "puxar" resultados manualmente.
