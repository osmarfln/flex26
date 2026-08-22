# Plano de Sincronização e Automação Capital

Configurar a sincronização automática dos resultados da Capital (Florianópolis) via robô, utilizando a fonte de dados `soresultados.info` (integrada via API externa) e garantindo que o robô admin e as estatísticas reflitam esses dados sem intervenção humana.

## Ações imediatas

- Atualizar o robô de sincronização (`sync-results.ts`) para suportar a busca automática de ambas as bancas (Rio e Capital).
- Reconfigurar o agendamento `pg_cron` no banco de dados para incluir o parâmetro de automação total.
- Garantir que todas as páginas (Início, Histórico, Estatísticas, Palpites) utilizem a localização correta para exibir dados reais e não mockados.

## Detalhes técnicos

- **Sincronização**: Modificar o handler da rota `/api/public/sync-results` para que, ao receber o parâmetro `auto: true`, processe sequencialmente as localizações 'rio' e 'capital'.
- **Banco de Dados**: O cron job agora chamará a API com `{"daysToSync": 2, "auto": true}`, garantindo cobertura de ambas as bancas a cada 10 minutos.
- **Interface**:
  - Validar que o componente `SiteHeader` e `BackNav` permitam navegação fluida.
  - Assegurar que os cálculos de atraso diário e alertas em `lottery.functions.ts` considerem a banca selecionada pelo usuário.
  - No Painel Admin, a aba Robô mostrará o status detalhado de ambas as bancas conforme selecionado no filtro.
