# Plano de Implementação: Gráficos e Métricas Visuais na Página de Estatísticas

Implementação de visualizações de dados avançadas (gráficos de pizza, barras e áreas) na página de estatísticas para facilitar a identificação de tendências e padrões nos resultados das loterias Rio e Capital.

## Mudanças Propostas

### Frontend e Componentes

- **Refatoração da Seção "Dezenas Quentes"**:
    - Adição de um gráfico de barras comparativo mostrando a frequência das 10 dezenas mais sorteadas.
    - Implementação de um gráfico de pizza para visualização da distribuição de dezenas por grupo (animais).

- **Refatoração da Seção "Grupos em Atraso"**:
    - Adição de um gráfico de barras horizontais mostrando os 10 grupos com maior atraso em número de concursos.
    - Implementação de um gráfico de radar (ou barras) para mostrar a frequência histórica desses grupos atrasados.

- **Refatoração da Seção "Ranking Geral"**:
    - Adição de um gráfico de área mostrando a evolução da média de atrasos ao longo do tempo (baseado nos dados históricos).

- **Aprimoramento de `AnaliseFiltros`**:
    - Melhorar a visualização dos gráficos existentes na busca, tornando-os mais proeminentes e informativos.

- **Novos Componentes Visuais**:
    - `StatsChartsView`: Um novo sub-componente ou seção dentro de `estatisticas.tsx` que agrupa os principais insights visuais.

## Detalhes Técnicos

- Utilização da biblioteca `recharts` (já integrada no projeto) para todos os gráficos.
- Garantir que todos os gráficos sejam responsivos e mantenham o design system "Premium Dark" (cores OKLCH, terracotta/gold).
- Otimização das queries do TanStack Query para garantir que os dados necessários para os gráficos sejam carregados eficientemente.
- Implementação de animações suaves na entrada dos gráficos usando `framer-motion`.

## User Facing Impact

- Os usuários poderão visualizar instantaneamente quais são as dezenas e grupos mais críticos através de cores e formas, em vez de apenas ler números em tabelas.
- A experiência mobile será otimizada para exibir gráficos compactos e legíveis.
