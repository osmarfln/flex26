import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import ManagementLayout from "@/components/layout/ManagementLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLotteryRealtime } from "@/hooks/useLotteryRealtime";
import { AvisoObrigatorio } from "@/components/AvisoObrigatorio";
import { brasiliaDateISO, TIME_ORDER_RIO, TIME_ORDER_CAPITAL } from "@/lib/draw-order";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário de Resultados | Flex Gerenciador" },
      {
        name: "description",
        content:
          "Calendário mensal com a cobertura de resultados do Rio: veja quais dias e horários já foram sincronizados pelo robô.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Calendário de Resultados | Flex Gerenciador" },
      {
        property: "og:description",
        content: "Cobertura mensal dos sorteios sincronizados automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarioPage,
});

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CalendarioPage() {
  const todayISO = brasiliaDateISO();
  const [location, setLocation] = useState<'rio' | 'capital' | 'federal'>('rio');
  const [year, setYear] = useState(Number(todayISO.slice(0, 4)));
  const [month, setMonth] = useState(Number(todayISO.slice(5, 7)) - 1);
  const { lastUpdate } = useLotteryRealtime("calendario-db-changes");


  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

  const { data, isLoading } = useQuery({
    queryKey: ["calendario", start, end, lastUpdate?.toISOString(), location],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_results")
        .select("date, time_type, location")
        .eq("location", location)
        .gte("date", start)
        .lte("date", end);

      if (error) throw error;
      return data ?? [];
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    (data ?? []).forEach((row) => {
      map.set(row.date, [...(map.get(row.date) ?? []), row.time_type]);
    });
    return map;
  }, [data]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    const m = month + delta;
    if (m < 0) {
      setMonth(11);
      setYear(year - 1);
    } else if (m > 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(m);
    }
  }

  const totalDraws = data?.length ?? 0;

  return (
    <ManagementLayout currentPageName="Calendário">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {MONTHS[month]} / {year}
              </CardTitle>
              <CardDescription>
                {isLoading ? "Carregando..." : `${totalDraws} sorteios sincronizados neste mês`}
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <select 
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold mr-4"
                value={location}
                onChange={(e) => setLocation(e.target.value as any)}
              >
                <option value="rio">RIO DE JANEIRO</option>
                <option value="capital">CAPITAL &amp; LCAP</option>
              </select>
              <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo mês">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="py-1 font-bold">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
                const times = byDay.get(iso) ?? [];
                const isToday = iso === todayISO;
                return (
                  <Link
                    key={iso}
                    to="/historico"
                    className={`min-h-[74px] rounded-lg border p-1.5 text-left transition-colors hover:border-primary/60 ${
                      isToday ? "border-primary" : ""
                    } ${times.length ? "bg-card" : "bg-muted/30"}`}
                  >
                    <div className="text-xs font-bold">{pad(day)}</div>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {(location === 'rio' ? TIME_ORDER_RIO : TIME_ORDER_CAPITAL).filter((t) => times.includes(t)).map((t) => (
                        <Badge key={t} variant="secondary" className="px-1 py-0 text-[9px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <AvisoObrigatorio />
      </div>
    </ManagementLayout>
  );
}
