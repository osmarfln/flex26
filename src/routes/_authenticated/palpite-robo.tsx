import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, History, Loader2, MessageSquare, Save, Send, Sparkles, User } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { LotterySelector, type LotteryLocation } from "@/components/LotterySelector";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { PalpitesAnteriores } from "@/components/PalpitesAnteriores";
import { Button } from "@/components/ui/button";
import { useUserFirstName } from "@/hooks/useUserFirstName";
import { savePalpite } from "@/lib/palpites.functions";
import { drawLabel, getNextDraw } from "@/lib/draw-order";

export const Route = createFileRoute("/_authenticated/palpite-robo")({
  head: () => ({
    title: "Palpite Robô — Flex Gerenciador",
    meta: [
      {
        name: "description",
        content:
          "Chat inteligente que analisa dezenas e grupos atrasados e puxados do Rio, Capital & LCAP e Federal.",
      },
      { property: "og:title", content: "Palpite Robô — Flex Gerenciador" },
      {
        property: "og:description",
        content: "Assistente estatístico do Jogo do Bicho com dados reais sincronizados pelo robô.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PalpiteRobo,
});

type Msg = { role: "user" | "assistant"; content: string };

const PERIODOS = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Todo histórico", days: 0 },
];

const SUGESTOES = [
  "Quais grupos estão mais atrasados e qual a probabilidade de cada um?",
  "Mostre as dezenas mais atrasadas e em quais posições elas já saíram",
  "Analise o dígito da esquerda e o da direita",
  "O que já saiu hoje e o que ainda está atrasado?",
];

/** Extrai as dezenas (00-99) citadas em uma resposta do robô. */
function extractTens(text: string): string[] {
  const found = text.match(/\b\d{2}\b/g) ?? [];
  return [...new Set(found)].slice(0, 20);
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Bubble({ m, onSave, saved }: { m: Msg; onSave?: () => void; saved?: boolean }) {
  const mine = m.role === "user";
  const canSave = !mine && !!onSave && extractTens(m.content).length > 0;
  return (
    <div className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <span className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 sm:flex">
          <Bot className="h-4 w-4 text-red-500" />
        </span>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
          mine
            ? "border-red-500/30 bg-red-500/10 text-white"
            : "border-white/10 bg-white/[0.04] text-white/90"
        }`}
      >
        {m.content || "…"}
        {canSave && (
          <button
            type="button"
            onClick={onSave}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:border-red-500/40 hover:text-white"
          >
            {saved ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
            {saved ? "palpite salvo" : "salvar palpite"}
          </button>
        )}
      </div>
      {mine && (
        <span className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:flex">
          <User className="h-4 w-4 text-white/60" />
        </span>
      )}
    </div>
  );
}

function PalpiteRobo() {
  const firstName = useUserFirstName();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"chat" | "historico">("chat");
  const [location, setLocation] = useState<LotteryLocation>("rio");
  const [days, setDays] = useState(30);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIdx, setSavedIdx] = useState<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const nextDraw = useMemo(() => getNextDraw(location as any), [location]);

  useEffect(() => {
    if (tab === "chat") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, tab]);

  useEffect(() => {
    if (tab === "chat") inputRef.current?.focus();
  }, [loading, tab]);

  const save = useMutation({
    mutationFn: (vars: { tens: string[]; note: string }) =>
      savePalpite({
        data: {
          location: location as any,
          targetDate: isoOf(nextDraw.date),
          targetTimeType: nextDraw.timeType,
          targetLabel: drawLabel(location as any, nextDraw.timeType, isoOf(nextDraw.date)),
          tens: vars.tens,
          note: vars.note.slice(0, 3500),
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bot-palpites"] }),
    onError: (e: any) => setError(e?.message ?? "Não foi possível salvar o palpite."),
  });

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-palpite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, location, days, firstName, web: false }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "Falha na conexão com o robô.");
        setMessages(next);
        setError(msg || "Falha na conexão com o robô.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              acc += delta;
              setMessages([...next, { role: "assistant", content: acc }]);
            }
          } catch {
            /* fragmento incompleto */
          }
        }
      }

      if (!acc) setMessages([...next, { role: "assistant", content: "Não consegui gerar a análise agora. Tente novamente." }]);
    } catch (e: any) {
      setMessages(next);
      setError(e?.message ?? "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader subtitle="PALPITE ROBÔ" />

      <main className="container mx-auto flex max-w-4xl flex-col px-3 py-4 md:px-4 md:py-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-2xl border border-red-500/30 bg-red-500/10 p-2.5">
            <Sparkles className="h-5 w-5 text-red-500" />
          </span>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight md:text-3xl">Palpite Robô</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              Chat estatístico com toda a base do robô
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          {[
            { id: "chat" as const, label: "Chat do robô", icon: MessageSquare },
            { id: "historico" as const, label: "Palpites anteriores", icon: History },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                  active
                    ? "border-red-500/50 bg-red-500/15 text-red-400"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-red-500/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "historico" ? (
          <PalpitesAnteriores />
        ) : (
          <>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <LotterySelector value={location} onChange={setLocation} />
              <div className="flex flex-wrap items-center gap-2">
                {PERIODOS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDays(p.days)}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                      days === p.days
                        ? "border-red-500/50 bg-red-500/15 text-red-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-red-500/30"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <AvisoObrigatorio />

            <div className="mt-4 flex min-h-[52vh] flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-3 md:p-5">
              {messages.length === 0 && (
                <div className="m-auto max-w-md text-center">
                  <Bot className="mx-auto mb-3 h-10 w-10 text-red-500" />
                  <p className="text-sm font-bold text-white/70">
                    {firstName ? `Olá, ${firstName}!` : "Olá!"} Escolha a loteria e o período e pergunte o
                    que quiser sobre dezenas, grupos, atrasos, posições e puxadas.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {SUGESTOES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:border-red-500/40 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  m={m}
                  saved={savedIdx.includes(i)}
                  onSave={
                    m.role === "assistant" && m.content
                      ? () => {
                          const tens = extractTens(m.content);
                          if (!tens.length) return;
                          save.mutate({ tens, note: m.content });
                          setSavedIdx((prev) => [...prev, i]);
                        }
                      : undefined
                  }
                />
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" /> analisando a base...
                </div>
              )}
              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">
                  {error}
                </p>
              )}
              <div ref={endRef} />
            </div>

            <form
              className="mt-3 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={2}
                placeholder="Pergunte ao robô..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500/40"
              />
              <Button type="submit" disabled={loading || !input.trim()} className="h-[52px] rounded-2xl px-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
