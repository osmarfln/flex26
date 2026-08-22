# Plano de Correção dos Gráficos na Página de Estatísticas

Os gráficos "Distribuição por Grupo" (Dezenas Quentes) e "Tendência de Atraso Médio" (Ranking Geral) estão aparecendo como espaços pretos. Isso geralmente ocorre devido a problemas de dimensionamento no `ResponsiveContainer` da biblioteca `recharts` ou falta de dados processados no momento da renderização inicial.

## Ações Técnicas

### 1. Ajuste de Dimensionamento e Estabilidade
- Adicionar `min-h-[300px]` e `min-w-0` aos containers dos gráficos para garantir que o layout flexível não colapse o SVG.
- Utilizar `minWidth` e `minHeight` no `ResponsiveContainer`.
- Adicionar verificação explícita de `data.length > 0` antes de renderizar os componentes de gráfico para evitar erros de escala 0 no Recharts.

### 2. Correção de Dados (Ranking Geral)
- A "Tendência de Atraso Médio" está usando uma IIFE para gerar dados. Vou simplificar essa lógica e garantir que ela retorne um array válido mesmo se `groupDelayStats` for nulo ou vazio durante o carregamento inicial.

### 3. Melhoria na Distribuição por Grupo (Pie Chart)
- Adicionar legendas ao Pie Chart para evitar que o gráfico pareça "vazio" ou apenas um círculo colorido sem contexto.
- Ajustar o `ResponsiveContainer` para lidar melhor com o cálculo dinâmico de raio.

### 4. Validação Visual
- Após as alterações, executarei um script Playwright para capturar novos screenshots e confirmar que as linhas e fatias dos gráficos estão visíveis.

## Arquivos a serem alterados
- `src/routes/_authenticated/estatisticas.tsx`
