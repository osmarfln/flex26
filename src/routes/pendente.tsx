import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/useHydrated";

export const Route = createFileRoute("/pendente")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso pendente de aprovação | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Sua conta foi criada e aguarda aprovação do administrador do Flex Gerenciador para liberar o acesso.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso pendente | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Aguardando aprovação do administrador para liberar o acesso à plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendentePage,
});

function PendentePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setStatus(profile?.status ?? "pending");
      if (profile?.status === "approved") navigate({ to: "/", replace: true });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rejected = status === "rejected";

  if (!hydrated) return null;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-foreground">
          Você não tem acesso a esta página
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected
            ? "Seu acesso foi recusado pelo administrador. Entre em contato para mais informações."
            : "Seu cadastro precisa ser aprovado pelo administrador do robô para liberar o acesso ao Flex Gerenciador."}
        </p>

        <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/40 font-bold uppercase tracking-wider">Email</span>
            <span className="truncate font-mono text-white/80">{email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/40 font-bold uppercase tracking-wider">Situação</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${rejected ? "text-destructive" : "text-red-400"}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {rejected ? "Recusado" : "Aguardando aprovação"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/40 font-bold uppercase tracking-wider">Admin</span>
            <span className="font-mono text-white/80">osmarfln@gmail.com</span>
          </div>
        </div>

        <Button variant="outline" className="mt-6 w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </main>
  );
}
