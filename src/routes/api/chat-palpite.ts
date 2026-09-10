import { createFileRoute } from "@tanstack/react-router";
import { buildBotSnapshot, fetchWebSource, type BotLocation } from "@/lib/palpite-bot.server";

type Msg = { role: "user" | "assistant"; content: string };

function brasiliaNow() {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return { texto: fmt.format(new Date()), saudacao };
}

export const Route = createFileRoute("/api/chat-palpite")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("IA não configurada", { status: 500 });

        const body = (await request.json()) as {
          messages?: Msg[];
          location?: BotLocation;
          days?: number;
          faixa?: string;
          window?: number;
          firstName?: string | null;
          web?: boolean;
        };

        const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        const location: BotLocation = (["rio", "capital", "federal"] as const).includes(
          body.location as any,
        )
          ? (body.location as BotLocation)
          : "rio";

        let snapshot: unknown = null;
        try {
          snapshot = await buildBotSnapshot({
            location,
            days: body.days ?? 0,
            faixa: body.faixa ?? "all",
            window: body.window ?? 0,
          });
        } catch (e: any) {
          snapshot = { erro: e?.message ?? "falha ao ler a base" };
        }

        // Por padrão o robô responde apenas com a base interna (mais precisa e instantânea).
        let web = "";
        if (body.web === true) {
          web = await fetchWebSource("https://bichocerto.com/");
        }

        const { texto, saudacao } = brasiliaNow();
        const nome = body.firstName?.trim() || null;

        const system = `Você é o PALPITE ROBÔ da plataforma Flex Gerenciador — um analista estatístico do Jogo do Bicho.

DATA E HORA OFICIAL (America/Sao_Paulo): ${texto}
Saudação correta agora: "${saudacao}".
Nome do usuário: ${nome ?? "não informado"} — cumprimente pelo primeiro nome sempre que iniciar a conversa.

COMO RESPONDER:
- Português do Brasil, conversa livre e natural (pode responder qualquer assunto), mas com foco em estatística de números e resultados.
- Toda resposta sobre atrasos, puxadas, grupos, dezenas ou posições vem DIRETO da BASE INTERNA abaixo, sem depender de pesquisa externa. Não invente número que não esteja na base.
- Responda objetivo: primeiro a resposta direta, depois listas ou tabelas curtas em markdown.
- NUNCA use a palavra "score" nem mostre pontuação de relevância. Fale em atraso, índice de atraso, frequência observada x esperada e probabilidade em %.
- Grupos atrasados: sempre mostre a PROBABILIDADE em % (campo probabilidadeProximoConcursoPct = chance histórica de o grupo aparecer em pelo menos um dos 5 prêmios) ao lado do atraso e do índice de atraso.
- Dezenas: mostre em quais POSIÇÕES (1º ao 5º prêmio) a dezena já saiu (campos posicoesJaSaiu, ultimaPosicao, ultimaData) e o que já saiu no dia/último concurso.
- Dígitos: separe sempre o dígito da ESQUERDA e o da DIREITA (campo digitos), com participação em % e menor atraso.
- Quando pedirem palpites, ordene por: grupos mais atrasados (com %), dezenas mais atrasadas, dezenas/grupos mais puxados, dígitos esquerda/direita e a combinação atraso elevado + grupo atrasado. Justifique cada item com os números reais.
- Nunca prometa resultado garantido: são indicadores estatísticos históricos.
- Se perguntarem a hora, o dia, o mês ou o ano, use a data/hora oficial acima.

BASE ESTATÍSTICA REAL E COMPLETA (${location.toUpperCase()}) — fonte soresultados.info via robô:
${JSON.stringify(snapshot).slice(0, 40000)}

CONTEÚDO WEB (opcional, só use se existir):
${web || "não utilizado — a resposta usa apenas a base interna da plataforma"}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            stream: true,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          const status = upstream.status || 500;
          const msg =
            status === 429
              ? "Muitas solicitações. Aguarde alguns segundos e tente de novo."
              : status === 402
                ? "Créditos de IA esgotados nesta área de trabalho."
                : `Falha na IA (${status}). ${detail.slice(0, 200)}`;
          return new Response(msg, { status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
