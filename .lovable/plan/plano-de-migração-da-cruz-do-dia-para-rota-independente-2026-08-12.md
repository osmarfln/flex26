# Plano de Migração da Cruz do Dia para Rota Independente

Este plano visa remover a seção "Cruz do Dia" da página inicial e movê-la para uma nova página exclusiva (/cruz-do-dia), conforme solicitado pelo usuário.

## Alterações Propostas

### Frontend

- **Nova Rota**: Criar o arquivo `src/routes/cruz-do-dia.tsx` para hospedar o componente `CruzDoDia`.
- **Navegação**: 
    - Atualizar o menu de navegação em `src/routes/index.tsx` para que o link "Cruz do Dia" aponte para a nova rota `/cruz-do-dia` em vez de uma âncora interna (#cruz-do-dia).
    - Garantir que a nova página tenha um botão "Voltar" para a homepage, mantendo a consistência com outras páginas como Histórico e Robô.
- **Limpeza**: Remover a renderização da seção `CruzDoDia` e o seu ID `cruz-do-dia` do arquivo `src/routes/index.tsx`.

## Detalhes Técnicos

- Utilizar `createFileRoute('/cruz-do-dia')` para definir a nova rota.
- Importar o componente `CruzDoDia` de `src/components/CruzDoDia.tsx`.
- Reutilizar o layout de cabeçalho e contêiner das páginas `historico.tsx` ou `robot-status.tsx` para manter a identidade visual.

---
**Nota**: O componente `CruzDoDia` já existe em `src/components/CruzDoDia.tsx`, então a migração será focada na estrutura de rotas e navegação.
