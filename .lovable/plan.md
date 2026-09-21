# Ícones dos bichos e visual unificado

## Objetivo
- Exibir, ao lado de cada resultado do 1º ao 5º prêmio, um ícone pequeno do bicho correspondente ao grupo da dezena final.
- Aplicar isso aos resultados de Rio, Capital/LCAP e Federal, tanto na página principal quanto no Histórico.
- Levar o visual renovado da página principal para as demais páginas, preservando seus conteúdos e permissões atuais.

## Implementação
1. Criar uma apresentação reutilizável de prêmio com posição, número, ícone e nome acessível do bicho.
2. Substituir as linhas de resultados da página principal e do Histórico por essa apresentação; resultados ainda não publicados continuam como “Aguardando”.
3. Mover o fundo, tipografia arredondada, superfícies com relevo e acabamento visual para a camada compartilhada das páginas autenticadas.
4. Harmonizar os layouts especiais que usam estruturas próprias, sem alterar cálculos, filtros, sincronização ou regras das loterias.
5. Conferir Rio, Capital/LCAP e Federal em telas grande e pequena, além do estado de compilação.

## Detalhes técnicos
- O bicho será derivado dos dois últimos dígitos de cada prêmio usando a tabela oficial já existente de 25 grupos.
- A padronização será feita por classes e componentes compartilhados, evitando duplicação e mantendo as regras de acesso existentes.
