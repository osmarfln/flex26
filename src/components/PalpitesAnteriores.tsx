import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Trash2, XCircle } from "lucide-react";

import { deletePalpite, listPalpites } from "@/lib/palpites.functions";
import { locationName } from "@/lib/draw-order";
import { getAnimalByTen } from "@/lib/animals";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    aguardando: { cls: "border-white/15 bg-white/5 text-white/60", icon: Clock, label: "Aguardando resultado" },
    "acerto de dezena": { cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", icon: CheckCircle2, label: "Acertou dezena" },
    "acerto de grupo": { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2, label: "Acertou grupo" },
    "sem acerto": { cls: "border-red-500/30 bg-red-500/10 text-red-400", icon: XCircle, label: "Sem acerto" },
  };
  const it = map[status] ?? map["aguardando"]!;
  const Icon = it.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${it.cls}`}>
      <Icon className="h-3 w-3" /> {it.label}
    </span>
  );
}

export function PalpitesAnteriores() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["bot-palpites"],
    queryFn: () => listPalpites({ data: { limit: 50 } }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePalpite({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bot-palpites"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-xs font-bold uppercase tracking-widest text-white/40">
        <Loader2 className="h-4 w-4 animate-spin text-red-500" /> carregando palpites...
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">
        Não foi possível carregar os palpites anteriores.
      </p>
    );
  }

  const palpites = data?.palpites ?? [];
  const resumo = data?.resumo;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Palpites salvos", value: resumo?.total ?? 0 },
          { label: "Já conferidos", value: resumo?.conferidos ?? 0 },
          { label: "Com acerto real", value: resumo?.acertos ?? 0 },
          { label: "Taxa de acerto", value: `${resumo?.taxaPct ?? 0}%` },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{c.label}</p>
            <p className="mt-1 text-xl font-black text-red-500">{c.value}</p>
          </div>
        ))}
      </div>

      {palpites.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm font-bold text-white/50">
          Nenhum palpite salvo ainda. No chat, clique em “Salvar palpite” em uma resposta do robô para acompanhar os
          acertos reais aqui.
        </p>
      )}

      <div className="space-y-3">
        {palpites.map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-white">
                  {locationName(p.location)} — {p.target_label ?? p.target_time_type}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Concurso de {String(p.target_date).split("-").reverse().join("/")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  onClick={() => remove.mutate(p.id)}
                  className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:border-red-500/40 hover:text-red-400"
                  aria-label="Excluir palpite"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(p.tens as string[]).map((t) => {
                const hit = (p.acertosDezenas as string[]).includes(t);
                return (
                  <span
                    key={t}
                    title={getAnimalByTen(t)?.name ?? undefined}
                    className={`rounded-lg border px-2 py-1 font-mono text-xs font-black ${
                      hit
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {t}
                  </span>
                );
              })}
            </div>

            {p.sorteadas?.length > 0 && (
              <p className="mt-2 text-[11px] font-bold text-white/50">
                Resultado real:{" "}
                <span className="font-mono text-white/80">
                  {p.sorteadas.map((s: any) => `${s.position}º ${s.dezena}`).join("  ·  ")}
                </span>
              </p>
            )}
            {p.acertosGrupos?.length > 0 && (
              <p className="mt-1 text-[11px] font-bold text-emerald-400">
                Grupos acertados: {p.acertosGrupos.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
