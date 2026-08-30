import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from "lucide-react";
import { getFederalSyncStatus, getFederalExport } from "@/lib/federal.functions";
import { drawLabel } from "@/lib/draw-order";
import { toast } from "sonner";

function formatBrasilia(iso?: string | null) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDateBR(iso?: string | null) {
  if (!iso) return "--";
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}

function download(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Painel exclusivo da LOTERIA FEDERAL: status da sincronização, quantidade de
 * concursos importados, possíveis falhas e exportação (CSV/PDF) do histórico
 * e da análise completa do ano de 2026.
 */
export function FederalSyncPanel() {
  const [exporting, setExporting] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["federal-sync-status"],
    queryFn: () => getFederalSyncStatus(),
    refetchInterval: 60_000,
  });

  const s = statusQuery.data;

  const loadExport = () => getFederalExport({ data: { year: 2026 } });

  const exportCSV = async () => {
    setExporting("csv");
    try {
      const data = await loadExport();
      const lines: string[] = [];
      lines.push("LOTERIA FEDERAL - HISTORICO 2026");
      lines.push("Data;Concurso;Horario;1o;2o;3o;4o;5o;Animal;Grupo");
      for (const h of data.history) {
        lines.push(
          [
            formatDateBR(h.date),
            drawLabel("federal", h.time_type, h.date),
            h.time_value,
            ...Array.from({ length: 5 }, (_, i) => h.prizes[i] ?? ""),
            h.animal,
            h.animal_group,
          ].join(";"),
        );
      }
      lines.push("");
      lines.push("ANALISE COMPLETA - DEZENAS (frequencia e atraso em concursos)");
      lines.push("Dezena;Frequencia;Atraso");
      for (const t of data.tens) lines.push(`${t.ten};${t.count};${t.delay}`);
      lines.push("");
      lines.push("ANALISE COMPLETA - GRUPOS");
      lines.push("Grupo;Frequencia;Atraso");
      for (const g of data.groups) lines.push(`${g.group};${g.count};${g.delay}`);

      download(
        "loteria-federal-2026.csv",
        "\uFEFF" + lines.join("\n"),
        "text/csv;charset=utf-8;",
      );
      toast.success("CSV da Loteria Federal exportado");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao exportar CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const data = await loadExport();
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("LOTERIA FEDERAL — Histórico e Análise 2026", 14, 16);
      doc.setFontSize(10);
      doc.text(
        `Gerado em ${formatBrasilia(data.generatedAt)} • ${data.history.length} concursos`,
        14,
        23,
      );

      autoTable(doc, {
        startY: 28,
        head: [["Data", "Concurso", "1º", "2º", "3º", "4º", "5º", "Animal"]],
        body: data.history.map((h) => [
          formatDateBR(h.date),
          drawLabel("federal", h.time_type, h.date),
          h.prizes[0] ?? "",
          h.prizes[1] ?? "",
          h.prizes[2] ?? "",
          h.prizes[3] ?? "",
          h.prizes[4] ?? "",
          h.animal,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [190, 30, 45] },
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Análise — Dezenas (frequência e atraso)", 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [["Dezena", "Frequência", "Atraso"]],
        body: data.tens.map((t) => [t.ten, String(t.count), String(t.delay)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [190, 30, 45] },
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Análise — Grupos (frequência e atraso)", 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [["Grupo", "Frequência", "Atraso"]],
        body: data.groups.map((g) => [g.group, String(g.count), String(g.delay)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [190, 30, 45] },
      });

      doc.save("loteria-federal-2026.pdf");
      toast.success("PDF da Loteria Federal exportado");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao exportar PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="border-primary/30 bg-white/[0.03] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wider">
          <Trophy className="w-5 h-5 text-primary" />
          Sincronização — Loteria Federal
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => statusQuery.refetch()}
            disabled={statusQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={exportCSV} disabled={exporting !== null}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            {exporting === "csv" ? "Gerando..." : "CSV 2026"}
          </Button>
          <Button size="sm" variant="secondary" onClick={exportPDF} disabled={exporting !== null}>
            <FileText className="w-4 h-4 mr-1" />
            {exporting === "pdf" ? "Gerando..." : "PDF 2026"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {statusQuery.isLoading || !s ? (
          <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Última atualização</p>
                <p className="text-sm font-black text-white mt-1">{formatBrasilia(s.lastImportedAt)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Concursos importados</p>
                <p className="text-2xl font-black text-primary mt-1">{s.total}</p>
                <p className="text-[10px] text-white/40">{s.total2026} em 2026</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Último concurso</p>
                <p className="text-sm font-black text-white mt-1">{formatDateBR(s.lastDrawDate)}</p>
                <p className="text-[10px] text-white/40">
                  {drawLabel("federal", s.latest?.time_type, s.lastDrawDate)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Possíveis falhas (2026)</p>
                <p
                  className={`text-2xl font-black mt-1 ${s.failures > 0 ? "text-primary" : "text-emerald-400"}`}
                >
                  {s.failures}
                </p>
              </div>
            </div>

            {s.latest && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
                    Último resultado publicado
                  </p>
                  <Badge className="bg-emerald-500/15 text-emerald-400">
                    {formatDateBR(s.latest.date)} • {drawLabel("federal", s.latest.time_type, s.latest.date)}
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-black/40 border border-white/10 p-2 text-center">
                      <p className="text-[10px] text-white/40">{i + 1}º</p>
                      <p className="text-base font-black text-white tabular-nums">
                        {s.latest!.results?.[i] ?? "----"}
                      </p>
                    </div>
                  ))}
                </div>
                {s.latest.animal && (
                  <p className="text-xs text-white/60 mt-2">
                    Grupo {s.latest.animal_group} — {s.latest.animal}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">
                Concursos por ano
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(s.byYear)
                  .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                  .map(([year, count]) => (
                    <Badge key={year} variant="outline" className="border-white/15 text-white/70">
                      {year}: {count}
                    </Badge>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                {s.failures > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-primary" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                Datas oficiais de 2026 sem resultado
              </p>
              {s.failures === 0 ? (
                <p className="text-sm text-emerald-400">
                  Nenhuma falha: todos os concursos de 2026 estão importados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {s.missing2026.map((d) => (
                    <Badge key={d} className="bg-primary/15 text-primary">
                      {formatDateBR(d)}
                    </Badge>
                  ))}
                </div>
              )}
              {s.lastError && (
                <p className="text-xs text-primary mt-2">Último erro do robô: {s.lastError}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Execuções recentes do robô
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {s.logs.length === 0 && (
                  <p className="text-sm text-white/40">Nenhuma execução registrada ainda.</p>
                )}
                {s.logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2 text-white/60">
                      <Clock className="w-3 h-3" />
                      {formatBrasilia(log.started_at)}
                    </span>
                    <span className="text-white/70">{log.records_synced ?? 0} registros</span>
                    <Badge
                      className={
                        log.status === "error"
                          ? "bg-primary/15 text-primary"
                          : "bg-emerald-500/15 text-emerald-400"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
