# Corrigir o recálculo automático das ferramentas a cada novo resultado

## O que foi verificado

- A base tem 1.789 resultados (14/09/2025 a 12/08/2026), todos com dezenas preenchidas — os dados existem.
- A tabela `lottery_results` **não está publicada no Realtime**. As assinaturas na Home e em Estatísticas estão escritas no código, mas o banco nunca envia os eventos. Resultado: quando entra um resultado novo, nada é recalculado até recarregar a página.
- Todas as consultas de estatística ordenam **apenas por data** (`order("date", desc)`), sem desempate por horário. Dentro do mesmo dia a ordem dos 6 horários fica aleatória, então "atraso atual", intervalos, repetições e comparações de períodos usam uma sequência de concursos errada.
- `getStats` calcula atraso em **dias de calendário** sobre apenas 200 registros, enquanto o resto da plataforma calcula em **concursos** — números divergentes entre a Home e Estatísticas.

## O que será feito

1. **Ligar o Realtime de verdade**: adicionar `lottery_results` à publicação de tempo real e garantir `REPLICA IDENTITY FULL`. Assim toda inserção do robô dispara a atualização.
2. **Corrigir a ordem dos concursos** em todas as funções de cálculo (atraso de dezenas, atraso de grupos, repetições, visão geral): ordenar por data e depois por horário oficial (PPT → PTM → PT → PTV → PTN → COR), do mais recente para o mais antigo.
3. **Unificar o cálculo de atraso** da Home com o de Estatísticas: passar a usar contagem de concursos (e mostrar também a data da última ocorrência), eliminando a divergência.
4. **Revalidação completa ao chegar resultado**: invalidar todas as chaves de consulta usadas nas ferramentas (resultados do dia, ranking, dezenas, grupos, repetições, ciclos, visão geral, histórico e status do robô), em vez da lista parcial atual, e aplicar o mesmo nas páginas Histórico e Status do Robô.
5. **Rede de segurança**: atualização periódica (a cada 60s) enquanto a página estiver visível, para o caso de a conexão de tempo real cair.
6. **Sinal visual**: indicador de "atualizado agora" quando os cálculos são refeitos, para ficar claro que o mecanismo trabalhou.

## Detalhes técnicos

- Migração: `ALTER PUBLICATION supabase_realtime ADD TABLE public.lottery_results;` + `ALTER TABLE public.lottery_results REPLICA IDENTITY FULL;`
- `src/lib/lottery.functions.ts`: mapa de prioridade de `time_type` e ordenação em memória após o fetch (o Postgres não ordena texto de horário na ordem correta), aplicada em `getStats`, `getTenDelayStats`, `getGroupDelayStats`, `getRepetitionStats` e visão geral.
- `src/routes/index.tsx`, `src/routes/estatisticas.tsx`, `src/routes/historico.tsx`, `src/routes/robot-status.tsx`: canal Realtime por página com `queryClient.invalidateQueries()` abrangente + `refetchInterval` de fallback.
- Nenhuma alteração no design nem nos textos existentes, além do indicador de atualização.
