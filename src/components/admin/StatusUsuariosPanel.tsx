import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eraser, Eye, Loader2, MousePointerClick, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clearUserActivity } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

type Activity = {
  id: string;
  user_id: string;
  event_type: string;
  path: string | null;
  label: string | null;
  created_at: string;
};

function fmt(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function since(v?: string | null) {
  if (!v) return "—";
  const diff = Date.now() - new Date(v).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

/** Status dos usuários: últimos acessos, cadastro, onde clicou e onde navegou. */
export function StatusUsuariosPanel({ enabled }: { enabled: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "status-users"],
    enabled,
    staleTime: 0,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activityQuery = useQuery({
    queryKey: ["admin", "activity"],
    enabled,
    staleTime: 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activity")
        .select("id, user_id, event_type, path, label, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Activity[];
    },
  });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-activity-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activity" }, () => {
        void activityQuery.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const acts = activityQuery.data ?? [];

  const byUser = useMemo(() => {
    const map = new Map<string, { last?: Activity; views: number; clicks: number; paths: Set<string> }>();
    for (const a of acts) {
      const cur = map.get(a.user_id) ?? { views: 0, clicks: 0, paths: new Set<string>() };
      if (!cur.last) cur.last = a;
      if (a.event_type === "page_view") cur.views += 1;
      if (a.event_type === "click") cur.clicks += 1;
      if (a.path) cur.paths.add(a.path);
      map.set(a.user_id, cur);
    }
    return map;
  }, [acts]);

  const users = usersQuery.data ?? [];
  const onlineCount = users.filter((u) => {
    const last = byUser.get(u.id)?.last?.created_at;
    return last ? Date.now() - new Date(last).getTime() < 5 * 60_000 : false;
  }).length;

  const detail = selected ? acts.filter((a) => a.user_id === selected).slice(0, 40) : [];
  const selectedUser = users.find((u) => u.id === selected);

  const clearFn = useServerFn(clearUserActivity);
  const clearMutation = useMutation({
    mutationFn: (userId?: string | null) => clearFn({ data: { userId: userId ?? null } }),
    onSuccess: (_res, userId) => {
      toast.success(
        userId ? "Trilha de navegação do usuário limpa." : "Histórico de trilhas limpo por completo.",
      );
      void activityQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message || "Falha ao limpar o histórico."),
  });

  const clearing = clearMutation.isPending;

  function confirmClear(userId?: string | null) {
    const label = userId ? "deste usuário" : "de TODOS os usuários";
    if (!window.confirm(`Limpar o histórico de trilhas de navegação ${label}? Esta ação não pode ser desfeita.`))
      return;
    clearMutation.mutate(userId ?? null);
  }


  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Usuários cadastrados" value={users.length} />
        <Kpi label="Ativos (5 min)" value={onlineCount} tone="text-emerald-400" />
        <Kpi label="Eventos registrados" value={acts.length} />
        <Kpi
          label="Cliques monitorados"
          value={acts.filter((a) => a.event_type === "click").length}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white/70">
          Status e últimos acessos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-white/40">
                <th className="py-2">Usuário</th>
                <th className="py-2">Situação</th>
                <th className="py-2">Cadastro</th>
                <th className="py-2">Último acesso</th>
                <th className="py-2">Onde está</th>
                <th className="py-2 text-right">Views / Cliques</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const info = byUser.get(u.id);
                const online = info?.last
                  ? Date.now() - new Date(info.last.created_at).getTime() < 5 * 60_000
                  : false;
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className={`cursor-pointer transition-colors hover:bg-white/5 ${
                      selected === u.id ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-3">
                      <p className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-white/20"}`}
                        />
                        {u.display_name ?? "—"}
                      </p>
                      <p className="font-mono text-[11px] text-white/40">{u.email ?? "—"}</p>
                    </td>
                    <td className="py-3 text-xs">{u.status}</td>
                    <td className="py-3 text-xs text-white/50">{fmt(u.created_at)}</td>
                    <td className="py-3 text-xs">
                      {info?.last ? (
                        <>
                          <span className="font-bold">{since(info.last.created_at)}</span>
                          <span className="block text-[11px] text-white/40">
                            {fmt(info.last.created_at)}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/30">sem registro</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-xs text-white/60">
                      {info?.last?.path ?? "—"}
                    </td>
                    <td className="py-3 text-right text-xs">
                      <span className="inline-flex items-center gap-1 text-white/60">
                        <Eye className="h-3.5 w-3.5" /> {info?.views ?? 0}
                      </span>
                      <span className="ml-3 inline-flex items-center gap-1 text-white/60">
                        <MousePointerClick className="h-3.5 w-3.5" /> {info?.clicks ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white/70">
          <UserCircle2 className="h-4 w-4" />
          Trilha de navegação {selectedUser ? `— ${selectedUser.display_name ?? selectedUser.email}` : ""}
        </h2>
        {!selected ? (
          <p className="py-6 text-center text-sm text-white/40">
            Selecione um usuário na tabela para ver onde ele acessou e onde clicou.
          </p>
        ) : detail.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Sem atividades registradas.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {detail.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                    a.event_type === "click"
                      ? "bg-primary/15 text-primary"
                      : a.event_type === "page_view"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/10 text-white/50"
                  }`}
                >
                  {a.event_type === "click" ? "clicou" : a.event_type === "page_view" ? "acessou" : a.event_type}
                </span>
                <span className="font-mono text-white/70">{a.path ?? "—"}</span>
                {a.label && <span className="text-white/50">“{a.label}”</span>}
                <span className="ml-auto text-white/30">{fmt(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, tone = "text-foreground" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
