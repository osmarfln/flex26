# Plano de Implementação: Análise Premium para Capital (Florianópolis)

Este plano detalha a implementação da lógica de atrasos, estatísticas e monitoramento inteligente especificamente para a loteria **Capital (Florianópolis)**, seguindo a mesma estrutura já existente para o Rio, mas utilizando a base de dados e horários específicos da Capital.

## Ações Detalhadas

### 1. Backend: Refatoração de `lottery.functions.ts`
- **Atrasos de Dezenas (Capital)**: Garantir que `getTenDelayStats` calcule corretamente o `dailyDelay` (atraso entre horários do dia) usando a escala de 11 horários da Capital (`L-09` a `L-22`).
- **Atrasos de Grupos (Capital)**: Atualizar `getGroupDelayStats` para processar corretamente o histórico da Capital, identificando o bicho mais atrasado no 1º prêmio e em todas as posições.
- **Milhares Esquerda/Direita (Capital)**: Ajustar `getDigitDelayStats` para monitorar a milhar da Capital, calculando os atrasos específicos para o banco de dados `location='capital'`.
- **Ranking e Frequência**: Garantir que os rankings de "Bicho em Alta" e "Grupos Atrasados" reflitam a volatilidade específica da Capital (mais sorteios diários).

### 2. Frontend: Interface de Estatísticas (`estatisticas.tsx`)
- **Aba "Análise Premium"**:
    - Quando `location === 'capital'`, exibir o painel de **Monitoramento Inteligente Capital**.
    - Mostrar o "Bicho em Alta" da Capital (baseado nos últimos 30 concursos da Capital).
    - Exibir "Milhar Destaque" (E+D) para Capital.
- **Tabela de Grupos e Ranking**:
    - Adicionar visualização de Ciclos e Ranking de Atrasos focada em Capital.
    - Garantir que as dezenas exibidas em cada grupo sejam monitoradas em tempo real conforme os resultados da Capital entram.
- **Filtros e Visualização**:
    - Garantir que ao alternar para "Capital", todos os gráficos de barras e linhas mudem instantaneamente para os dados de Florianópolis.

### 3. Componentes Específicos
- **Alerta de Dezenas Atrasadas**: Atualizar `AlertaDezenasAtrasadas.tsx` para mostrar notificações críticas quando uma dezena da Capital ultrapassar o limite de atraso diário (3 horários sem sair).
- **Puxadas e Dezenas E/D**: Validar se `PuxadasPanel` e `DezenasEsquerdaDireita` estão puxando os dados do handler correto filtrado por `location='capital'`.

## Detalhes Técnicos
- Utilizar os horários `L-09, L-10, L-11, L-13, L-14, L-15, L-16, L-18, L-19, L-20, L-22` para o cálculo de `dailyDelay`.
- Normalizar todas as milhares da Capital para 4 dígitos com zeros à esquerda.
- As consultas ao Supabase devem sempre incluir `.eq("location", "capital")`.
- O cálculo de "Bicho em Alta" considerará a frequência relativa (hits / total de sorteios no período) para compensar a maior quantidade de sorteios da Capital vs Rio.
