import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRioIntel } from "@/lib/rio-intel.functions";
import { getAnimalByGroup } from "@/lib/animals";
import { DRAW_SCHEDULE_CAPITAL, DRAW_SCHEDULE_RIO, locationName } from "@/lib/draw-order";
import { Loader2, Brain, Flame, Timer, Trophy, Percent, FlaskConical, Search, CalendarDays } from "lucide-react";

const WINDOWS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "30", value: 30 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Todo o histórico", value: 0 },
];

const DAYS = [
  { label: "Todos", value: 0 },
  { label: "7 dias", value: 7 },
  { label: "15 dias", value: 15 },
  { label: "30 dias", value: 30 },
  { label: "60 dias", value: 60 },
  { label: "90 dias", value: 90 },
];

const POSITIONS = [
  { label: "1º ao 5º", value: 0 },
  { label: "Somente 1º", value: 1 },
  { label: "2º", value: 2 },
  { label: "3º", value: 3 },
  { label: "4º", value: 4 },
  { label: "5º", value: 5 },
];

const TABS = [
  { id: "resumo", label: "Visão geral" },
  { id: "dia", label: "Resultados do dia" },
  { id: "atrasadas", label: "Ranking completo de dezenas" },
  { id: "puxadas", label: "Dezenas mais puxadas" },
  { id: "grupos-atraso", label: "Grupos mais atrasados" },
  { id: "grupos-puxados", label: "Grupos mais puxados" },
  { id: "possibilidades", label: "Atraso elevado + grupo atrasado" },
  { id: "backtest", label: "Validação histórica" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function classColor(c: string) {
  if (c.includes("muito elevado")) return "text-red-400 border-red-500/40 bg-red-500/10";
  if (c.includes("elevado")) return "text-orange-300 border-orange-500/40 bg-orange-500/10";
  if (c.includes("normal")) return "text-sky-300 border-sky-500/40 bg-sky-500/10";
  if (c.includes("baixo")) return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  return "text-white/50 border-white/10 bg-white/5";
}

const num = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "--" : v.toFixed(d);

function Explain({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-white/70">
      <strong className="text-primary font-black uppercase">{title}: </strong>
      {children}
    </div>
  );
}

/**
 * Inteligência de cálculos da ANÁLISE RIO — integrada à aba existente.
 * Usa apenas o histórico do Rio já armazenado (6 resultados/dia x 5 prêmios).
 */
export function RioIntelligencePanel({ location = "rio" }: { location?: "rio" | "capital" }) {
  const schedule = location === "capital" ? DRAW_SCHEDULE_CAPITAL : DRAW_SCHEDULE_RIO;
  const [tab, setTab] = useState<TabId>("resumo");
  const [position, setPosition] = useState(0);
  const [faixa, setFaixa] = useState<string>("all");
  const [windowSize, setWindowSize] = useState(100);
  const [days, setDays] = useState(0);
  const [topN, setTopN] = useState(10);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["rio-intel", location, position, faixa, windowSize, days, topN],
    queryFn: () => getRioIntel({ data: { location, position, faixa, window: windowSize, days, topN } }),
    staleTime: 5 * 60 * 1000,
  });

  const tens = data?.tens ?? [];
  const filteredTens = useMemo(() => {
    const q = search.replace(/\D/g, "");
    const base = [...tens].sort((a, b) => b.score - a.score);
    return q ? base.filter((t) => t.ten.includes(q) || t.group.includes(q)) : base;
  }, [tens, search]);

  const detail = selected ? tens.find((t) => t.ten === selected) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="dashboard-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase text-white">Inteligência {locationName(location)}</h3>
            <p className="text-xs text-white/50">
              Cálculos sobre o histórico auditado — {schedule.length} resultados por dia, 5 prêmios cada ({schedule.length * 5} números/dia).
              {isFetching && <span className="ml-2 text-primary">atualizando…</span>}
            </p>
          </div>
        </div>

        {/* filtros */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          <label className="text-xs text-white/50 uppercase font-bold">
            Resultado (faixa)
            <select
              value={faixa}
              onChange={(e) => setFaixa(e.target.value)}
              className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              <option value="all">Todos os resultados combinados</option>
              {schedule.map((s, i) => (
                <option key={s.timeType} value={s.timeType}>{`Resultado ${i + 1} — ${s.label}`}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50 uppercase font-bold">
            Prêmio
            <select
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50 uppercase font-bold">
            Janela (resultados)
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50 uppercase font-bold">
            Período
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50 uppercase font-bold">
            Dezenas no backtest
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              {[5, 10, 15, 20, 25].map((n) => (
                <option key={n} value={n}>{n} dezenas</option>
              ))}
            </select>
          </label>
          <div className="text-xs text-white/50 uppercase font-bold">
            Amostra
            <div className="mt-1 w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
              {data?.filters.sampleSize ?? 0} resultados · {data?.totals.prizes ?? 0} prêmios
            </div>
          </div>
        </div>
      </div>

      {/* botões de seção */}
      <IntelTabBar
        tabs={TABS.map((t) => ({
          id: t.id,
          label:
            t.id === "atrasadas" && data
              ? `Ranking completo de dezenas — amostra de ${data.filters.sampleSize} resultados`
              : t.label,
        }))}
        active={tab}
        onChange={setTab}
      />

      {isLoading && (
        <div className="dashboard-card p-10 flex items-center justify-center text-white/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculando inteligência…
        </div>
      )}

      {data && tab === "resumo" && (
        <div className="space-y-4">
          <Explain title="Como ler">
            O atraso é contado em <b>resultados confirmados</b> (nunca em dias), o índice de atraso é
            <b> atraso ÷ intervalo médio histórico</b> e o Índice de Relevância Histórica combina atraso (35%),
            frequência recente (30%), comportamento do grupo (20%), comportamento por posição (10%) e estabilidade (5%).
          </Explain>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CalendarDays, label: "Último resultado", value: data.summary.lastFaixa ?? "--", sub: data.summary.lastDate ?? "--" },
              { icon: Trophy, label: "Publicados hoje", value: `${data.summary.publishedToday}/${schedule.length}`, sub: `${data.summary.numbersToday} números analisados` },
              { icon: Timer, label: "Próximo resultado", value: data.summary.nextDraw?.label ?? "--", sub: data.summary.nextDraw?.timeValue ?? "--" },
              { icon: Flame, label: "Histórico", value: `${data.totals.historyContests}`, sub: data.summary.status },
            ].map((c) => (
              <div key={c.label} className="dashboard-card p-4">
                <c.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-[11px] uppercase text-white/40 font-bold">{c.label}</p>
                <p className="text-lg font-black text-white">{c.value}</p>
                <p className="text-xs text-white/50">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-card p-5">
            <h4 className="font-black uppercase text-white mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" /> Probabilidades teóricas
            </h4>
            <div className="grid gap-3 sm:grid-cols-4 text-sm">
              <div><p className="text-white/40 text-xs">Dezena / posição</p><p className="text-white font-bold">{num(data.probabilities.tenPerPosition, 2)}%</p></div>
              <div><p className="text-white/40 text-xs">Dezena em 5 prêmios</p><p className="text-white font-bold">{num(data.probabilities.tenAnyOfFive, 2)}%</p></div>
              <div><p className="text-white/40 text-xs">Grupo / posição</p><p className="text-white font-bold">{num(data.probabilities.groupPerPosition, 2)}%</p></div>
              <div><p className="text-white/40 text-xs">Grupo em 5 prêmios</p><p className="text-white font-bold">{num(data.probabilities.groupAnyOfFive, 2)}%</p></div>
            </div>
            <p className="text-xs text-white/40 mt-3">O atraso não aumenta a probabilidade teórica de nenhuma dezena.</p>
          </div>

          <div className="dashboard-card p-5 overflow-x-auto">
            <h4 className="font-black uppercase text-white mb-3">Frequência por posição do prêmio</h4>
            <div className="grid gap-3 sm:grid-cols-5 min-w-[520px]">
              {data.rankings.byPosition.map((p) => (
                <div key={p.position} className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-white/40 uppercase font-bold">{p.position}º prêmio</p>
                  <p className="text-[11px] text-white/40 mb-2">{p.total} sorteios</p>
                  {p.top.map((t) => (
                    <div key={t.ten} className="flex justify-between text-sm text-white/80">
                      <span className="font-bold">{t.ten}</span>
                      <span className="text-white/50">{t.count}x</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data && tab === "dia" && (
        <div className="space-y-4">
          <Explain title="Resultados do dia">
            Os seis resultados diários com os cinco prêmios, já convertidos em quatro dígitos, centena, dezena e grupo
            (zeros à esquerda preservados).
          </Explain>
          {data.todayResults.length === 0 && (
            <div className="dashboard-card p-6 text-white/50 text-sm">Nenhum resultado confirmado ainda.</div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {data.todayResults.map((r) => (
              <div key={`${r.date}-${r.timeType}`} className="dashboard-card p-4 overflow-x-auto">
                <p className="font-black uppercase text-white mb-2">{r.label} <span className="text-xs text-white/40">{r.date}</span></p>
                <table className="w-full text-sm min-w-[380px]">
                  <thead className="text-[11px] uppercase text-white/40">
                    <tr><th className="text-left">Prêmio</th><th className="text-left">Número</th><th>4 díg.</th><th>Centena</th><th>Dezena</th><th>Grupo</th></tr>
                  </thead>
                  <tbody>
                    {r.prizes.map((p) => (
                      <tr key={p.position} className="border-t border-white/5 text-white/80">
                        <td className="py-1">{p.position}º</td>
                        <td className="font-bold text-white">{p.full}</td>
                        <td className="text-center">{p.quatro}</td>
                        <td className="text-center">{p.centena}</td>
                        <td className="text-center font-bold text-primary">{p.dezena}</td>
                        <td className="text-center">{p.grupo} {getAnimalByGroup(p.grupo)?.name ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && (tab === "atrasadas" || tab === "puxadas") && (
        <div className="space-y-4">
          <Explain title={tab === "atrasadas" ? "Dezenas atrasadas" : "Dezenas puxadas"}>
            {tab === "atrasadas"
              ? "Atraso geral (resultados desde a última aparição), atraso por faixa (edições do mesmo horário), intervalo médio, maior atraso histórico e índice de atraso."
              : "Puxada = frequência histórica acima da esperada no período selecionado (esperada = prêmios analisados × 1%)."}
          </Explain>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar dezena ou grupo"
                className="bg-transparent border-b border-white/10 text-sm text-white outline-none py-1 flex-1"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead className="text-[11px] uppercase text-white/40">
                  <tr>
                    <th className="text-left py-2">Dezena</th>
                    <th>Grupo</th>
                    <th>Atraso geral</th>
                    <th>Atraso na faixa</th>
                    <th>Última</th>
                    <th>Interv. médio</th>
                    <th>Maior atraso</th>
                    <th>Índice atraso</th>
                    <th>Freq.</th>
                    <th>Freq. %</th>
                    <th>Esperada</th>
                    <th>Índice freq.</th>
                    <th>Tendência</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "atrasadas"
                    ? [...filteredTens].sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0))
                    : [...filteredTens].sort((a, b) => b.freqIndex - a.freqIndex)
                  ).map((t) => (
                    <tr
                      key={t.ten}
                      onClick={() => setSelected(t.ten === selected ? null : t.ten)}
                      className="border-t border-white/5 text-white/80 hover:bg-white/5 cursor-pointer text-center"
                    >
                      <td className="text-left py-1 font-black text-white">{t.ten}</td>
                      <td>{t.group}</td>
                      <td>{t.delay}</td>
                      <td>{faixa === "all" ? "--" : t.delayInFaixa[faixa] ?? "--"}</td>
                      <td className="text-white/50">{t.lastDate ?? "--"}</td>
                      <td>{num(t.avgInterval, 1)}</td>
                      <td>{t.maxDelay}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-lg border text-[11px] ${classColor(t.classification)}`}>
                          {num(t.delayIndex, 2)}
                        </span>
                      </td>
                      <td>{t.freqTotal}</td>
                      <td>{num(t.freqPct, 2)}%</td>
                      <td>{num(t.expected, 1)}</td>
                      <td>{num(t.freqIndex, 2)}</td>
                      <td className="text-white/60">{t.trend}</td>
                      <td className="font-bold text-primary">{num(t.score, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {detail && (
            <div className="dashboard-card p-5">
              <h4 className="font-black text-white uppercase mb-2">
                Dezena {detail.ten} — grupo {detail.group} {getAnimalByGroup(detail.group)?.name ?? ""}
              </h4>
              <div className="grid gap-3 sm:grid-cols-3 text-sm text-white/70">
                <p>Classificação: <b className="text-white">{detail.classification}</b></p>
                <p>Relevância: <b className="text-white">{detail.scoreLabel}</b></p>
                <p>Posições em que apareceu: <b className="text-white">{detail.positions.join(", ") || "--"}</b></p>
                <p>Componentes — A {detail.components.A} · R {detail.components.R} · G {detail.components.G} · P {detail.P} · E {detail.components.E}</p>
                <p>Atraso por faixa: {schedule.map((s) => `${s.timeType} ${detail.delayInFaixa[s.timeType] ?? "--"}`).join(" · ")}</p>
                <p>Frequência recente: <b className="text-white">{detail.freqRecent}</b></p>
              </div>
            </div>
          )}
        </div>
      )}

      {data && (tab === "grupos-atraso" || tab === "grupos-puxados") && (
        <div className="space-y-4">
          <Explain title={tab === "grupos-atraso" ? "Grupos atrasados" : "Grupos puxados"}>
            {tab === "grupos-atraso"
              ? "O atraso do grupo zera quando qualquer uma das suas quatro dezenas aparece."
              : "A frequência do grupo é a soma das ocorrências das suas quatro dezenas (esperada = prêmios × 4%)."}
          </Explain>
          <div className="dashboard-card p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead className="text-[11px] uppercase text-white/40">
                <tr>
                  <th className="text-left py-2">Grupo</th>
                  <th className="text-left">Dezenas</th>
                  <th>Atraso geral</th>
                  <th>Atraso na faixa</th>
                  <th>Interv. médio</th>
                  <th>Índice atraso</th>
                  <th>Maior atraso</th>
                  <th>Última</th>
                  <th>Freq.</th>
                  <th>Freq. %</th>
                  <th>Esperada</th>
                  <th>Dezena top</th>
                </tr>
              </thead>
              <tbody>
                {(tab === "grupos-atraso"
                  ? [...data.groups].sort((a, b) => (b.delayIndex ?? 0) - (a.delayIndex ?? 0))
                  : [...data.groups].sort((a, b) => b.freqIndex - a.freqIndex)
                ).map((g) => (
                  <tr key={g.group} className="border-t border-white/5 text-white/80 text-center">
                    <td className="text-left py-1 font-black text-white">
                      {g.group} {getAnimalByGroup(g.group)?.name ?? ""}
                    </td>
                    <td className="text-left text-white/50">{g.tens.join(" ")}</td>
                    <td>{g.delay}</td>
                    <td>{faixa === "all" ? "--" : g.delayInFaixa[faixa] ?? "--"}</td>
                    <td>{num(g.avgInterval, 1)}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] ${classColor(g.classification)}`}>
                        {num(g.delayIndex, 2)}
                      </span>
                    </td>
                    <td>{g.maxDelay}</td>
                    <td className="text-white/50">{g.lastDate ?? "--"}</td>
                    <td>{g.freqTotal}</td>
                    <td>{num(g.freqPct, 2)}%</td>
                    <td>{num(g.expected, 1)}</td>
                    <td className="font-bold text-primary">{g.topTen ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && tab === "possibilidades" && (
        <div className="space-y-4">
          <Explain title="Possibilidades estatísticas">
            Ranking pelo Índice de Relevância Histórica (0–100). Não é previsão nem garantia — apenas ordena o
            comportamento histórico das dezenas.
          </Explain>
          <div className="dashboard-card p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="text-[11px] uppercase text-white/40">
                <tr>
                  <th className="text-left py-2">#</th><th className="text-left">Dezena</th><th>Grupo</th>
                  <th>Score</th><th>Classificação</th><th>A</th><th>R</th><th>G</th><th>P</th><th>E</th>
                </tr>
              </thead>
              <tbody>
                {data.rankings.topScore.map((t, i) => (
                  <tr key={t.ten} className="border-t border-white/5 text-white/80 text-center">
                    <td className="text-left py-1 text-white/40">{i + 1}</td>
                    <td className="text-left font-black text-white">{t.ten}</td>
                    <td>{t.group} {getAnimalByGroup(t.group)?.name ?? ""}</td>
                    <td className="font-bold text-primary">{num(t.score, 1)}</td>
                    <td className="text-white/60">{t.scoreLabel}</td>
                    <td>{t.components.A}</td><td>{t.components.R}</td><td>{t.components.G}</td><td>{t.P}</td><td>{t.components.E}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dashboard-card p-4 overflow-x-auto">
            <h4 className="font-black uppercase text-white mb-2">Atraso elevado + grupo atrasado</h4>
            <div className="flex flex-wrap gap-2">
              {data.rankings.combined.length === 0 && <p className="text-white/50 text-sm">Nenhuma combinação no período.</p>}
              {data.rankings.combined.map((t) => (
                <span key={t.ten} className="px-3 py-1 rounded-xl border border-primary/40 bg-primary/10 text-sm text-white">
                  {t.ten} · G{t.group} · idx {num(t.delayIndex, 2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {data && tab === "backtest" && (
        <div className="space-y-4">
          <Explain title="Validação histórica (backtest)">
            Cada teste usa somente os resultados anteriores ao resultado avaliado — sem dados futuros — e compara o
            ranking com uma seleção aleatória do mesmo tamanho.
          </Explain>
          {!data.backtest && (
            <div className="dashboard-card p-6 text-white/50 text-sm">
              Amostra insuficiente para o backtest neste filtro (mínimo de 40 resultados).
            </div>
          )}
          {data.backtest && (
            <div className="dashboard-card p-5 grid gap-3 sm:grid-cols-3 text-sm">
              <div><p className="text-white/40 text-xs uppercase">Testes</p><p className="text-white font-black text-lg">{data.backtest.tested}</p></div>
              <div><p className="text-white/40 text-xs uppercase">Taxa de acerto (Score)</p><p className="text-white font-black text-lg">{num(data.backtest.rate, 1)}%</p></div>
              <div><p className="text-white/40 text-xs uppercase">Acaso</p><p className="text-white font-black text-lg">{num(data.backtest.randomRate, 1)}%</p></div>
              <div><p className="text-white/40 text-xs uppercase">Diferença do acaso</p><p className="text-white font-bold">{num(data.backtest.edge, 1)} p.p.</p></div>
              <div><p className="text-white/40 text-xs uppercase">IC 95%</p><p className="text-white font-bold">{num(data.backtest.ci95[0], 1)}% – {num(data.backtest.ci95[1], 1)}%</p></div>
              <div><p className="text-white/40 text-xs uppercase">Atrasadas / Puxadas</p><p className="text-white font-bold">{num(data.backtest.delayRate, 1)}% / {num(data.backtest.hotRate, 1)}%</p></div>
              <div className="sm:col-span-3">
                <p className="text-white/40 text-xs uppercase mb-1 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Acertos por posição</p>
                <p className="text-white/70">{data.backtest.positionHits.map((h, i) => `${i + 1}º: ${h}`).join(" · ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        Esta análise utiliza frequências, atrasos e padrões observados no histórico. Uma dezena ou grupo atrasado não
        fica obrigado a aparecer. Os indicadores estatísticos e o Índice de Relevância Histórica não garantem
        resultados futuros.
      </div>
    </div>
  );
}
