import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TrendingDown, Clock, Flame } from "lucide-react";

import ManagementLayout from "@/components/layout/ManagementLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { getStats, getTenDelayStats, getGroupDelayStats } from "@/lib/lottery.functions";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import { getAnimalByGroup, getAnimalByTen } from "@/lib/animals";
import { getScheduleForDate } from "@/lib/draw-order";

export const Route = createFileRoute("/_authenticated/palpite")({
  head: () => ({
    meta: [
      { title: "Palpite do Dia | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Palpites do dia calculados automaticamente a partir dos resultados reais do Rio e Capital: dezenas atrasadas, grupos em atraso e sugestões por horário.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Palpite do Dia | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Sugestões estatísticas geradas com base nos resultados reais do dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PalpitePage,
});

function PalpitePage() {
  const [location, setLocation] = useState<'rio' | 'capital'>('rio');
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const { lastUpdate } = useLotteryRealtime("palpite-db-changes");
  const fetchStats = useServerFn(getStats);
  const fetchTens = useServerFn(getTenDelayStats);
  const fetchGroups = useServerFn(getGroupDelayStats);


  const key = `${location}-${date}-${dateEnd}-${lastUpdate?.toISOString() ?? "base"}`;

  const statsQuery = useQuery({
    queryKey: ["palpite", "stats", key],
    queryFn: () => fetchStats({ data: { location, date, dateEnd } }),
    staleTime: 0,
    gcTime: 0,
  });
  const tensQuery = useQuery({
    queryKey: ["palpite", "tens", key],
    queryFn: () => fetchTens({ data: { location, date, dateEnd } }),
    staleTime: 0,
    gcTime: 0,
  });
  const groupsQuery = useQuery({
    queryKey: ["palpite", "groups", key],
    queryFn: () => fetchGroups({ data: { location, date, dateEnd } }),
    staleTime: 0,
    gcTime: 0,
  });

  const topTens = (tensQuery.data ?? []).slice(0, 6);
  const topGroups = (groupsQuery.data ?? []).slice(0, 6) as any[];
  const hotTens = statsQuery.data?.mostFrequentTens ?? [];
  const bySchedule = statsQuery.data?.delayedBySchedule ?? {};

  return (
    <ManagementLayout currentPageName="Palpite do Dia">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" /> Palpites gerados dos resultados reais
              </CardTitle>
              <CardDescription>
                Cálculo automático a cada novo resultado — sem intervenção humana.
              </CardDescription>
            </div>
            <select 
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
              value={location}
              onChange={(e) => setLocation(e.target.value as any)}
            >
              <option value="rio">Rio</option>
              <option value="capital">Capital</option>
            </select>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-[10px] font-bold outline-none color-scheme-dark"
                placeholder="Início"
              />
              <input 
                type="date" 
                value={dateEnd} 
                onChange={e => setDateEnd(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-[10px] font-bold outline-none color-scheme-dark"
                placeholder="Fim"
              />
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {topTens.length === 0 && (
              <p className="text-sm text-muted-foreground">Aguardando resultados...</p>
            )}
            {topTens.map((t: any) => {
              const animal = getAnimalByTen(t.ten);
              return (
                <div
                  key={t.ten}
                  className="rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary/50"
                >
                  <div className="text-3xl font-black tracking-tight">{t.ten}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {animal?.icon} {animal?.name ?? "—"}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {t.currentDelay} concursos
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-red-500" /> Grupos mais atrasados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">Aguardando resultados...</p>
              )}
              {topGroups.map((g: any) => {
                const animal = getAnimalByGroup(g.group);
                return (
                  <div
                    key={g.group}
                    className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-2"
                  >
                    <span className="text-sm font-medium">
                      {animal?.icon} {g.group} — {animal?.name ?? g.animal}
                    </span>
                    <Badge variant="outline">{g.currentDelay ?? g.days} concursos</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4 text-orange-500" /> Dezenas quentes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {hotTens.length === 0 && (
                <p className="text-sm text-muted-foreground">Aguardando resultados...</p>
              )}
              {hotTens.map((t) => (
                <Badge key={t.ten} className="px-3 py-1 text-sm">
                  {t.ten} · {t.count}x
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Sugestão por horário
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {getScheduleForDate(location).map((slot) => {
              const info = (bySchedule as any)[slot.timeType];
              const animal = info ? getAnimalByGroup(info.group) : undefined;
              return (
                <div key={slot.timeType} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{slot.label}</span>
                    <span className="text-xs text-muted-foreground">{slot.timeValue}</span>
                  </div>
                  {info ? (
                    <p className="mt-2 text-sm">
                      {animal?.icon} Grupo {info.group} — {info.animal}
                      <span className="block text-xs text-muted-foreground">
                        {info.delayed} · último em {info.lastSeen}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Aguardando resultados...</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <AvisoObrigatorio />
      </div>
    </ManagementLayout>
  );
}
