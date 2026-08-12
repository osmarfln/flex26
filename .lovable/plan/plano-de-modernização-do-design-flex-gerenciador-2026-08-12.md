# Plano de Modernização do Design — Flex Gerenciador

Este plano detalha as alterações visuais para tornar a plataforma mais moderna, seguindo a estética "Premium Dark Dashboard" com detalhes em dourado e marinho.

## Alterações Visuais e de Interface

### 1. Sistema de Cores e Temas
- Refinar a paleta OKLCH no `src/styles.css`:
  - **Fundo:** Grafite ultra-escuro misturado com azul-marinho profundo.
  - **Cartões:** Superfícies translúcidas (glassmorphism) com bordas sutis.
  - **Destaques:** Dourado refinado (não amarelo vibrante) para elementos de marca e status.
  - **Status:** Verde (confirmação), Amarelo (atenção), Vermelho (erro/divergência - NUNCA para atrasos).

### 2. Tipografia e Legibilidade
- Ajustar pesos de fonte para melhor hierarquia.
- Garantir contraste adequado em todos os estados.

### 3. Componentes e Layout
- **Homepage (`src/routes/index.tsx`):**
  - Modernizar a seção de boas-vindas com o ícone da borboleta dourada.
  - Refinar o grid de resultados com cantos arredondados (`rounded-2xl` ou `3xl`).
  - Aplicar estados de carregamento (Skeletons) mais fluidos.
  - Garantir que as tabelas de ranking sejam totalmente responsivas, usando scroll horizontal ou layouts empilhados no celular.
- **Navegação:**
  - Melhorar o header com blur e transparência.
  - Refinar os botões com micro-interações (escala, brilho).

### 4. Gráficos e Tabelas
- Atualizar componentes de estatísticas para usar gradientes dourados sutis em vez de cores sólidas.
- Remover o uso de vermelho para dezenas "próximas de sair", substituindo por tons neutros ou dourados de destaque.

## Detalhes Técnicos
- Uso extensivo de Tailwind CSS v4 e variáveis de tema.
- Animações com `framer-motion` para transições suaves entre abas e carregamentos.
- Ajuste das políticas de cores nos componentes de lógica de atraso.

---

*Nota: Não haverá alteração nos textos ou títulos existentes, apenas no estilo visual.*
