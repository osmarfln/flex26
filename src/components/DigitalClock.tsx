import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserFirstName } from "@/hooks/useUserFirstName";

export function DigitalClock() {
  const firstName = useUserFirstName();
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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card backdrop-blur-2xl p-6 h-full flex flex-col justify-between shadow-xl shadow-black/30">
        {/* Futuristic gold glow ring */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary/70 font-black">
              {firstName ? `Bem-vindo, ${firstName}` : "Bem-vindo"}
            </p>

            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">
              Painel ao vivo
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="relative flex flex-col items-center justify-center flex-1 py-4">
          <div className="flex items-center justify-center font-mono tabular-nums text-4xl md:text-3xl xl:text-4xl font-black tracking-tight text-foreground">
            <span>{hh}</span>
            <span className="text-primary mx-1">:</span>
            <span>{mm}</span>
            <span className="text-primary mx-1">:</span>
            <span className="text-primary/80">{ss}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 font-bold">
              Horário Oficial
            </span>
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
