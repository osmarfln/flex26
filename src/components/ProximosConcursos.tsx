import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { drawLabel, getNextDraw, locationName } from "@/lib/draw-order";

const LOCATIONS = ["rio", "capital", "federal"] as const;

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/** Próximo concurso confirmado de cada loteria, pela grade oficial de calendário. */
export function ProximosConcursos() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const items = LOCATIONS.map((loc) => {
    const next = getNextDraw(loc);
    const iso = isoOf(next.date);
    return {
      loc,
      nome: locationName(loc),
      label: drawLabel(loc, next.timeType, iso),
      hora: next.timeValue,
      dia: iso.split("-").reverse().join("/"),
      semana: WEEKDAYS[next.date.getDay()] ?? "",
    };
  });

  return (
    <div key={tick} className="home-glass mb-5 rounded-2xl p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-zinc-400" />
        <h3 className="font-display text-xs font-bold uppercase text-zinc-300">Próximos concursos confirmados</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.loc} className="rounded-xl border border-white/10 bg-white/[0.05] p-3 shadow-inner transition-colors hover:bg-white/[0.08]">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{it.nome}</p>
            <p className="font-display mt-1 text-base font-bold text-zinc-200">{it.label}</p>
            <p className="font-display tabular-nums text-sm font-bold text-white/80">
              {it.dia} · {it.hora}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{it.semana}</p>
            <p className="mt-2 border-t border-white/5 pt-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
              Fonte: soresultados.info · robô automatizado
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
