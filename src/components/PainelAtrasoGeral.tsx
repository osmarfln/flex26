import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Hash, LayoutGrid, Loader2, Timer } from "lucide-react";

import { IntelTabBar } from "@/components/IntelTabBar";
import { getGeneralDelayPanel, type DelayItem } from "@/lib/atrasos.functions";
import { locationName } from "@/lib/draw-order";

type Tab = "grupos" | "dezenas" | "centenas";

function fmt(dateISO: string | null) {
  if (!dateISO) return "--";
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}

function delayTone(days: number | null) {
  if (days === null) return "border-emerald-400/30 bg-emerald-400/5 text-emerald-200";
  if (days >= 15) return "border-red-500/40 bg-red-500/10 text-red-300";
  if (days >= 7) return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  if (days >= 3) return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  return "border-white/10 bg-white/5 text-white/70";
}

function Row({ item }: { item: DelayItem }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${delayTone(
        item.daysDelay,
      )}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-sm font-black tracking-wider">
          {item.value}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide">{item.label}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Último: {fmt(item.lastDate)} · {item.lastTimeLabel ?? "sem registro"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right">
        <div>
          <p className="text-sm font-black leading-none">
            {item.daysDelay === null ? "—" : `${item.daysDelay}d`}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">atraso</p>
        </div>
        <div>
          <p className="text-sm font-black leading-none">{item.drawsDelay}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">concursos</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Painel geral de atrasos (grupos, dezenas e centenas) da loteria selecionada.
 * Recalcula automaticamente a cada novo resultado sincronizado pelo robô:
 * se o atrasado sair, ele zera; caso contrário o atraso continua subindo.
 */
export function PainelAtrasoGeral({ location }: { location: "rio" | "capital" | "federal" }) {
  const [tab, setTab] = useState<Tab>("grupos");

  const { data, isLoading } = useQuery({
    queryKey: ["general-delay-panel", location],
    queryFn: () => getGeneralDelayPanel({ data: { location, draws: 800 } }),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const list: DelayItem[] =
    tab === "grupos" ? data?.groups ?? [] : tab === "dezenas" ? data?.tens ?? [] : data?.hundreds ?? [];

  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight md:text-2xl">
            <Timer className="h-5 w-5 text-white/60" />
            Atraso geral — {locationName(location)}
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Grupos, dezenas e centenas · atualiza sozinho a cada resultado
          </p>
        </div>
        {data?.lastDraw && (
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Último concurso</p>
            <p className="text-xs font-black uppercase">
              {fmt(data.lastDraw.date)} · {data.lastDraw.timeLabel}
            </p>
            <p className="font-mono text-[11px] text-white/60">{data.lastDraw.results.join(" · ")}</p>
          </div>
        )}
      </header>

      <IntelTabBar
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "grupos", label: "Grupos (25)" },
          { id: "dezenas", label: "Dezenas (00-99)" },
          { id: "centenas", label: "Centenas (top 60)" },
        ]}
      />

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-xs font-bold uppercase tracking-widest text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> calculando atrasos...
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-xs font-bold uppercase tracking-widest text-white/40">
            Sem concursos sincronizados para esta loteria.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {list.map((item) => (
              <Row key={`${tab}-${item.value}`} item={item} />
            ))}
          </div>
        )}
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
        <span className="flex items-center gap-1">
          <LayoutGrid className="h-3 w-3" /> base: {data?.totalDraws ?? 0} concursos
        </span>
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3" /> ordenado do maior atraso
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> atraso em dias e em concursos
        </span>
      </footer>
    </section>
  );
}
