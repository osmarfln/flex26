import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, BellRing, ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DigitDelayData } from "@/components/DezenasEsquerdaDireita";

const STORAGE_KEY = "flex:alerta-dezenas-lider";

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

type SideKey = "left" | "right";

function useLeaderAlerts(leftDigit?: string, rightDigit?: string) {
  const fired = useRef(false);
  useEffect(() => {
    if (!leftDigit || !rightDigit || fired.current) return;
    fired.current = true;
    if (typeof window === "undefined") return;
    let prev: { left?: string; right?: string } = {};
    try {
      prev = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      prev = {};
    }
    if (prev.left && prev.left !== leftDigit) {
      toast.warning(`Nova dezena ESQUERDA mais atrasada: ${leftDigit}`, {
        description: `Assumiu a liderança no lugar do dígito ${prev.left}. Pode aparecer a qualquer horário.`,
      });
    }
    if (prev.right && prev.right !== rightDigit) {
      toast.warning(`Nova dezena DIREITA mais atrasada: ${rightDigit}`, {
        description: `Assumiu a liderança no lugar do dígito ${prev.right}. Pode aparecer a qualquer horário.`,
      });
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: leftDigit, right: rightDigit }));
  }, [leftDigit, rightDigit]);
}

export function AlertaDezenasAtrasadas({ data, loading }: { data?: DigitDelayData | null; loading?: boolean }) {
  const leaders = useMemo(() => {
    const left = data?.left?.[0];
    const right = data?.right?.[0];
    return { left, right };
  }, [data]);

  // Dígitos que não apareceram nos últimos 7 dias com sorteio
  const weekly = useMemo(() => {
    const days = (data?.daily ?? []).slice(0, 7);
    const seen: Record<SideKey, Set<string>> = { left: new Set(), right: new Set() };
    days.forEach((d) =>
      d.draws.forEach((dr) => {
        seen.left.add(dr.left);
        seen.right.add(dr.right);
      }),
    );
    const missing = (side: SideKey) =>
      Array.from({ length: 10 }, (_, i) => String(i)).filter((d) => !seen[side].has(d));
    return {
      days: days.length,
      start: days[days.length - 1]?.date ?? null,
      end: days[0]?.date ?? null,
      left: missing("left"),
      right: missing("right"),
    };
  }, [data]);

  useLeaderAlerts(leaders.left?.digit, leaders.right?.digit);

  if (loading) {
    return <div className="h-40 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />;
  }

  if (!data || data.totalDraws === 0) return null;

  const blocks: { side: SideKey; label: string; icon: typeof ArrowLeft; accent: string; stat: any; missing: string[] }[] = [
    { side: "left", label: "Dezena Esquerda", icon: ArrowLeft, accent: "#EAB308", stat: leaders.left, missing: weekly.left },
    { side: "right", label: "Dezena Direita", icon: ArrowRight, accent: "#38BDF8", stat: leaders.right, missing: weekly.right },
  ];

  return (
    <Card className="bg-gradient-to-br from-[#141A28] to-[#0D121F] border-yellow-400/25 rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-400/30 flex items-center justify-center">
          <BellRing className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-black italic uppercase">Alerta automático de atraso</h3>
          <p className="text-xs text-white/40 font-medium">
            Recalculado a cada resultado do dia — avisa quando muda a dezena esquerda/direita mais atrasada.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-white/10 bg-white/5 text-white/50">
          Base: {data.totalDraws} concursos
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map(({ side, label, icon: Icon, accent, stat, missing }) => (
          <div key={side} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" style={{ color: accent }} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</span>
            </div>

            {stat ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl font-black"
                    style={{ background: accent, color: "#0B0F19" }}
                  >
                    {stat.digit}
                  </div>
                  <div className="text-xs text-white/60 space-y-1">
                    <p className="text-sm font-bold text-white">{stat.currentDelay} sorteios sem sair</p>
                    <p>
                      Última vez:{" "}
                      {stat.last
                        ? `${fmt(stat.last.date)} · ${stat.last.time_type} · dezena ${stat.last.ten}`
                        : "fora da amostra"}
                    </p>
                    {stat.worstSchedule && (
                      <p className="text-yellow-300/80">
                        Horário mais atrasado: <b>{stat.worstSchedule.schedule}</b> ({stat.worstSchedule.delay} sorteios)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-white/50">
                  <CalendarClock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Sem aparecer na semana ({weekly.days} dias · {fmt(weekly.start)} a {fmt(weekly.end)}):{" "}
                    {missing.length > 0 ? (
                      <b className="text-red-300">{missing.join(" · ")}</b>
                    ) : (
                      <b className="text-emerald-300">todos os dígitos já saíram</b>
                    )}
                  </span>
                </div>

                {stat.relativeIndex >= 1.25 && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Índice {stat.relativeIndex} acima do atraso médio ({stat.avgDelay}) — pode sair a qualquer horário.
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-white/40">Sem dados suficientes.</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-white/30 leading-relaxed">
        Os indicadores são cálculos baseados em resultados históricos e não garantem resultados futuros.
      </p>
    </Card>
  );
}
