import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useDrawNotifications } from "@/hooks/useDrawNotifications";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile || profile.status !== "approved") {
      throw redirect({ to: "/pendente" });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });

    return { user: data.user, isAdmin: Boolean(isAdmin) };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [location, setLocation] = useState<'rio' | 'capital'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('preferred-location') as 'rio' | 'capital') || 'rio';
    }
    return 'rio';
  });

  // Escuta mudanças no localStorage para atualizar a localidade da notificação
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('preferred-location') as 'rio' | 'capital';
      if (stored && stored !== location) setLocation(stored);
    };
    window.addEventListener('storage', handleStorage);
    // Polling local para mudanças na mesma aba
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [location]);

  useDrawNotifications(location);

  return <Outlet />;
}
