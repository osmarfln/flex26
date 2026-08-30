import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, TrendingUp, Sparkles, Loader2, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

interface ScheduleStats {
  schedule: string;
  label: string;
  totalAnalyzed: number;
  mostDelayed: Array<{
    ten: string;
    animal: string;
    icon: string;
    currentDelay: number;
    hits: number;
    avgDelay: number;
    probability: number;
  }>;
  topProbability: {
    ten: string;
    animal: string;
    icon: string;
    currentDelay: number;
    hits: number;
    avgDelay: number;
    probability: number;
  } | null;
}

interface TenDelayByScheduleProps {
  data: ScheduleStats[] | undefined;
  loading: boolean;
  location: 'rio' | 'capital' | 'federal';
}

export const TenDelayBySchedule = ({ data, loading, location }: TenDelayByScheduleProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <BrainCircuit className="w-16 h-16 text-white/10 mx-auto mb-4" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Nenhum dado de logística disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BrainCircuit className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-black italic uppercase">Logística de Probabilidade</h2>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
            Dezenas com maior probabilidade por horário (baseado em ciclos de atraso)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((item, idx) => (
          <motion.div
            key={item.schedule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="dashboard-card p-6 bg-white/[0.03] border-white/10 hover:border-primary/30 transition-all group h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white group-hover:text-primary transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    Amostra: {item.totalAnalyzed} sorteios
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
              </div>

              {item.topProbability && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1.5 bg-primary text-primary-foreground text-[8px] font-black px-2 uppercase rounded-bl-lg">
                    Alta Probabilidade
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                        {item.topProbability.ten}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl">{item.topProbability.icon}</span>
                        <span className="text-[10px] font-black uppercase text-white/60">{item.topProbability.animal}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-white/20 uppercase">Atraso Atual</p>
                      <p className="text-xl font-black text-white">{item.topProbability.currentDelay} <span className="text-[8px] text-white/40">horários</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                      <span>Índice de Atraso Crítico</span>
                      <span className="text-primary">{item.topProbability.probability}%</span>
                    </div>
                    <Progress value={item.topProbability.probability} className="h-1 bg-white/5" />
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-auto">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Top 5 Dezenas Atrasadas</p>
                <div className="space-y-2">
                  {item.mostDelayed.slice(1).map((d) => (
                    <div key={d.ten} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white/80">{d.ten}</span>
                        <span className="text-xs">{d.icon}</span>
                        <span className="text-[9px] font-bold text-white/40 uppercase">{d.animal}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-white/60">{d.currentDelay}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
        <TrendingUp className="w-6 h-6 text-blue-400 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Metodologia Logística</p>
          <p className="text-xs text-white/40 leading-relaxed">
            O cálculo de probabilidade por horário cruza o <strong>atraso atual</strong> da dezena naquele horário específico com sua <strong>média histórica de aparição</strong> no mesmo horário. Uma probabilidade de 90%+ indica que a dezena está significativamente além do seu ciclo de retorno habitual para este horário.
          </p>
        </div>
      </div>
    </div>
  );
};
