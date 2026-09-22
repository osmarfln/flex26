import { useQuery } from "@tanstack/react-query";
import { getStrategicActions } from "@/lib/games-stats.functions";
import { Loader2, Target, Zap, Flame, Sparkles } from "lucide-react";

const ICONS = [Zap, Target, Flame, Sparkles];

export function AcoesEstrategicasPanel({ location }: { location: "rio" | "capital" | "federal" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["strategic-actions", location],
    queryFn: () => getStrategicActions({ data: { location } }),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="dashboard-card p-10 flex items-center justify-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" /> Atualizando com os resultados reais...
      </div>
    );
  }
  if (!data || data.totalDraws === 0) {
    return <div className="dashboard-card p-8 text-white/60">Sem resultados sincronizados para esta loteria.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black italic uppercase text-zinc-300">Ações Estratégicas</h2>
        <span className="text-xs text-white/50">
          {data.totalDraws} extrações · último: {data.lastDate ?? "-"} {data.lastTime ?? ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.suggestions.map((s, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <div key={s.title} className="dashboard-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-black italic uppercase">{s.title}</h3>
              </div>
              <p className="text-sm text-white/70 leading-snug">{s.detail}</p>
              <p className="mt-3 text-sm rounded-lg bg-white/5 px-3 py-2 text-emerald-300 break-words">{s.play}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-card p-5 space-y-2">
          <h3 className="text-sm uppercase font-bold text-white/60">Grupos mais atrasados (1º prêmio)</h3>
          {data.topDelayedGroups.map((g) => (
            <div key={g.group} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>
                {g.icon} <b>{g.group}</b> <span className="text-white/60">{g.animal}</span>
              </span>
              <span className="text-blue-300">{g.delay} concursos</span>
            </div>
          ))}
        </div>

        <div className="dashboard-card p-5 space-y-2">
          <h3 className="text-sm uppercase font-bold text-white/60">Dezenas mais atrasadas</h3>
          {data.topDelayedTens.map((t) => (
            <div key={t.ten} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>
                <b className="tabular-nums">{t.ten}</b> <span className="text-white/60">{t.animal}</span>
              </span>
              <span className="text-blue-300">{t.delay}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-card p-5 space-y-2">
          <h3 className="text-sm uppercase font-bold text-white/60">Bichos em alta (últimos 20 concursos)</h3>
          {data.hotGroups.map((g) => (
            <div key={g.group} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>
                {g.icon} <b>{g.group}</b> <span className="text-white/60">{g.animal}</span>
              </span>
              <span className="text-emerald-300">{g.count}x no 1º</span>
            </div>
          ))}
          <div className="pt-2 flex flex-wrap gap-2">
            {data.hotTens.map((t) => (
              <span key={t.ten} className="rounded-md bg-emerald-500/10 text-emerald-300 px-2 py-1 text-xs tabular-nums">
                {t.ten} · {t.count}x
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
