import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, Trophy, CalendarDays, Sparkles, Info, Bot, ShieldCheck, AlertTriangle } from "lucide-react";
import { IntelTabBar } from "@/components/IntelTabBar";
import { getMegaLatest, getMegaStats, getMegaHistory, getMegaRobotStatus } from "@/lib/mega.functions";
import {
  combinations,
  defaultFilters,
  gerarJogos,
  precoAposta,
  type GeneratorFilters,
  type GeneratorResult,
} from "@/lib/mega-generator";

const brl = (v: number | null | undefined) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 })
    : "—";

const dataBR = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function Ball({ n, muted }: { n: number; muted?: boolean }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_10px_-4px_rgba(0,0,0,0.8)] ${
        muted ? "bg-white/10 text-white/70" : "bg-emerald-500 text-black"
      }`}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

type TabId = "resultado" | "frequencia" | "atrasos" | "padroes" | "gerador" | "historico";

export function MegaSenaPanel() {
  const [tab, setTab] = useState<TabId>("resultado");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const latestQuery = useQuery({
    queryKey: ["mega-latest"],
    queryFn: () => getMegaLatest(),
  });
  const statsQuery = useQuery({
    queryKey: ["mega-stats"],
    queryFn: () => getMegaStats({ data: { limit: 4000 } }),
  });

  const latest = latestQuery.data?.latest ?? null;
  const stats = statsQuery.data;

  async function sincronizar() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/public/sync-megasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backfill: true, batch: 150 }),
      });
      const json: any = await res.json();
      if (json.success) {
        setSyncMsg(
          `Atualizado: ${json.synced} concursos gravados · ${json.total} de ${json.ultimoConcurso} no histórico.`,
        );
        latestQuery.refetch();
        statsQuery.refetch();
      } else {
        setSyncMsg(`Não foi possível atualizar agora: ${json.error ?? "fonte oficial indisponível"}.`);
      }
    } catch (e: any) {
      setSyncMsg(`Falha na atualização: ${String(e?.message ?? e)}`);
    } finally {
      setSyncing(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "resultado", label: "Resultado oficial" },
    { id: "proximos", label: "Próximos sorteios" },
    { id: "frequencia", label: "Frequência" },
    { id: "atrasos", label: "Atrasos" },
    { id: "padroes", label: "Padrões" },
    { id: "gerador", label: "Gerador de jogos" },
    { id: "historico", label: "Histórico" },
  ];


  return (
    <div className="space-y-6">
      <div className="dashboard-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-emerald-400">Mega-Sena</h2>
            <p className="text-white/50 text-sm mt-1">
              Resultados oficiais da CAIXA · sorteios às terças, quintas e sábados.
            </p>
          </div>
          <button
            onClick={sincronizar}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Atualizando..." : "Atualizar resultados"}
          </button>
        </div>
        {syncMsg && <p className="mt-3 text-xs text-white/60 break-words">{syncMsg}</p>}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.04] p-3 text-[11px] leading-relaxed text-white/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          Os dados descrevem o que já aconteceu. Cada combinação de seis dezenas tem sempre a mesma chance
          (1 em 50.063.860). Nenhuma análise aqui prevê o próximo concurso nem garante prêmio.
        </p>
      </div>

      <RoboMega
        onSynced={() => {
          latestQuery.refetch();
          statsQuery.refetch();
        }}
      />

      <IntelTabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "resultado" && <ResultadoTab latest={latest} recent={latestQuery.data?.recent ?? []} />}
      {tab === "frequencia" && <FrequenciaTab stats={stats} />}
      {tab === "atrasos" && <AtrasosTab stats={stats} />}
      {tab === "padroes" && <PadroesTab stats={stats} />}
      {tab === "gerador" && <GeradorTab stats={stats} ultimo={latest?.dezenas ?? []} />}
      {tab === "historico" && <HistoricoTab />}
    </div>
  );
}

const dataHoraBR = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" });
};

/** Robô de auditoria: confere, em tempo real, o banco contra a fonte oficial da CAIXA. */
function RoboMega({ onSynced }: { onSynced: () => void }) {
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const corrigindo = useRef(false);

  const statusQuery = useQuery({
    queryKey: ["mega-robot"],
    queryFn: () => getMegaRobotStatus(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const st = statusQuery.data;

  useEffect(() => {
    if (!st || corrigindo.current) return;
    if (st.erroFonte || st.atrasoConcursos === null || st.atrasoConcursos <= 0) return;
    corrigindo.current = true;
    setAutoMsg("Concurso novo encontrado na CAIXA — o robô está importando automaticamente...");
    fetch("/api/public/sync-megasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backfill: true, batch: 50 }),
    })
      .then((r) => r.json())
      .then((j: any) => {
        setAutoMsg(
          j?.success
            ? `Robô importou ${j.synced} concurso(s) da fonte oficial.`
            : `O robô não conseguiu importar agora: ${j?.error ?? "fonte indisponível"}.`,
        );
        statusQuery.refetch();
        onSynced();
      })
      .catch((e) => setAutoMsg(`O robô não conseguiu importar agora: ${String(e?.message ?? e)}`))
      .finally(() => {
        corrigindo.current = false;
      });
  }, [st?.atrasoConcursos, st?.erroFonte]);

  const ok = !!st?.emDia;
  const tone = st?.erroFonte ? "text-amber-400" : ok ? "text-emerald-400" : "text-sky-400";

  return (
    <div className="dashboard-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/80">
          <Bot className={`h-5 w-5 ${tone}`} /> Robô de verificação — Mega-Sena
        </h3>
        <button
          onClick={() => statusQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/70 hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${statusQuery.isFetching ? "animate-spin" : ""}`} /> Verificar agora
        </button>
      </div>

      {!st ? (
        <p className="mt-4 text-sm text-white/50">Consultando a fonte oficial...</p>
      ) : (
        <>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.04] p-3">
            {st.erroFonte ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
            )}
            <p className={`text-sm font-bold ${tone}`}>
              {st.erroFonte
                ? `Fonte oficial indisponível no momento (${st.erroFonte}). Os números exibidos são os últimos confirmados.`
                : ok
                  ? "Resultados conferidos e iguais aos da fonte oficial da CAIXA."
                  : `A fonte oficial já publicou ${st.atrasoConcursos} concurso(s) à frente — importando automaticamente.`}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info2 label="Origem dos resultados" value="CAIXA Econômica Federal — Portal Loterias (API oficial)" />
            <Info2
              label="Último concurso na fonte oficial"
              value={st.oficial ? `${st.oficial.concurso} · ${dataBR(st.oficial.data)}` : "indisponível"}
            />
            <Info2
              label="Último concurso nesta plataforma"
              value={st.banco ? `${st.banco.concurso} · ${dataBR(st.banco.data)}` : "nenhum"}
            />
            <Info2
              label="Próximo sorteio"
              value={
                st.oficial?.proximoConcurso
                  ? `${st.oficial.proximoConcurso} · ${dataBR(st.oficial.dataProximo)}`
                  : "a confirmar"
              }
            />
            <Info2 label="Última atualização dos dados" value={dataHoraBR(st.banco?.atualizadoEm)} />
            <Info2 label="Última verificação do robô" value={dataHoraBR(st.checadoEm)} />
            <Info2 label="Concursos guardados" value={`${st.total.toLocaleString("pt-BR")} sorteios oficiais`} />
            <Info2 label="Frequência da verificação" value="Automática a cada 1 minuto" />
          </div>

          <p className="mt-3 break-all text-[11px] text-white/40">Endereço da fonte: {st.fonte}</p>
          {autoMsg && <p className="mt-2 text-[11px] text-white/60">{autoMsg}</p>}
        </>
      )}
    </div>
  );
}

function ResultadoTab({ latest, recent }: { latest: any; recent: any[] }) {
  if (!latest) {
    return (
      <div className="dashboard-card p-8 text-center text-white/60">
        Nenhum resultado carregado ainda. Use “Atualizar resultados” para buscar na fonte oficial da CAIXA.
      </div>
    );
  }
  const rateio: any[] = Array.isArray(latest.rateio) ? latest.rateio : [];
  return (
    <div className="space-y-4">
      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Concurso</p>
            <p className="text-3xl font-black tabular-nums text-white">{latest.concurso}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Sorteio realizado</p>
            <p className="text-lg font-bold text-white">{dataBR(latest.data_apuracao)}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {latest.dezenas.map((n: number) => (
            <Ball key={n} n={n} />
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info2 label="Situação" value={latest.acumulou ? "Acumulou!" : "Houve ganhador"} highlight={latest.acumulou} />
          <Info2 label="Acumulado próximo concurso" value={brl(latest.valor_acumulado)} />
          <Info2 label="Estimativa próximo concurso" value={brl(latest.valor_estimado_proximo)} />
          <Info2
            label="Próximo concurso"
            value={`${latest.proximo_concurso ?? "—"} · ${dataBR(latest.data_proximo_concurso)}`}
          />
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/70">
          <Trophy className="h-4 w-4 text-emerald-400" /> Premiação
        </h3>
        <div className="space-y-2">
          {rateio.length === 0 && <p className="text-sm text-white/50">Premiação não informada para este concurso.</p>}
          {rateio.map((r) => (
            <div
              key={r.faixa}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-4 py-3"
            >
              <span className="text-sm font-bold text-white/80">{r.descricaoFaixa}</span>
              <span className="text-sm text-white/60">{r.numeroDeGanhadores} ganhador(es)</span>
              <span className="text-sm font-black text-emerald-400">{brl(r.valorPremio)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/70">
          <CalendarDays className="h-4 w-4 text-emerald-400" /> Concursos recentes
        </h3>
        <div className="space-y-3">
          {recent.slice(1).map((d) => (
            <div key={d.concurso} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-xs font-black tabular-nums text-white/50">
                {d.concurso} · {dataBR(d.data_apuracao)}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {d.dezenas.map((n: number) => (
                  <span
                    key={n}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black tabular-nums text-white/80"
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info2({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1 text-sm font-bold break-words ${highlight ? "text-emerald-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dashboard-card p-5">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-white/70">{title}</h3>
      {children}
    </div>
  );
}

function FrequenciaTab({ stats }: { stats: any }) {
  if (!stats) return <Loading />;
  const data = stats.numbers.map((n: any) => ({ name: String(n.numero).padStart(2, "0"), value: n.count }));
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        Base: {stats.total} concursos oficiais ({dataBR(stats.firstDate)} a {dataBR(stats.lastDate)}).
      </p>
      <ChartCard title="Quantas vezes cada dezena já foi sorteada">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} interval={0} angle={-90} height={40} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
            <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_: any, i: number) => (
                <Cell key={i} fill="#34d399" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Frequência por grupo de dezenas (01-10, 11-20, ...)">
        <SimpleBars rows={grupoRows(stats, "count")} color="#f59e0b" />
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <NumberList title="Mais sorteadas" rows={stats.hot} metric={(r: any) => `${r.count}x · ${r.percent.toFixed(1)}%`} />
        <NumberList title="Menos sorteadas" rows={stats.cold} metric={(r: any) => `${r.count}x · ${r.percent.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function AtrasosTab({ stats }: { stats: any }) {
  if (!stats) return <Loading />;
  const data = [...stats.numbers]
    .sort((a: any, b: any) => b.delay - a.delay)
    .slice(0, 20)
    .map((n: any) => ({ name: String(n.numero).padStart(2, "0"), value: n.delay }));
  return (
    <div className="space-y-4">
      <ChartCard title="Concursos sem sair — 20 dezenas mais atrasadas">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
            <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Atraso médio por grupo de dezenas (em concursos)">
        <SimpleBars rows={grupoRows(stats, "delay")} color="#a78bfa" />
      </ChartCard>
      <ChartCard title="Atraso atual de todas as 60 dezenas">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.numbers.map((n: any) => ({ name: String(n.numero).padStart(2, "0"), value: n.delay }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} interval={0} angle={-90} height={40} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
            <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="dashboard-card p-5">
        <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-white/70">Ranking completo de atraso</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...stats.numbers]
            .sort((a: any, b: any) => b.delay - a.delay)
            .map((n: any) => (
              <div key={n.numero} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center gap-3">
                  <Ball n={n.numero} muted />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{n.delay} concursos sem sair</p>
                    <p className="text-[11px] text-white/50 break-words">
                      Último sorteio em {dataBR(n.lastDate)} · intervalo médio {n.avgInterval.toFixed(1)} concursos
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function PadroesTab({ stats }: { stats: any }) {
  if (!stats) return <Loading />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Pares e ímpares por concurso">
        <SimpleBars rows={stats.parity.map((p: any) => ({ name: p.label, value: p.count }))} color="#34d399" />
      </ChartCard>
      <ChartCard title="Distribuição por faixa de dezenas">
        <SimpleBars rows={stats.faixas.map((f: any) => ({ name: f.label, value: f.count }))} color="#f59e0b" />
      </ChartCard>
      <ChartCard title={`Soma das seis dezenas (média ${stats.sums.avg.toFixed(0)}, de ${stats.sums.min} a ${stats.sums.max})`}>
        <SimpleBars rows={stats.sums.buckets.map((b: any) => ({ name: b.label, value: b.count }))} color="#60a5fa" />
      </ChartCard>
      <ChartCard title="Dezenas repetidas do concurso anterior">
        <SimpleBars rows={stats.repetition.map((r: any) => ({ name: `${r.repetidas}`, value: r.count }))} color="#a78bfa" />
      </ChartCard>
      <ChartCard title="Sequências consecutivas por concurso">
        <SimpleBars rows={stats.consecutivas.map((r: any) => ({ name: `${r.pares}`, value: r.count }))} color="#fb7185" />
      </ChartCard>
      <ChartCard title="Quantidade de números primos por concurso">
        <SimpleBars rows={stats.primos.map((r: any) => ({ name: `${r.primos}`, value: r.count }))} color="#22d3ee" />
      </ChartCard>
      <div className="dashboard-card p-5 lg:col-span-2">
        <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-white/70">Duplas que mais saíram juntas</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stats.duplas.map((d: any) => (
            <div key={`${d.a}-${d.b}`} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3">
              <Ball n={d.a} muted />
              <Ball n={d.b} muted />
              <span className="ml-auto text-sm font-black text-emerald-400">{d.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Soma (count) ou média (delay) por grupo de dez dezenas, direto do histórico real. */
function grupoRows(stats: any, key: "count" | "delay") {
  return Array.from({ length: 6 }, (_, g) => {
    const ini = g * 10 + 1;
    const fim = ini + 9;
    const nums = stats.numbers.filter((n: any) => n.numero >= ini && n.numero <= fim);
    const soma = nums.reduce((acc: number, n: any) => acc + n[key], 0);
    return {
      name: `${String(ini).padStart(2, "0")}-${fim}`,
      value: key === "delay" ? Math.round((soma / (nums.length || 1)) * 10) / 10 : soma,
    };
  });
}

function SimpleBars({ rows, color }: { rows: { name: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={0} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
        <Tooltip contentStyle={{ background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)" }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NumberList({ title, rows, metric }: { title: string; rows: any[]; metric: (r: any) => string }) {
  return (
    <div className="dashboard-card p-5">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-white/70">{title}</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.numero} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
            <Ball n={r.numero} muted />
            <span className="text-sm text-white/70 break-words">{metric(r)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeradorTab({ stats, ultimo }: { stats: any; ultimo: number[] }) {
  const [filters, setFilters] = useState<GeneratorFilters>(defaultFilters);
  const [result, setResult] = useState<GeneratorResult | null>(null);

  const quentes = useMemo(() => (stats?.hot ?? []).map((n: any) => n.numero), [stats]);
  const atrasadas = useMemo(() => (stats?.delayed ?? []).map((n: any) => n.numero), [stats]);

  const custoUnitario = precoAposta(filters.dezenasPorJogo);
  const combos = combinations(filters.dezenasPorJogo, 6);

  const set = (patch: Partial<GeneratorFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <div className="dashboard-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/70">
          <Sparkles className="h-4 w-4 text-emerald-400" /> Filtros do gerador
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Dezenas por jogo (6 a 20)">
            <input
              type="number"
              min={6}
              max={20}
              value={filters.dezenasPorJogo}
              onChange={(e) => set({ dezenasPorJogo: Number(e.target.value) })}
              className="input-mega"
            />
          </Field>
          <Field label="Quantidade de jogos">
            <input
              type="number"
              min={1}
              max={50}
              value={filters.quantidadeJogos}
              onChange={(e) => set({ quantidadeJogos: Number(e.target.value) })}
              className="input-mega"
            />
          </Field>
          <Field label="Modo">
            <select
              value={filters.modo}
              onChange={(e) => set({ modo: e.target.value as GeneratorFilters["modo"] })}
              className="input-mega"
            >
              <option value="equilibrado">Equilibrado</option>
              <option value="aleatorio">Aleatório</option>
              <option value="quentes">Mais sorteadas</option>
              <option value="atrasadas">Mais atrasadas</option>
            </select>
          </Field>
          <Field label="Mínimo de pares">
            <input type="number" min={0} max={6} value={filters.minPares} onChange={(e) => set({ minPares: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Máximo de pares">
            <input type="number" min={0} max={20} value={filters.maxPares} onChange={(e) => set({ maxPares: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Máximo de consecutivas">
            <input type="number" min={1} max={6} value={filters.maxConsecutivas} onChange={(e) => set({ maxConsecutivas: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Soma mínima">
            <input type="number" value={filters.somaMin} onChange={(e) => set({ somaMin: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Soma máxima">
            <input type="number" value={filters.somaMax} onChange={(e) => set({ somaMax: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Máx. repetidas do último concurso">
            <input type="number" min={0} max={6} value={filters.maxRepeticaoUltimo} onChange={(e) => set({ maxRepeticaoUltimo: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Máx. dezenas em comum entre jogos">
            <input type="number" min={0} max={20} value={filters.maxSobreposicao} onChange={(e) => set({ maxSobreposicao: Number(e.target.value) })} className="input-mega" />
          </Field>
          <Field label="Dezenas obrigatórias (ex.: 5, 13, 42)">
            <input
              type="text"
              value={filters.obrigatorias.join(", ")}
              onChange={(e) => set({ obrigatorias: parseNums(e.target.value) })}
              className="input-mega"
            />
          </Field>
          <Field label="Dezenas excluídas">
            <input
              type="text"
              value={filters.excluidas.join(", ")}
              onChange={(e) => set({ excluidas: parseNums(e.target.value) })}
              className="input-mega"
            />
          </Field>
          <Field label="Orçamento máximo (R$ — opcional)">
            <input
              type="number"
              min={0}
              value={filters.orcamento ?? ""}
              onChange={(e) => set({ orcamento: e.target.value === "" ? null : Number(e.target.value) })}
              className="input-mega"
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Info2 label="Combinações por jogo" value={combos.toLocaleString("pt-BR")} />
          <Info2 label="Custo de cada jogo" value={brl(custoUnitario)} />
          <Info2 label="Chance da sena por jogo" value={`1 em ${Math.round(50063860 / combos).toLocaleString("pt-BR")}`} />
        </div>

        <button
          onClick={() => setResult(gerarJogos(filters, { quentes, atrasadas, ultimoConcurso: ultimo }))}
          className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-black hover:bg-emerald-400"
        >
          Gerar jogos
        </button>
      </div>

      {result && (
        <div className="dashboard-card p-5">
          {result.erro ? (
            <p className="rounded-xl bg-red-500/10 p-4 text-sm font-bold text-red-300 break-words">{result.erro}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info2 label="Método" value={result.metodo} />
                <Info2 label="Custo total" value={brl(result.custo)} />
                <Info2
                  label="Probabilidade da sena no lote"
                  value={`1 em ${Math.round(1 / result.probabilidadeSena).toLocaleString("pt-BR")}`}
                />
                <Info2 label="Índice de diversidade" value={`${(result.diversidade * 100).toFixed(1)}%`} />
              </div>
              <div className="mt-5 space-y-3">
                {result.jogos.map((jogo, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.04] p-3">
                    <span className="text-xs font-black text-white/40">Jogo {i + 1}</span>
                    {jogo.map((n) => (
                      <Ball key={n} n={n} />
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    result.jogos.map((j) => j.map((n) => String(n).padStart(2, "0")).join(" ")).join("\n"),
                  )
                }
                className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/80 hover:bg-white/20"
              >
                Copiar jogos
              </button>
              <p className="mt-4 text-[11px] leading-relaxed text-white/50">
                Jogar mais combinações aumenta a cobertura por custo, não a capacidade de prever o sorteio. Jogue com
                responsabilidade e dentro do seu orçamento.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function parseNums(v: string): number[] {
  return Array.from(
    new Set(
      v
        .split(/[^0-9]+/)
        .map((s) => Number(s))
        .filter((n) => n >= 1 && n <= 60),
    ),
  ).sort((a, b) => a - b);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
      {children}
    </label>
  );
}

function HistoricoTab() {
  const [page, setPage] = useState(0);
  const [concurso, setConcurso] = useState("");
  const [date, setDate] = useState("");

  const query = useQuery({
    queryKey: ["mega-history", page, concurso, date],
    queryFn: () =>
      getMegaHistory({
        data: {
          page,
          pageSize: 20,
          ...(concurso ? { concurso: Number(concurso) } : {}),
          ...(date ? { date } : {}),
        },
      }),
  });

  const rows = query.data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / 20));

  return (
    <div className="space-y-4">
      <div className="dashboard-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pesquisar por concurso">
            <input
              type="number"
              value={concurso}
              onChange={(e) => {
                setConcurso(e.target.value);
                setPage(0);
              }}
              className="input-mega"
              placeholder="Ex.: 3060"
            />
          </Field>
          <Field label="Pesquisar por data do sorteio">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(0);
              }}
              className="input-mega"
            />
          </Field>
        </div>
      </div>

      <div className="dashboard-card p-5">
        {query.isLoading && <Loading />}
        <div className="space-y-3">
          {rows.map((r: any) => (
            <div key={r.concurso} className="rounded-xl bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-black text-white">
                  Concurso {r.concurso} · {dataBR(r.data_apuracao)}
                </span>
                <span className={`text-xs font-bold ${r.acumulou ? "text-amber-400" : "text-emerald-400"}`}>
                  {r.acumulou ? "Acumulou" : `${r.ganhadores_sena ?? 0} ganhador(es) · ${brl(r.premio_sena)}`}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.dezenas.map((n: number) => (
                  <Ball key={n} n={n} muted />
                ))}
              </div>
            </div>
          ))}
          {!query.isLoading && rows.length === 0 && (
            <p className="text-sm text-white/50">Nenhum concurso encontrado com esses filtros.</p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase text-white/80 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-white/50">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase text-white/80 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="dashboard-card p-8 text-center text-white/50">Carregando dados oficiais...</div>;
}
