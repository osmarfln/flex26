---
title: Novo Layout de Gerenciamento de Jogos
description: Implementar um novo layout para a página de gerenciamento de jogos, integrada à API base44, com o nome "Flex Gerenciamentos" e focada no resultado "jogo do bicho rio".
---

# Plano: Novo Layout de Gerenciamento de Jogos

Vamos reformular a página de gerenciamento de jogos para refletir a marca "Flex Gerenciamentos" e focar nos resultados específicos solicitados ("jogo do bicho rio"), mantendo a integração com a API base44.

## 1. Atualização do Mock da API
- Adicionar dados específicos do "Jogo do Bicho Rio" ao mock `base44Client.ts` para incluir modalidades como PTM, PT, PTV, PTN e Corujinha.

## 2. Refatoração da Rota de Gerenciamento
- Atualizar a rota `src/routes/portal.jogos.tsx` para apresentar um layout focado em resultados de loterias (Jogo do Bicho Rio).
- Implementar visualização em grid/cards para os diferentes sorteios do dia.

## 3. UI/UX "Flex Gerenciamentos"
- Reforçar o branding "Flex Gerenciamentos" no cabeçalho e títulos.
- Adicionar funcionalidades de edição rápida de resultados (Milhar, Centena, Dezena, Grupo).

## Detalhes Técnicos
- **Framework**: React 19 + TanStack Start.
- **Estilização**: Tailwind CSS v4.
- **Componentes**: Shadcn UI.
- **Ícones**: Lucide React.
