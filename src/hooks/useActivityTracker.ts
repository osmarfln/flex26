import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type ActivityEvent = {
  event_type: string;
  path?: string | null;
  label?: string | null;
  detail?: Record<string, unknown> | null;
  latency_ms?: number | null;
};

/** Registra um evento de atividade do usuário logado (silencioso em caso de falha). */
export async function logActivity(evt: ActivityEvent) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("user_activity").insert({
      user_id: data.user.id,
      event_type: evt.event_type,
      path: evt.path ?? null,
      label: evt.label ?? null,
      detail: (evt.detail ?? null) as never,
      latency_ms: evt.latency_ms ?? null,
    });
  } catch {
    /* rastreio nunca deve quebrar a interface */
  }
}

/**
 * Rastreia navegação e cliques do usuário logado para o painel administrativo.
 * Executa apenas no navegador e ignora falhas de rede.
 */
export function useActivityTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void logActivity({ event_type: "page_view", path: pathname });
  }, [pathname]);

  useEffect(() => {
    let last = 0;
    const onClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 700) return; // evita rajadas
      last = now;
      const el = (e.target as HTMLElement | null)?.closest(
        "button, a, [role='tab'], [role='button']",
      ) as HTMLElement | null;
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 80);
      void logActivity({
        event_type: "click",
        path: window.location.pathname,
        label: label || el.tagName.toLowerCase(),
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const beat = () => void logActivity({ event_type: "heartbeat", path: window.location.pathname });
    const id = window.setInterval(beat, 120_000);
    return () => window.clearInterval(id);
  }, []);
}
