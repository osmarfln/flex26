# Plano de Implementação de Logísticas Avançadas

Este plano detalha a implementação das métricas de logística solicitadas para dezenas e grupos, integrando cálculos estatísticos complexos ao backend e apresentando-os com o design "Premium Dark Dashboard".

## 1. Backend e Funções (`src/lib/lottery.functions.ts`)

### Atualização das Funções de Estatísticas
Refatorar `getTenDelayStats` e `getGroupDelayStats` para incluir:
- **Atraso Médio e Mediana:** Já implementados, mas serão validados.
- **Regularidade:** Desvio padrão dos intervalos de atraso (Índice de Volatilidade).
- **Frequências Temporais:** Adicionar cálculo para os últimos 10, 30, 50, 100 e 300 concursos.
- **Percentil do Atraso:** Ranking relativo da dezena/grupo em relação ao conjunto.
- **Comparação de Períodos:** Diferença percentual de frequência entre a amostra atual e a anterior de mesmo tamanho.
- **Índice de Atraso:** Implementar a fórmula `atraso atual ÷ atraso médio`.

## 2. Frontend e UI (`src/routes/estatisticas.tsx`)

### Atualização dos Cards de Dezena
- Exibir o **Índice de Atraso** de forma proeminente.
- Adicionar mini-gráficos ou badges para as frequências dos últimos N concursos.
- Mostrar a **Regularidade** (ex: "Alta", "Média", "Baixa" baseada no desvio padrão).
- Incluir o **Percentil** e a **Comparação de Período**.

### Atualização dos Cards de Grupo
- Aplicar as mesmas métricas avançadas (Índice de Atraso, Regularidade, Frequências Multi-Período).
- Garantir que a **Frequência por Posição** e **Horário** continue visível e integrada à nova lógica.

## 3. Lógica de Negócio Detalhada
- **Regularidade:** Calculada como `(Desvio Padrão dos Intervalos) / (Atraso Médio)`. Valores menores indicam maior previsibilidade.
- **Percentil:** Calculado como `(Posição no Ranking de Atraso) / 100` para dezenas e `/ 25` para grupos.
- **Comparação:** `((Frequência Atual / Frequência Anterior) - 1) * 100`.

## 4. Design
- Manter o padrão visual Gold/Navy.
- Usar cores semânticas (Verde, Azul, Amarelo, Vermelho) estritamente de acordo com a regra de status de sistema.
- Garantir responsividade total para tabelas e grids mobile.
