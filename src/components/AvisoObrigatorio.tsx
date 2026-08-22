import { Info } from "lucide-react";
import { motion } from "framer-motion";

export function AvisoObrigatorio() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">Aviso Obrigatório</h4>
          <p className="text-xs md:text-sm text-white/50 font-medium leading-relaxed">
            “Os indicadores apresentados são cálculos baseados em resultados históricos. Atraso, frequência, repetição e associação não garantem resultados futuros. Esta plataforma possui finalidade exclusivamente informativa e não realiza apostas. Resultados diários automatizados via robô automatizado sem intervenção humana.”
          </p>
        </div>
      </div>
    </motion.div>
  );
}
