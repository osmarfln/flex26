import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DigitalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stable placeholder before hydration to avoid mismatch.
  // Sempre 24h no fuso oficial de Brasília (00:00 -> 23:59).
  const time = now
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        hourCycle: "h23",
      }).format(now)
    : "--:--:--";
  const dateLine = now
    ? format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Carregando...";

  const [hh, mm, ss] = time.split(":");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative h-full"
    >
      <div className="home-glass relative overflow-hidden rounded-2xl p-5 h-full min-h-[220px] flex flex-col justify-between">

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/15 border border-primary/20 rounded-xl shadow-inner">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary/70 font-black">
              Bem-vindo
            </p>

            <p className="text-xs text-white/50 font-bold uppercase">
              Painel ao vivo
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="relative flex flex-col items-center justify-center flex-1 py-4">
          <div className="font-display flex items-center justify-center tabular-nums text-3xl font-extrabold text-white">
            <span>{hh}</span>
            <span className="text-primary mx-1">:</span>
            <span>{mm}</span>
            <span className="text-primary mx-1">:</span>
            <span>{ss}</span>
          </div>
        </div>

        {/* Date */}
        <div className="relative mt-6 pt-4 border-t border-white/5">
          <p className="text-center text-sm font-bold capitalize text-white/60 leading-tight">
            {dateLine}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
