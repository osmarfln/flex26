import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFederalIntel } from "@/lib/federal-intel.functions";
import { getAnimalByGroup } from "@/lib/animals";
import { Loader2, Landmark, Flame, Timer, Trophy, Percent, FlaskConical, Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const WINDOWS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "30", value: 30 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Todo o histórico", value: 0 },
];

const POSITIONS = [
  { label: "1º ao 5º", value: 0 },
  { label: "Somente 1º", value: 1 },
  { label: "2º", value: 2 },
  { label: "3º", value: 3 },
  { label: "4º", value: 4 },
  { label: "5º", value: 5 },
];

const WEEKDAYS = [
  { label: "Quarta e domingo", value: "all" as const },
  { label: "Somente quarta", value: "wed" as const },
  { label: "Somente domingo", value: "sun" as const },
];

function classColor(c: string) {
  if (c.includes("muito elevado")) return "text-red-400 border-red-500/40 bg-red-500/10";
  if (c.includes("elevado")) return "text-orange-300 border-orange-500/40 bg-orange-500/10";
  if (c.includes("normal")) return "text-sky-300 border-sky-500/40 bg-sky-500/10";
  if (c.includes("baixo")) return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  return "text-white/50 border-white/10 bg-white/5";
}

const num = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "--" : v.toFixed(d);

/**
 * Módulo de Inteligência da LOTERIA FEDERAL.
 * Estatísticas históricas sincronizadas e auditadas via robô automatizado,
 * medindo atraso em concursos realizados (a Federal não sorteia todos os dias).
 */
export function FederalIntelligencePanel() {
  const [position, setPosition] = useState(0);
  const [weekday, setWeekday] = useState<"all" | "wed" | "sun">("all");
  const [windowSize, setWindowSize] = useState(0);
  const [topN, setTopN] = useState(10);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showBacktest, setShowBacktest] = useState(false);
  const [tab, setTab] = useState<"overview" | "tens" | "groupsDelayed" | "groupsHot" | "combined">("overview");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["federal-intel", position, weekday, windowSize, topN],
    queryFn: () => getFederalIntel({ data: { position, weekday, window: windowSize, topN } }),
    staleTime: 60_000,
  });

  const tensFiltered = useMemo(() => {
    const list = (data?.tens ?? []) as any[];
    const q = search.replace(/\D/g, "");
    if (!q) return list;
    return list.filter((t) => t.ten.includes(q) || t.group.includes(q));
  }, [data, search]);

  const detail = useMemo(
    () => (data?.tens as any[] | undefined)?.find((t) => t.ten === selected) ?? null,
    [data, selected],
  );
  const detailGroup = useMemo(
    () => (data?.groups as any[] | undefined)?.find((g) => g.group === detail?.group) ?? null,
    [data, detail],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white/60">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Calculando inteligência da Loteria Federal...
      </div>
    );
  }

  if (!data) return null;

  const topDelayed = (data.rankings.tensMostDelayed as any[])[0];
  const topHot = (data.rankings.tensHottest as any[])[0];
  const topGroupDelayed = (data.rankings.groupsMostDelayed as any[])[0];
  const topGroupHot = (data.rankings.groupsHottest as any[])[0];
  const topScore = (data.rankings.topScore as any[])[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl border border-primary/40 bg-primary/15 p-2">
            <Landmark className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">
              Inteligência LOTERIA FEDERAL
            </h3>
            <p className="text-xs md:text-sm text-white/50 font-medium">
              Estatísticas sincronizadas e auditadas letra por letra via robô automatizado sem intervenção
              humana, pois os resultados não saem todos os dias. O atraso é medido em concursos realizados —
              nunca em dias sem extração.
            </p>
          </div>
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Info label="Concursos analisados" value={String(data.totals.contests)} />
          <Info label="Prêmios analisados" value={String(data.totals.prizes)} />
          <Info label="Histórico total" value={String(data.totals.historyContests)} />
          <Info
            label="Última atualização"
            value={new Date(data.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          />
        </div>

        {data.latest && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 overflow-x-auto">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">
              Última extração confirmada — {new Date(`${data.latest.date}T12:00:00`).toLocaleDateString("pt-BR")}{" "}
              {data.latest.time_value ?? ""}
            </p>
            <table className="w-full min-w-[520px] text-xs">
              <thead className="text-white/40 uppercase text-[10px]">
                <tr>
                  <th className="text-left py-1">Posição</th>
                  <th className="text-left">Número</th>
                  <th className="text-left">4 dígitos</th>
                  <th className="text-left">Centena</th>
                  <th className="text-left">Dezena</th>
                  <th className="text-left">Unidade</th>
                  <th className="text-left">Grupo</th>
                </tr>
              </thead>
              <tbody>
                {data.latest.prizes.map((p: any) => (
                  <tr key={p.position} className="border-t border-white/5">
                    <td className="py-1.5 font-bold">{p.position}º</td>
                    <td className="font-mono">{p.full}</td>
                    <td className="font-mono text-primary font-black">{p.quatro}</td>
                    <td className="font-mono">{p.centena}</td>
                    <td className="font-mono font-black">{p.dezena}</td>
                    <td className="font-mono">{p.unidade}</td>
                    <td>
                      {p.grupo} {getAnimalByGroup(p.grupo)?.icon} {getAnimalByGroup(p.grupo)?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select label="Posição do prêmio" value={String(position)} onChange={(v) => setPosition(Number(v))}
          options={POSITIONS.map((p) => ({ label: p.label, value: String(p.value) }))} />
        <Select label="Dia da extração" value={weekday} onChange={(v) => setWeekday(v as any)}
          options={WEEKDAYS.map((w) => ({ label: w.label, value: w.value }))} />
        <Select label="Período (extrações)" value={String(windowSize)} onChange={(v) => setWindowSize(Number(v))}
          options={WINDOWS.map((w) => ({ label: w.label, value: String(w.value) }))} />
        <Select label="Dezenas no backtest" value={String(topN)} onChange={(v) => setTopN(Number(v))}
          options={[5, 10, 15, 20].map((n) => ({ label: `${n} dezenas`, value: String(n) }))} />
      </div>

      {/* Abas de navegação */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview" as const, label: "Visão geral" },
          { id: "tens" as const, label: `Ranking completo de dezenas — amostra de ${data.filters.sampleSize} extrações` },
          { id: "groupsDelayed" as const, label: "Grupos mais atrasados" },
          { id: "groupsHot" as const, label: "Grupos mais puxados" },
          { id: "combined" as const, label: "Atraso elevado + grupo atrasado" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
              tab === t.id
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
      <>
      {/* Cards estatísticos */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/50 leading-relaxed">
        <strong className="text-white/80 uppercase tracking-widest">Como ler:</strong> atraso é contado em
        concursos realizados (nunca em dias corridos); "puxada" é a dezena/grupo com maior frequência no período;
        o Score é o Índice de Relevância Histórica (0–100) = 0,40×Atraso + 0,30×Freq. recente + 0,20×Grupo + 0,10×Estabilidade.
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Timer} tone="red" title="Dezena mais atrasada"
          main={topDelayed?.ten} sub={`${topDelayed?.delay ?? 0} concursos • índice ${num(topDelayed?.delayIndex)}`} />
        <StatCard icon={Flame} tone="orange" title="Dezena mais puxada"
          main={topHot?.ten} sub={`${topHot?.freqTotal ?? 0}x • ${num(topHot?.freqPct, 1)}%`} />
        <StatCard icon={Timer} tone="sky" title="Grupo mais atrasado"
          main={topGroupDelayed?.group} sub={`${getAnimalByGroup(topGroupDelayed?.group)?.name ?? ""} • ${topGroupDelayed?.delay ?? 0} concursos`} />
        <StatCard icon={Trophy} tone="emerald" title="Grupo mais puxado"
          main={topGroupHot?.group} sub={`${getAnimalByGroup(topGroupHot?.group)?.name ?? ""} • ${topGroupHot?.freqTotal ?? 0}x`} />
        <StatCard icon={Percent} tone="violet" title="Maior Score atual"
          main={topScore?.ten} sub={`${num(topScore?.score, 1)} / 100 • ${topScore?.scoreLabel ?? ""}`} />
      </div>

      {/* Probabilidades teóricas */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h4 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/50">
          Probabilidades teóricas (matemática pura)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Info label="Dezena em 1 posição" value={`${num(data.probabilities.tenPerPosition, 2)}%`} />
          <Info label="Dezena em 5 prêmios" value={`${num(data.probabilities.tenAnyOfFive, 2)}%`} />
          <Info label="Grupo em 1 posição" value={`${num(data.probabilities.groupPerPosition, 2)}%`} />
          <Info label="Grupo em 5 prêmios" value={`${num(data.probabilities.groupAnyOfFive, 2)}%`} />
        </div>
        <p className="mt-3 text-[11px] text-white/40">
          Estas probabilidades não aumentam porque uma dezena ou grupo está atrasado — os sorteios são
          independentes.
        </p>
      </div>
      </>
      )}

      {/* Tabela de dezenas */}
      {tab === "tens" && (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-white/50">
            Ranking completo de dezenas — amostra de {data.filters.sampleSize} extrações
          </h4>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar dezena ou grupo"
              className="w-40 bg-transparent text-xs outline-none text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="text-white/40 uppercase text-[10px]">
              <tr>
                <th className="text-left py-2">Dezena</th>
                <th className="text-left">Grupo</th>
                <th className="text-right">Atraso</th>
                <th className="text-right">Dias</th>
                <th className="text-right">Interv. médio</th>
                <th className="text-right">Índice</th>
                <th className="text-right">Maior atraso</th>
                <th className="text-right">Freq.</th>
                <th className="text-right">Recente</th>
                <th className="text-right">Score</th>
                <th className="text-left pl-3">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {tensFiltered
                .slice()
                .sort((a: any, b: any) => b.score - a.score)
                .slice(0, 40)
                .map((t: any) => (
                  <tr
                    key={t.ten}
                    onClick={() => setSelected(t.ten === selected ? null : t.ten)}
                    className="cursor-pointer border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="py-2 font-mono font-black text-primary">{t.ten}</td>
                    <td>
                      {t.group} {getAnimalByGroup(t.group)?.icon}
                    </td>
                    <td className="text-right font-bold">{t.delay}</td>
                    <td className="text-right text-white/50">{t.daysSince ?? "--"}</td>
                    <td className="text-right text-white/50">{num(t.avgInterval, 1)}</td>
                    <td className="text-right font-bold">{num(t.delayIndex)}</td>
                    <td className="text-right text-white/50">{t.maxDelay}</td>
                    <td className="text-right">{t.freqTotal}</td>
                    <td className="text-right text-white/50">{t.freqRecent}</td>
                    <td className="text-right font-black">{num(t.score, 1)}</td>
                    <td className="pl-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${classColor(t.classification)}`}>
                        {t.classification}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-2 text-sm font-black uppercase">
              Dezena {detail.ten} — Grupo {detail.group} {getAnimalByGroup(detail.group)?.icon}{" "}
              {getAnimalByGroup(detail.group)?.name}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Info label="Última aparição" value={detail.lastContest ?? "nunca no período"} />
              <Info label="Última posição" value={detail.lastPosition ? `${detail.lastPosition}º prêmio` : "--"} />
              <Info label="Posições registradas" value={detail.positions.length ? detail.positions.map((p: number) => `${p}º`).join(", ") : "--"} />
              <Info label="Índice de frequência" value={num(detail.freqIndex)} />
              <Info label="Componente A (atraso)" value={String(detail.components.A)} />
              <Info label="Componente R (freq. recente)" value={String(detail.components.R)} />
              <Info label="Componente G (grupo)" value={String(detail.components.G)} />
              <Info label="Componente E (estabilidade)" value={String(detail.components.E)} />
            </div>
            {detailGroup && (
              <p className="mt-3 text-[11px] text-white/50">
                Grupo {detailGroup.group}: dezenas {detailGroup.tens.join(", ")} • atraso {detailGroup.delay}{" "}
                concursos • intervalo médio {num(detailGroup.avgInterval, 1)} • maior atraso {detailGroup.maxDelay} •
                frequência {detailGroup.freqTotal} ({num(detailGroup.freqPct, 1)}%) • dezena mais frequente{" "}
                {detailGroup.topTen ?? "--"}
              </p>
            )}
            <p className="mt-2 text-[11px] text-white/40">
              Score {num(detail.score, 1)} / 100 — {detail.scoreLabel}. Fórmula: 0,40×A + 0,30×R + 0,20×G + 0,10×E.
            </p>
          </div>
        )}
      </div>
      )}

      {/* Rankings de grupos */}
      {tab === "groupsDelayed" && (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/50 leading-relaxed">
          <strong className="text-white/80 uppercase tracking-widest">Grupos mais atrasados:</strong> o atraso do
          grupo zera quando qualquer uma das quatro dezenas aparece. Índice = atraso atual ÷ intervalo médio histórico.
        </div>
        <RankTable
          title="Grupos mais atrasados"
          rows={(data.rankings.groupsMostDelayed as any[]).map((g) => ({
            key: g.group,
            main: `${g.group} ${getAnimalByGroup(g.group)?.name ?? ""}`,
            cols: [String(g.delay), num(g.avgInterval, 1), num(g.delayIndex), String(g.maxDelay), g.lastDate ?? "--"],
          }))}
          headers={["Grupo", "Atraso", "Média", "Índice", "Máx.", "Última"]}
        />
      </div>
      )}
      {tab === "groupsHot" && (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/50 leading-relaxed">
          <strong className="text-white/80 uppercase tracking-widest">Grupos mais puxados:</strong> frequência do
          grupo = soma das ocorrências das quatro dezenas. Índice = frequência observada ÷ esperada (4% por posição).
        </div>
        <RankTable
          title="Grupos mais puxados"
          rows={(data.rankings.groupsHottest as any[]).map((g) => ({
            key: g.group,
            main: `${g.group} ${getAnimalByGroup(g.group)?.name ?? ""}`,
            cols: [String(g.freqTotal), `${num(g.freqPct, 1)}%`, num(g.freqIndex), g.topTen ?? "--", String(g.freqRecent)],
          }))}
          headers={["Grupo", "Freq.", "%", "Índice", "Top dezena", "Recente"]}
        />
      </div>
      )}
      {tab === "combined" && (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/50 leading-relaxed">
          <strong className="text-white/80 uppercase tracking-widest">Combinação dezena + grupo atrasados:</strong>{" "}
          dezenas com atraso elevado cujo grupo também está atrasado — leitura estatística combinada, sem garantia de resultado.
        </div>
        <RankTable
          title="Atraso elevado + grupo atrasado"
          rows={(data.rankings.combined as any[]).map((t) => ({
            key: t.ten,
            main: `${t.ten} (G${t.group})`,
            cols: [String(t.delay), num(t.delayIndex), num(t.score, 1), t.classification],
          }))}
          headers={["Dezena", "Atraso", "Índice", "Score", "Classificação"]}
        />
      </div>
      )}
      {tab === "overview" && (
        <RankTable
          title="Frequência por posição do prêmio"
          rows={(data.rankings.byPosition as any[]).map((p) => ({
            key: String(p.position),
            main: `${p.position}º prêmio`,
            cols: [String(p.total), p.top.map((t: any) => `${t.ten} (${t.count}x)`).join("  ") || "--"],
          }))}
          headers={["Posição", "Extrações", "Top dezenas"]}
        />
      )}

      {/* Backtest */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <button
          onClick={() => setShowBacktest((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
        >
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm font-black uppercase tracking-tight">
            Backtest — validação histórica da fórmula
          </span>
          <ChevronDown className={`h-5 w-5 text-white/40 transition-transform ${showBacktest ? "rotate-180" : ""}`} />
        </button>

        {showBacktest && (
          <div className="mt-4">
            {data.backtest ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <Info label="Testes realizados" value={String(data.backtest.tested)} />
                  <Info label="Dezenas por teste" value={String(data.backtest.topN)} />
                  <Info label="Taxa de acerto (Score)" value={`${num(data.backtest.rate, 1)}%`} />
                  <Info label="Acaso equivalente" value={`${num(data.backtest.randomRate, 1)}%`} />
                  <Info label="Diferença vs. acaso" value={`${num(data.backtest.edge, 1)} p.p.`} />
                  <Info label="Intervalo de confiança 95%" value={`${num(data.backtest.ci95[0], 1)}% – ${num(data.backtest.ci95[1], 1)}%`} />
                  <Info label="Desempenho das atrasadas" value={`${num(data.backtest.delayRate, 1)}%`} />
                  <Info label="Desempenho das puxadas" value={`${num(data.backtest.hotRate, 1)}%`} />
                  <Info label="Quarta-feira" value={`${num(data.backtest.wed.rate, 1)}% (${data.backtest.wed.tested})`} />
                  <Info label="Domingo" value={`${num(data.backtest.sun.rate, 1)}% (${data.backtest.sun.tested})`} />
                  <Info label="Acertos por posição" value={(data.backtest.positionHits as number[]).map((h, i) => `${i + 1}º:${h}`).join("  ")} />
                  <Info label="Acertos totais" value={String(data.backtest.hits)} />
                </div>
                <p className="mt-3 text-[11px] text-white/40">
                  Cada teste usa apenas os concursos anteriores à extração avaliada (sem vazamento de dados
                  futuros).{" "}
                  {data.backtest.edge > 0
                    ? "A diferença observada em relação ao acaso é apenas histórica e pode não se repetir."
                    : "O método não superou o acaso nesta amostra — trate os indicadores apenas como leitura histórica."}
                </p>
              </>
            ) : (
              <p className="text-xs text-white/50">
                Amostra insuficiente para backtest confiável neste filtro (mínimo de 30 extrações).
              </p>
            )}
          </div>
        )}
      </div>

      <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-[11px] md:text-xs text-white/50 leading-relaxed">
        “Esta análise utiliza frequências, atrasos e padrões encontrados em resultados históricos. Uma dezena ou
        grupo atrasado não fica obrigado a aparecer. Os sorteios são independentes e os indicadores apresentados
        não representam garantia de resultado futuro.”
      </p>
    </motion.section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</p>
      <p className="truncate text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="block text-[9px] font-black uppercase tracking-widest text-white/40">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xs font-bold text-white outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0D121F]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({
  icon: Icon,
  title,
  main,
  sub,
  tone,
}: {
  icon: any;
  title: string;
  main?: string;
  sub?: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    red: "text-red-400 bg-red-500/10 border-red-500/30",
    orange: "text-orange-300 bg-orange-500/10 border-orange-500/30",
    sky: "text-sky-300 bg-sky-500/10 border-sky-500/30",
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/30",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className={`mb-2 inline-flex rounded-lg border p-1.5 ${tones[tone] ?? tones["red"]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{title}</p>
      <p className="text-2xl font-black text-white">{main ?? "--"}</p>
      <p className="truncate text-[11px] text-white/50">{sub}</p>
    </div>
  );
}

function RankTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: { key: string; main: string; cols: string[] }[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h4 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/50">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-xs">
          <thead className="text-white/40 uppercase text-[10px]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-white/5">
                <td className="py-1.5 font-bold text-primary">{r.main}</td>
                {r.cols.map((c, i) => (
                  <td key={i} className="text-white/70">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
