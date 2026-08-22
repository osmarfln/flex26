# Plano de Melhoria de Inteligência Logística e Estatística

Melhorar a precisão e profundidade das análises para as loterias RIO e CAPITAL, removendo qualquer resquício de dados estáticos e implementando ferramentas matemáticas avançadas baseadas em 100% de dados reais.

## Alterações Visuais e de Texto

- **Correção Verbatim**: Alterar o texto inicial de "Leia o arquivo instrucoes.md..." para o mesmo texto solicitado, conforme as regras de visual text edit.
- **Identificação de Localidade**: Reforçar nos títulos e labels a distinção clara entre RIO e CAPITAL em todas as ferramentas.
- **Status em Tempo Real**: Garantir que todos os indicadores mostrem "SINCRONIZADO" e a data/hora exata do último processamento.

## Melhorias de Logística e Matemática

### 1. Refinamento de Puxadas (Inteligência Preditiva)
- **Logística**: Evoluir a `PuxadasPanel` para considerar não apenas a "puxada tradicional", mas a "puxada estatística real" baseada nos últimos 1000 resultados.
- **Implementação**: No servidor, calcular a probabilidade condicional: P(Animal B sai | Animal A saiu no horário anterior).

### 2. Dezenas Esquerda x Direita (Cruzamento de Dados)
- **Matemática**: Adicionar um índice de correlação entre as dezenas que mais saem na esquerda e as que mais saem na direita no mesmo dia.
- **Visual**: Gráficos de dispersão ou calor para identificar "pares frequentes".

### 3. Estatísticas por Horário (Grades Específicas)
- **Rio**: PPT, PTM, PT, PTV, PTN, COR.
- **Capital**: L-09 até L-22.
- **Inteligência**: Calcular o "Atraso por Horário" de forma isolada para cada localidade, permitindo identificar que uma dezena pode estar atrasada na PTM mas frequente na PTN.

### 4. Integração com a Cruz do Dia
- **Lógica**: Combinar a "Cruz do Dia" (matemática baseada na data) com as dezenas mais atrasadas para gerar "Palpites Inteligentes" com score de confiança.

## Detalhes Técnicos

- **Arquivos**:
  - `src/lib/lottery.functions.ts`: Upgrade nas funções de agregação SQL para maior performance e precisão.
  - `src/routes/_authenticated/estatisticas.tsx`: Novos sub-modulos de visualização para os novos cálculos.
  - `src/routes/api/public/sync-results.ts`: Verificação de integridade rigorosa para evitar mistura de dados.
- **Base de Dados**: Utilizar exclusivamente a tabela `lottery_results` alimentada pelo robô do `soresultados.info`.
- **Performance**: Implementar cache de 5 minutos para cálculos pesados no servidor, invalidado automaticamente por novos resultados via real-time.

A plataforma Flex Gerenciador passará a ter uma camada de inteligência logística que analisa padrões comportamentais das extrações, não apenas contagem simples.
