# Incluir a LOTERIA FEDERAL em toda a plataforma

Hoje a inteligência, os alertas e os textos da plataforma falam apenas de Rio e Capital. A Federal já tem resultados e painéis próprios, mas fica de fora do monitoramento e dos avisos. Este plano coloca as três loterias no mesmo nível.

## 1. Alertas Estratégicos e Alerta automático de atraso

- O cartão de alerta passa a funcionar também para a Loteria Federal, usando os concursos federais (quarta 20:30 e domingo 11:00).
- Texto atualizado: "Dezena = 2 casas (ex.: 05, 25). Recalculado a cada resultado — avisa quando muda a dezena esquerda/direita mais atrasada. Monitoramento Rio, Capital & LCAP e Loteria Federal com base em atrasos diários e arquivos históricos."
- O aviso de mudança de liderança passa a ser guardado por loteria, para que um alerta do Rio não sobrescreva o da Capital ou da Federal.
- Quando a loteria escolhida for a Federal, o alerta indica o próximo concurso federal em vez de "horários de hoje".

## 2. Cálculos estatísticos com grade federal

Vários cálculos (dezenas esquerda/direita, grupos atrasados, puxadas, atraso por horário) hoje só conhecem a grade do Rio e da Capital; quando a Federal é escolhida eles usam a grade errada e devolvem números vazios ou distorcidos. Passam a reconhecer a grade federal, corrigindo:

- Dezenas mais atrasadas (esquerda e direita)
- Grupos atrasados e frequência por horário
- Tabela de puxadas
- Atraso por horário

## 3. Textos da plataforma

Padronizar em todas as páginas e no aviso obrigatório:

- "Resultados diários automatizados Rio, Capital & LCAP e Loteria Federal via robô automatizado sem intervenção humana."
- "A plataforma só recebe resultados RIO, CAPITAL & LCAP e FEDERAL."

Locais: página inicial, histórico, estatísticas, status do robô, Cruz do Dia e o aviso obrigatório.

## 4. Verificação

Conferir que a página inicial e a de estatísticas, com a Federal selecionada, mostram alerta, atrasos e painéis preenchidos, e que Rio e Capital continuam iguais.

## Detalhes técnicos

- `src/components/AlertaDezenasAtrasadas.tsx`: aceita prop `location`, chave de localStorage por loteria, textos ajustados.
- `src/lib/lottery.functions.ts`: substituir os blocos `data.location === 'capital' ? [...] : [...]` por um helper único baseado em `TIME_ORDER_FEDERAL`/`DRAW_SCHEDULE_*` de `src/lib/draw-order.ts` (5 ocorrências).
- `src/routes/_authenticated/index.tsx` e `estatisticas.tsx`: passar `location` ao alerta.
- Textos: `AvisoObrigatorio.tsx`, `CruzDoDia.tsx`, `index.tsx`, `historico.tsx`, `estatisticas.tsx`, `robot-status.tsx`.
