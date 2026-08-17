import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Ban,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Loader2,
  Network,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import { getScheduleSyncMatrix, runSyncNow } from "@/lib/robot.functions";
import { deleteUserAccount } from "@/lib/admin.functions";
import { RedesPanel } from "@/components/admin/RedesPanel";
import { StatusUsuariosPanel } from "@/components/admin/StatusUsuariosPanel";
import { AnaliseInteligentePanel } from "@/components/admin/AnaliseInteligentePanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Área administrativa do Flex Gerenciador: aprovação de usuários, monitoramento do robô e sincronização dos resultados em tempo real.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel Admin | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Gerencie usuários pendentes e acompanhe o robô de resultados em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const BR = "pt-BR";

function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(BR, { timeZone: "America/Sao_Paulo" });
}

function AdminPage() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { lastUpdate } = useLotteryRealtime("admin-panel");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchMatrix = useServerFn(getScheduleSyncMatrix);
  const syncNow = useServerFn(runSyncNow);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, email, status, created_at, approved_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  const matrixQuery = useQuery({
    queryKey: ["admin", "matrix", lastUpdate?.toISOString()],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: () => fetchMatrix({}),
  });

  const logsQuery = useQuery({
    queryKey: ["admin", "logs", lastUpdate?.toISOString()],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const resultsQuery = useQuery({
    queryKey: ["admin", "results", lastUpdate?.toISOString()],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_results")
        .select("date, time_type, time_value, results, animal, animal_group, created_at")
        .order("date", { ascending: false })
        .order("time_value", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncNow({}),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Sincronização concluída — ${r.synced} registros`);
      else toast.error(r.error ?? "Falha na sincronização");
      queryClient.invalidateQueries();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha na sincronização"),
  });

  async function setStatus(
    id: string,
    status: "approved" | "rejected" | "pending" | "blocked",
  ) {
    setBusyId(id);
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: status === "approved" ? (me.user?.id ?? null) : null,
      })
      .eq("id", id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(
        status === "approved"
          ? "Usuário liberado"
          : status === "rejected"
            ? "Usuário recusado"
            : status === "blocked"
              ? "Usuário bloqueado"
              : "Usuário voltou para pendente",
      );
      usersQuery.refetch();
    }
  }

  const removeUser = useServerFn(deleteUserAccount);
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário excluído definitivamente");
      setConfirmDelete(null);
      usersQuery.refetch();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o usuário"),
  });


  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader subtitle="ÁREA ADMIN" />
        <main className="container mx-auto px-4 py-20 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-black uppercase">Acesso administrativo restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Somente o administrador (osmarfln@gmail.com) pode abrir este painel.
          </p>
        </main>
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");
  const rows = matrixQuery.data?.rows ?? [];
  const synced = rows.filter((r) => r.status === "sincronizado").length;
  const divergent = rows.filter((r) => r.status === "divergente").length;
  const errors = (logsQuery.data ?? []).filter((l) => l.status === "error");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader subtitle="ÁREA ADMIN" />

      <main className="container mx-auto px-3 py-6 sm:px-4 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
              Painel administrativo
            </h1>
            <p className="text-xs text-white/40">
              Última atualização: {lastUpdate ? fmtDateTime(lastUpdate.toISOString()) : "—"}
            </p>
          </div>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar agora
          </Button>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="geral" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Painel geral
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-1.5">
              <Users className="h-4 w-4" /> Usuários
              {pending.length > 0 && (
                <span className="ml-1 rounded-full bg-yellow-400/20 px-1.5 text-[10px] font-bold text-yellow-400">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="robo" className="gap-1.5">
              <Activity className="h-4 w-4" /> Robô
            </TabsTrigger>
          </TabsList>

          {/* PAINEL GERAL */}
          <TabsContent value="geral" className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Usuários pendentes" value={pending.length} tone="warn" />
              <Kpi label="Usuários aprovados" value={approved.length} tone="ok" />
              <Kpi label="Horários sincronizados" value={`${synced}/${rows.length}`} tone="ok" />
              <Kpi
                label="Divergências / erros"
                value={divergent + errors.length}
                tone={divergent + errors.length > 0 ? "error" : "ok"}
              />
            </div>

            <Panel title="Usuários aguardando aprovação">
              {pending.length === 0 ? (
                <Empty text="Nenhum cadastro pendente no momento." />
              ) : (
                <ul className="divide-y divide-white/5">
                  {pending.map((u) => (
                    <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{u.display_name ?? "Sem nome"}</p>
                        <p className="truncate font-mono text-xs text-white/40">{u.email ?? "—"}</p>
                      </div>
                      <span className="text-[11px] text-white/30">
                        {fmtDateTime(u.created_at)}
                      </span>
                      <Button size="sm" onClick={() => setStatus(u.id, "approved")} disabled={busyId === u.id}>
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Últimas execuções do robô">
              <LogList logs={(logsQuery.data ?? []).slice(0, 6)} />
            </Panel>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="usuarios" className="space-y-5">
            <Panel title={`Gerenciador de usuários (${users.length})`}>
              {usersQuery.isLoading ? (
                <Empty text="Carregando usuários..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-white/40">
                        <th className="py-2">Nome</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Papel</th>
                        <th className="py-2">Situação</th>
                        <th className="py-2">Cadastro</th>
                        <th className="py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 font-bold">{u.display_name ?? "—"}</td>
                          <td className="py-3 font-mono text-xs text-white/60">{u.email ?? "—"}</td>
                          <td className="py-3 text-xs">
                            {u.roles.includes("admin") ? (
                              <span className="font-bold text-primary">admin</span>
                            ) : (
                              <span className="text-white/40">usuário</span>
                            )}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="py-3 text-xs text-white/40">{fmtDateTime(u.created_at)}</td>
                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              {u.status !== "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => setStatus(u.id, "approved")}
                                  disabled={busyId === u.id}
                                >
                                  Aprovar
                                </Button>
                              )}
                              {u.status !== "rejected" && !u.roles.includes("admin") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setStatus(u.id, "rejected")}
                                  disabled={busyId === u.id}
                                >
                                  Recusar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Pendentes" value={pending.length} tone="warn" />
              <Kpi label="Aprovados" value={approved.length} tone="ok" />
              <Kpi label="Recusados" value={rejected.length} tone="error" />
            </div>
          </TabsContent>

          {/* ROBÔ */}
          <TabsContent value="robo" className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label="Base de origem"
                value={matrixQuery.data?.sourceOnline ? "Online" : "Offline"}
                tone={matrixQuery.data?.sourceOnline ? "ok" : "error"}
              />
              <Kpi label="Data (Brasília)" value={matrixQuery.data?.date ?? "—"} />
              <Kpi label="Sincronizados" value={`${synced}/${rows.length}`} tone="ok" />
              <Kpi label="Divergentes" value={divergent} tone={divergent ? "error" : "ok"} />
            </div>

            <Panel title="Sincronização horário a horário (hoje)">
              {matrixQuery.isLoading ? (
                <Empty text="Consultando o robô..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-white/40">
                        <th className="py-2">Horário</th>
                        <th className="py-2">Plataforma</th>
                        <th className="py-2">Origem</th>
                        <th className="py-2">Bicho</th>
                        <th className="py-2">Capturado em</th>
                        <th className="py-2">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((r) => (
                        <tr key={r.timeType}>
                          <td className="py-3 font-bold">
                            {r.timeType}{" "}
                            <span className="text-xs font-normal text-white/40">{r.timeValue}</span>
                          </td>
                          <td className="py-3 font-mono">{r.ourFirstPrize ?? "—"}</td>
                          <td className="py-3 font-mono text-white/60">
                            {r.sourceFirstPrize ?? "—"}
                          </td>
                          <td className="py-3 text-xs">{r.animal ?? "—"}</td>
                          <td className="py-3 text-xs text-white/40">{fmtDateTime(r.capturedAt)}</td>
                          <td className="py-3">
                            <SyncBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {matrixQuery.data?.sourceError && (
                <p className="mt-3 text-xs text-destructive">{matrixQuery.data.sourceError}</p>
              )}
            </Panel>

            <Panel title="Resultados recebidos (data, hora, dia, mês e ano)">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-white/40">
                      <th className="py-2">Data</th>
                      <th className="py-2">Horário</th>
                      <th className="py-2">1º ao 5º</th>
                      <th className="py-2">Bicho</th>
                      <th className="py-2">Recebido em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(resultsQuery.data ?? []).map((r, i) => (
                      <tr key={`${r.date}-${r.time_type}-${i}`}>
                        <td className="py-2.5 font-bold">
                          {new Date(`${r.date}T12:00:00`).toLocaleDateString(BR)}
                        </td>
                        <td className="py-2.5 text-xs">
                          {r.time_type} {r.time_value ?? ""}
                        </td>
                        <td className="py-2.5 font-mono text-xs">
                          {(r.results ?? []).join(" · ")}
                        </td>
                        <td className="py-2.5 text-xs">
                          {r.animal ?? "—"}
                          {r.animal_group ? ` (${r.animal_group})` : ""}
                        </td>
                        <td className="py-2.5 text-xs text-white/40">{fmtDateTime(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Histórico de execuções e erros">
              <LogList logs={logsQuery.data ?? []} />
            </Panel>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <AvisoObrigatorio />
        </div>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn" | "error" | "neutral";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-yellow-400"
        : tone === "error"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white/70">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-white/40">{text}</p>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Recusado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400">
      <Clock className="h-3.5 w-3.5" /> Pendente
    </span>
  );
}

function SyncBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    sincronizado: { label: "Sincronizado", cls: "text-emerald-400" },
    divergente: { label: "Divergente", cls: "text-destructive" },
    pendente: { label: "Pendente", cls: "text-yellow-400" },
    aguardando: { label: "Aguardando", cls: "text-white/40" },
  };
  const it = map[status] ?? map["aguardando"]!;
  return <span className={`text-xs font-bold ${it.cls}`}>{it.label}</span>;
}

function LogList({ logs }: { logs: any[] }) {
  if (logs.length === 0) return <Empty text="Nenhuma execução registrada." />;
  return (
    <ul className="divide-y divide-white/5">
      {logs.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
          {l.status === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : l.status === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-yellow-400" />
          )}
          <span className="font-bold uppercase">{l.status}</span>
          <span className="text-white/40">{fmtDateTime(l.started_at)}</span>
          <span className="text-white/60">{l.records_synced ?? 0} registros</span>
          {l.error_message && (
            <span className="w-full truncate text-destructive">{l.error_message}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
