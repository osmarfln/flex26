import { useEffect, useRef, useState } from "react";
import { ChevronDown, Trophy, MapPin, Landmark, Check } from "lucide-react";

export type LotteryLocation = "rio" | "capital" | "federal";

const OPTIONS: { key: LotteryLocation; label: string; sub: string; icon: typeof Trophy }[] = [
  { key: "rio", label: "RIO DE JANEIRO", sub: "Análise Rio", icon: Trophy },
  { key: "capital", label: "CAPITAL & LCAP", sub: "Análise Capital", icon: MapPin },
  { key: "federal", label: "LOTERIA FEDERAL", sub: "Análise Federal", icon: Landmark },
];

/** Seletor retrátil de loteria — ocupa pouco espaço no celular. */
export function LotterySelector({
  value,
  onChange,
}: {
  value: LotteryLocation;
  onChange: (v: LotteryLocation) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = OPTIONS.find((o) => o.key === value) ?? OPTIONS[0]!;
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative w-full sm:max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
          open
            ? "border-red-500/50 bg-red-500/10"
            : "border-white/10 bg-white/5 hover:border-red-500/30"
        }`}
      >
        <span className="rounded-xl bg-red-500/15 border border-red-500/30 p-2">
          <Icon className="h-4 w-4 text-red-500" />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[9px] font-black uppercase tracking-widest text-white/40">
            Escolher loteria
          </span>
          <span className="block text-sm font-black uppercase tracking-tight text-white">
            {current.label}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0D121F] shadow-2xl shadow-black/60">
          {OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  active ? "bg-red-500/10" : "hover:bg-white/5"
                }`}
              >
                <OptIcon className={`h-4 w-4 ${active ? "text-red-500" : "text-white/40"}`} />
                <span className="flex-1">
                  <span
                    className={`block text-xs font-black uppercase tracking-wider ${
                      active ? "text-red-400" : "text-white"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-white/30">
                    {opt.sub}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 text-red-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
