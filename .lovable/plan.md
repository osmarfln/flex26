---
name: Gerenciamento de Jogos via base44
description: Implementar a interface e integração para gerenciamento de jogos utilizando o cliente base44.
type: feature
---

## Objetivos
- Criar a funcionalidade de gerenciamento de jogos no portal.
- Integrar a interface com o cliente `base44` existente.
- Permitir visualização e gerenciamento básico de jogos (ex: listagem, status).

## Etapas
1. **Atualizar `src/api/base44Client.ts`**: Adicionar mocks ou definições para endpoints de jogos (listagem, atualização de status).
2. **Criar nova rota `src/routes/portal.jogos.tsx`**: Página dedicada para o gerenciamento de jogos dentro do layout do portal.
3. **Atualizar Navegação**: Incluir link para "Gerenciar Jogos" no menu lateral do `ManagementLayout`.
4. **Implementar UI de Jogos**: Utilizar componentes Shadcn (Table, Badge, Button) para exibir e interagir com os jogos.

## Detalhes Técnicos
- Utilizar `useSuspenseQuery` do TanStack Query para carregamento de dados dos jogos.
- Manter o estilo visual definido em `mem://design/management-ui.md`.
- Garantir que apenas usuários com nível adequado (ex: Diamante) possam realizar alterações.
