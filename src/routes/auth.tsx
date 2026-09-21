import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useHydrated } from "@/hooks/useHydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso restrito | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Área de login do Flex Gerenciador. Acesso permitido apenas com email e senha cadastrados.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso restrito | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Entre com seu login e senha para acessar o painel Flex Gerenciador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const hydrated = useHydrated();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/", replace: true });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de redefinição para o seu email.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Acesso liberado");
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada. Aguardando aprovação do administrador.");
          navigate({ to: "/pendente", replace: true });
        } else {
          toast.success(
            "Cadastro enviado. Após confirmar o email, o acesso precisa ser aprovado pelo administrador.",
          );
          setMode("login");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(
        message.includes("Invalid login credentials")
          ? "Email ou senha incorretos"
          : message.includes("already registered")
            ? "Este email já possui cadastro"
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-4 py-10">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="home-glass relative w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Flex Gerenciador</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Informe seu email cadastrado e enviaremos um link para criar uma nova senha."
              : "Área restrita. Acesse com seu login e senha. Novos cadastros só entram após aprovação do administrador."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="pl-9"
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== "forgot" && (
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                <KeyRound className="h-3.5 w-3.5" /> Esqueci minha senha
              </button>
            </div>
          )}

          <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link de redefinição"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Ainda não tem acesso?" : "Já tem acesso?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {mode === "login" ? "Criar conta" : "Fazer login"}
          </button>
        </p>
      </div>
    </main>
  );
}
