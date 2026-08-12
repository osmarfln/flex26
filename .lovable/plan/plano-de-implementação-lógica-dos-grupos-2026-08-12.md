# Plano de Implementação - Lógica dos Grupos

Adicionar um novo módulo de análise avançada focado nos 25 grupos do Jogo do Bicho, aplicando métricas estatísticas detalhadas similares às já existentes para as dezenas.

## Alterações Propostas

### Backend (`src/lib/lottery.functions.ts`)
- Criar a função de servidor `getGroupDelayStats`.
- Analisar os últimos 500 sorteios para calcular:
    - **Última ocorrência** (data).
    - **Atraso atual** (em concursos).
    - **Atraso médio**, **Mediana**, **Maior** e **Menor atraso**.
    - **Frequência total** e **Percentil**.
    - **Índice relativo** (Atraso Atual / Atraso Médio).
    - **Frequência por horário** (PPT, PTM, PT, etc.).
    - **Frequência por posição** (1º ao 5º prêmio).
- Retornar a classificação baseada no índice relativo (Baixo, Normal, Elevado, Crítico).

### Frontend (`src/routes/estatisticas.tsx`)
- Atualizar o estado `activeTab` para incluir a nova aba `'logica-grupos'`.
- Adicionar um novo card de ferramenta no grid superior para "Lógica dos Grupos".
- Implementar a renderização da aba com:
    - **Grid de Cards Interativos**: Um card para cada um dos 25 grupos.
    - **Indicadores Visuais**: Cores baseadas no nível de atraso (Verde, Azul, Amarelo, Vermelho).
    - **Detalhes Estatísticos**: Exibir todas as métricas calculadas no clique ou hover.
    - **Gráficos de Distribuição**: Visualização da frequência por horário e prêmio dentro de cada grupo.

## Detalhes Técnicos
- Utilizar `useQuery` para buscar os dados de `getGroupDelayStats`.
- Garantir que a análise considere todos os prêmios (1º ao 5º) para uma visão completa da logística de cada bicho.
- Manter o design system "Editorial Quente" com Framer Motion para transições suaves.
