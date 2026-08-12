# Plano de Inserção de Aviso Obrigatório

Este plano detalha a inclusão do aviso de isenção de responsabilidade e natureza informativa em todas as telas que apresentam estatísticas no projeto.

## Locais de Implementação

### 1. Página Inicial (`src/routes/index.tsx`)
- Adicionar o aviso obrigatório logo acima da seção de estatísticas ("Análise Premium de Atrasos").
- Estilizar como um alerta discreto porém legível, usando cores neutras da paleta modernizada.

### 2. Página de Estatísticas (`src/routes/estatisticas.tsx`)
- Inserir o aviso na parte superior da página, logo após o cabeçalho e antes das ferramentas de análise.
- Garantir que o texto esteja presente independentemente da aba selecionada.

### 3. Histórico de Resultados (`src/routes/historico.tsx`)
- Adicionar o aviso no rodapé da seção de resultados ou logo abaixo dos filtros de busca.

## Texto do Aviso
“Os indicadores apresentados são cálculos baseados em resultados históricos. Atraso, frequência, repetição e associação não garantem resultados futuros. Esta plataforma possui finalidade exclusivamente informativa e não realiza apostas, não tem patrocio de ninguem, bet, aposta , comercial de nada pagina livre de anuncios não tem relação com jogos nenhuma pagina sobre logisticas, estudos sem fins lucrativos.”

## Detalhes Técnicos
- Utilizar um componente compartilhado ou um bloco de código padrão com ícone de `Info` ou `AlertCircle`.
- Garantir responsividade e boa legibilidade em dispositivos móveis.
- Manter o alinhamento com o design "Premium Dark Dashboard" (fundo translúcido, bordas sutis).
