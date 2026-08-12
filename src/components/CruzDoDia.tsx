import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Sparkles, Hash, RefreshCw, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function CruzDoDia({ onCalculate }: { onCalculate?: (dezenas: string[]) => void }) {
  const [day, setDay] = useState<string>(new Date().getDate().toString());
  const [calculatedValues, setCalculatedValues] = useState<{
    day: number;
    dobro: number;
    triplo: number;
    quadruplo: number;
    dezenas: string[];
  } | null>(null);

  const calculateCruz = (val: string) => {
    const d = parseInt(val);
    if (isNaN(d) || d < 1 || d > 31) return;

    // Lógica da Cruz do Dia (exemplo baseado na imagem: Dia 12 -> Dobro 24, Triplo 36, Quad 48)
    const dobro = d * 2;
    const triplo = d * 3;
    const quadruplo = d * 4;
    
    // Dezenas são os resultados ou variações baseadas no cálculo
    const dezenas = [
      d.toString().padStart(2, '0'),
      dobro.toString().slice(-2).padStart(2, '0'),
      triplo.toString().slice(-2).padStart(2, '0'),
      quadruplo.toString().slice(-2).padStart(2, '0')
    ];

    setCalculatedValues({
      day: d,
      dobro,
      triplo,
      quadruplo,
      dezenas
    });
  };

  const useCurrentDay = () => {
    const current = new Date().getDate().toString();
    setDay(current);
    calculateCruz(current);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-emerald-500 mb-2">
          Cruz do Dia - Técnica Tradicional
        </h2>
        <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
          Cálculos matemáticos baseados no dia atual + Análise Superinteligente com IA
        </p>
        
        <div className="flex justify-center gap-4 mt-6">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500">Dia {new Date().getDate()}</span>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400">Base: 500 resultados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Calculator className="w-5 h-5 text-emerald-500" />
              </div>
              <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-emerald-500">
                Calculadora da Cruz
              </CardTitle>
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
              Insira o dia para calcular a cruz matemática
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Dia do Mês (1-31)</label>
              <Input 
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder={`Dia atual: ${new Date().getDate()}`}
                className="h-[54px] bg-white/5 border-white/10 rounded-xl font-bold text-lg focus:border-emerald-500/50 transition-all"
              />
            </div>
            
            <Button 
              onClick={() => calculateCruz(day)}
              className="w-full h-[54px] bg-emerald-500 hover:bg-emerald-400 text-[#0B0F19] font-black uppercase tracking-tighter rounded-xl gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5" /> Calcular Cruz do Dia
            </Button>

            <Button 
              variant="outline"
              onClick={useCurrentDay}
              className="w-full h-[54px] bg-white/5 border-white/10 hover:bg-white/10 font-black uppercase tracking-tighter rounded-xl gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Usar Dia Atual ({new Date().getDate()})
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0D121F] border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <CardHeader className="p-6 pb-2">
             <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-emerald-500">
                Cruz Calculada
              </CardTitle>
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              Dia: {calculatedValues?.day || '--'}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {!calculatedValues ? (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-white/10 rounded-2xl">
                <Calculator className="w-12 h-12 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Aguardando cálculo...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2">Dobro</p>
                    <span className="text-4xl font-black tracking-tighter text-emerald-500">{calculatedValues.dobro}</span>
                  </div>
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2">Triplo</p>
                    <span className="text-4xl font-black tracking-tighter text-emerald-500">{calculatedValues.triplo}</span>
                  </div>
                  <div className="col-span-2 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/60 mb-2">Quádruplo</p>
                    <span className="text-4xl font-black tracking-tighter text-blue-400">{calculatedValues.quadruplo}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Dezenas da Cruz</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {calculatedValues.dezenas.map((dz, i) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="h-14 bg-emerald-500 text-[#0B0F19] flex items-center justify-center rounded-xl text-xl font-black shadow-lg shadow-emerald-500/20"
                      >
                        {dz}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
