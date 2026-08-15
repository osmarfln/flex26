import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import ManagementLayout from "@/components/layout/ManagementLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DRAW_SCHEDULE, brasiliaDateISO } from "@/lib/draw-order";
import { getAnimalByTen } from "@/lib/animals";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";

export const Route = createFileRoute("/_authenticated/cadastrar")({
  head: () => ({
    meta: [
      { title: "Cadastro Manual de Resultados | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Cadastro manual de resultados do Rio para complementar o robô: informe data, horário e os 5 prêmios.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Cadastro Manual | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Lançamento manual de sorteios quando o robô não capturou o horário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CadastrarPage,
});

function CadastrarPage() {
  const { isAdmin } = Route.useRouteContext() as { isAdmin: boolean };
  const queryClient = useQueryClient();
  const { lastUpdate } = useLotteryRealtime("cadastrar-db-changes");

  const [date, setDate] = useState(brasiliaDateISO());
  const [timeType, setTimeType] = useState(DRAW_SCHEDULE[0]!.timeType);
  const [timeValue, setTimeValue] = useState(DRAW_SCHEDULE[0]!.timeValue);
  const [prizes, setPrizes] = useState<string[]>(["", "", "", "", ""]);
  const [saving, setSaving] = useState(false);

  const recentQuery = useQuery({
    queryKey: ["cadastrar", "recent", lastUpdate?.toISOString()],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_results")
        .select("id, date, time_type, time_value, results, animal")
        .order("date", { ascending: false })
        .order("time_value", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!isAdmin) {
    return (
      <ManagementLayout currentPageName="Cadastrar">
        <Card>
          <CardContent className="py-14 text-center">
            <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-destructive" />
            <p className="font-bold">Cadastro manual restrito ao administrador.</p>
            <p className="text-sm text-muted-foreground">
              Solicite acesso ao administrador (osmarfln@gmail.com).
            </p>
          </CardContent>
        </Card>
      </ManagementLayout>
    );
  }

  function setPrize(i: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 4);
    setPrizes((prev) => prev.map((p, idx) => (idx === i ? clean : p)));
  }

  async function handleSave() {
    const filled = prizes.map((p) => p.trim());
    if (filled.some((p) => p.length < 2)) {
      toast.error("Informe os 5 prêmios (mínimo 2 dígitos cada).");
      return;
    }
    setSaving(true);
    const firstTen = filled[0]!.slice(-2);
    const animal = getAnimalByTen(firstTen);
    const { error } = await supabase.from("lottery_results").insert({
      date,
      time_type: timeType,
      time_value: timeValue,
      results: filled,
      animal: animal?.name ?? null,
      animal_group: animal?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Resultado ${timeType} de ${date} cadastrado.`);
    setPrizes(["", "", "", "", ""]);
    queryClient.invalidateQueries();
    recentQuery.refetch();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("lottery_results").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Resultado removido.");
      recentQuery.refetch();
    }
  }

  const previewAnimal = prizes[0] && prizes[0].length >= 2 ? getAnimalByTen(prizes[0].slice(-2)) : undefined;

  return (
    <ManagementLayout currentPageName="Cadastrar">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Cadastro manual
            </CardTitle>
            <CardDescription>
              Use apenas quando o robô não capturar algum horário. Os cálculos são atualizados na hora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="horario">Horário</Label>
                <select
                  id="horario"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={timeType}
                  onChange={(e) => {
                    const slot = DRAW_SCHEDULE.find((s) => s.timeType === e.target.value);
                    setTimeType(e.target.value);
                    if (slot) setTimeValue(slot.timeValue);
                  }}
                >
                  {DRAW_SCHEDULE.map((s) => (
                    <option key={s.timeType} value={s.timeType}>
                      {s.label} — {s.timeValue}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Hora da extração</Label>
                <Input id="hora" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {prizes.map((p, i) => (
                <div key={i} className="space-y-1.5">
                  <Label htmlFor={`p${i}`} className="text-xs">{i + 1}º</Label>
                  <Input
                    id={`p${i}`}
                    inputMode="numeric"
                    placeholder="0000"
                    value={p}
                    onChange={(e) => setPrize(i, e.target.value)}
                    className="text-center font-bold"
                  />
                </div>
              ))}
            </div>

            {previewAnimal && (
              <p className="text-sm text-muted-foreground">
                Grupo do 1º prêmio: {previewAnimal.icon} {previewAnimal.id} — {previewAnimal.name}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar resultado
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos lançamentos</CardTitle>
            <CardDescription>Confira e corrija registros recentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentQuery.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum resultado registrado.</p>
            )}
            {(recentQuery.data ?? []).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-card/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Badge variant="secondary">{r.time_type}</Badge>
                    {r.date.split("-").reverse().join("/")}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {(r.results ?? []).join(" · ")} {r.animal ? `— ${r.animal}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir resultado"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}
