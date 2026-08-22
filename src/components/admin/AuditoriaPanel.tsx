import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Ban, Trash2, RotateCcw, ShieldCheck, User, Calendar, Clock, Filter, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function AuditoriaPanel({ enabled }: { enabled: boolean }) {
  const [filterAction, setFilterAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit" as any)
        .select(`
          *,
          profiles:admin_id (display_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as any[];
    },
  });

  const filteredLogs = (logs ?? []).filter(log => {
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesSearch = !searchTerm || 
      log.target_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'permitir': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'bloquear': return <Ban className="h-4 w-4 text-yellow-400" />;
      case 'excluir': return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'limpar': return <RotateCcw className="h-4 w-4 text-blue-400" />;
      default: return <ShieldCheck className="h-4 w-4 text-white/40" />;
    }
  };

  const fmtDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Buscar por usuário ou email</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Email, ID ou nome..."
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
        </div>
        <div className="w-full sm:w-[200px]">
          <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 block">Filtrar Ação</label>
          <select 
            className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none focus:border-primary/50"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="">Todas as ações</option>
            <option value="permitir">Permitir</option>
            <option value="bloquear">Bloquear</option>
            <option value="excluir">Excluir</option>
            <option value="limpar">Limpar Histórico</option>
          </select>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur md:p-6">
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white/70">Histórico de Auditoria</h2>
        
        {isLoading ? (
          <p className="py-20 text-center text-sm text-white/40">Carregando logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="py-20 text-center text-sm text-white/40">Nenhum registro encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-white/40 border-b border-white/5">
                  <th className="py-2">Data/Hora</th>
                  <th className="py-2">Administrador</th>
                  <th className="py-2">Ação</th>
                  <th className="py-2">Alvo (Email/ID)</th>
                  <th className="py-2">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-[11px] font-mono text-white/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-white/20" />
                        {fmtDate(log.created_at)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-primary/60" />
                        <div>
                          <p className="font-bold text-xs">{log.profiles?.display_name || 'Admin'}</p>
                          <p className="text-[10px] text-white/30">{log.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-tighter">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="text-xs font-mono text-white/70">{log.target_user_email || log.target_user_id || 'Global'}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-[10px] text-white/40 leading-tight max-w-[200px]">
                        {JSON.stringify(log.details)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
