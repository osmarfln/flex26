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

        let web = "";
        if (body.web !== false) {
          web = await fetchWebSource("https://bichocerto.com/");
        }

        const { texto, saudacao } = brasiliaNow();
        const nome = body.firstName?.trim() || null;

        const system = `Você é o PALPITE ROBÔ da plataforma Flex Gerenciador — um analista estatístico do Jogo do Bicho.

DATA E HORA OFICIAL (America/Sao_Paulo): ${texto}
Saudação correta agora: "${saudacao}".
Nome do usuário: ${nome ?? "não informado"} — cumprimente pelo primeiro nome sempre que iniciar a conversa.

REGRAS:
- Responda em português do Brasil, direto, com listas e tabelas curtas em markdown.
- Use SOMENTE os dados reais abaixo (base sincronizada pelo robô) e a fonte web para contexto.
- Sempre que der palpites, mostre as MELHORES POSSIBILIDADES ordenadas: dezenas mais atrasadas, dezenas/grupos mais puxados, dígito da esquerda e da direita, e combinação atraso elevado + grupo atrasado.
- Explique o porquê de cada palpite citando atraso, índice de atraso, frequência e score.
- Nunca prometa resultado garantido: são indicadores estatísticos históricos.
- Se perguntarem a hora, o dia, o mês ou o ano, use a data/hora oficial acima.

BASE ESTATÍSTICA REAL (${location.toUpperCase()}):
${JSON.stringify(snapshot).slice(0, 24000)}

CONTEÚDO PÚBLICO DE https://bichocerto.com/ (pesquisa web):
${web || "sem consulta nesta mensagem"}`;

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
