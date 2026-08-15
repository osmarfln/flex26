import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/** Aba retrátil (canto superior direito) com nome, perfil, configuração, área admin e sair */
export function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || !active) return;
      setEmail(user.email ?? "");
      setName((user.user_metadata?.['display_name'] as string) ?? user.email?.split("@")[0] ?? "");

      const [{ data: profile }, { data: admin }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (!active) return;
      if (profile?.display_name) setName(profile.display_name);
      setIsAdmin(Boolean(admin));
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 transition-colors hover:bg-white/10"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-[11px] font-black text-primary">
            {initial}
          </span>
          <span className="hidden max-w-[120px] truncate text-xs font-bold sm:inline">{name || "Conta"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/40" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 border-white/10 bg-background p-0">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-base font-black text-primary">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{name || "Usuário"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
              {isAdmin && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" /> Administrador
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex flex-col p-3">
          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <UserIcon className="h-4 w-4" /> Perfil
          </Link>
          <Link
            to="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-4 w-4" /> Configuração
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <ShieldCheck className="h-4 w-4" /> Área Admin
            </Link>
          )}

          <div className="my-2 h-px bg-white/10" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
