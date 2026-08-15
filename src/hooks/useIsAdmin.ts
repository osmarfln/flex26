import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica no servidor (RPC has_role) se o usuário logado é administrador.
 * `loading` evita piscar as abas restritas antes da checagem.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (active) setLoading(false);
        return;
      }
      const { data: admin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (!active) return;
      setIsAdmin(Boolean(admin));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isAdmin, loading };
}
