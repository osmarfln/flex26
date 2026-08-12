import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mantém todas as ferramentas da plataforma (atrasos, grupos, dezenas,
 * repetições, ciclos, histórico e status do robô) recalculando sozinhas:
 * - assina as mudanças em tempo real da base de resultados;
 * - revalida periodicamente como rede de segurança;
 * - revalida ao voltar o foco para a aba.
 */
export function useLotteryRealtime(channelName: string) {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const recalculate = useCallback(() => {
    queryClient.invalidateQueries();
    setLastUpdate(new Date());
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lottery_results" },
        () => recalculate(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sync_logs" },
        () => recalculate(),
      )
      .subscribe();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        queryClient.invalidateQueries();
      }
    }, 60_000);

    const onFocus = () => {
      if (document.visibilityState === "visible") queryClient.invalidateQueries();
    };
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [channelName, recalculate, queryClient]);

  return { lastUpdate };
}
