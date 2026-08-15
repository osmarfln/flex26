import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, User as UserIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil | Flex Gerenciador" },
      { name: "description", content: "Gerencie seu nome de exibição e veja os dados da sua conta no Flex Gerenciador." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Meu Perfil | Flex Gerenciador" },
      { property: "og:description", content: "Dados da conta e nome de exibição do usuário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || !active) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, status")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setDisplayName(profile?.display_name ?? "");
      setStatus(profile?.status ?? "");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader subtitle="MEU PERFIL" />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Meu perfil</h1>
            <p className="text-xs text-muted-foreground">Dados da sua conta no Flex Gerenciador</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
            <CardDescription>O nome é usado nas saudações da plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={displayName}
                disabled={loading}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label>Status da conta</Label>
              <p className="text-sm font-bold uppercase text-primary">{status || "—"}</p>
            </div>
            <Button onClick={save} disabled={saving || loading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
