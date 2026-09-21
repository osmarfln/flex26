import { useState } from "react";
import { BookOpen, Calculator, Download, ExternalLink, FileText, Info, Layers3 } from "lucide-react";
import { ANIMAL_GROUPS } from "@/lib/animals";
import { IntelTabBar, type IntelTab } from "@/components/IntelTabBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apostilaAsset from "@/assets/apostila-jogo-do-bicho.pdf.asset.json";
import guiaAsset from "@/assets/guia-jogo-do-bicho.pdf.asset.json";

type GuideTab = "fundamentos" | "grupos" | "metodos" | "documentos";

const tabs: IntelTab<GuideTab>[] = [
  { id: "fundamentos", label: "Como interpretar" },
  { id: "grupos", label: "Tabela dos 25 grupos" },
  { id: "metodos", label: "Métodos tradicionais" },
  { id: "documentos", label: "Documentos completos" },
];

const numberParts = [
  { title: "Milhar", example: "7 9 9 5", copy: "Os quatro algarismos do prêmio." },
  { title: "Centena", example: "9 9 5", copy: "Os três últimos algarismos." },
  { title: "Dezena", example: "9 5", copy: "Os dois últimos algarismos, de 00 a 99." },
  { title: "Grupo", example: "24", copy: "A dezena 95 pertence ao grupo 24 — Veado." },
];

const traditionalMethods = [
  {
    title: "Cruz do Dia",
    copy: "Parte do número do dia e cria sequências por soma e cruzamento. Na plataforma, esse método permanece separado dos indicadores históricos.",
  },
  {
    title: "Sequências de grupos",
    copy: "Organiza os 25 grupos em cinco famílias: 01/06/11/16/21, 02/07/12/17/22 e assim sucessivamente.",
  },
  {
    title: "Puxadas tradicionais",
    copy: "São associações populares entre bichos. A área Puxadas compara essas referências com a frequência realmente observada no histórico.",
  },
  {
    title: "Atraso e frequência",
    copy: "Atraso conta concursos desde a última ocorrência. Frequência conta aparições dentro da amostra selecionada. Nenhum dos dois garante o próximo resultado.",
  },
];

export function GuiaLogisticaPanel() {
  const [active, setActive] = useState<GuideTab>("fundamentos");

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black uppercase sm:text-2xl">Informações e logística tradicional</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Guia resumido dos dois documentos enviados, com a leitura dos números e a relação oficial dos grupos.
          </p>
        </div>
      </div>

      <Alert className="border-primary/25 bg-primary/5">
        <Info className="size-4 text-primary" />
        <AlertTitle>Material educativo</AlertTitle>
        <AlertDescription className="leading-relaxed text-muted-foreground">
          Os métodos descritos nos PDFs são referências tradicionais. Eles não comprovam vantagem matemática, não garantem acertos e não alteram os cálculos baseados nos resultados reais da plataforma.
        </AlertDescription>
      </Alert>

      <IntelTabBar tabs={tabs} active={active} onChange={setActive} />

      {active === "fundamentos" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {numberParts.map((item) => (
              <Card key={item.title} className="min-w-0 border-border/70 bg-card/70">
                <CardHeader className="space-y-2 p-4 pb-2">
                  <CardTitle className="text-xs font-black uppercase text-muted-foreground">{item.title}</CardTitle>
                  <p className="break-words font-mono text-2xl font-black text-foreground">{item.example}</p>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-sm leading-relaxed text-muted-foreground">{item.copy}</CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-base uppercase">
                <Calculator className="size-5 text-primary" />
                Como o resultado vira grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2 text-sm leading-relaxed text-muted-foreground sm:p-5 sm:pt-2">
              <p>Use os dois últimos algarismos do prêmio. O exemplo <strong className="text-foreground">9795</strong> termina em <strong className="text-foreground">95</strong>.</p>
              <p>A dezena 95 está no intervalo 93–96, portanto corresponde ao <strong className="text-foreground">Grupo 24 — Veado</strong>.</p>
              <p>A dezena 00 fecha a tabela no <strong className="text-foreground">Grupo 25 — Vaca</strong>, junto com 97, 98 e 99.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {active === "grupos" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ANIMAL_GROUPS.map((animal) => (
            <Card key={animal.id} className="min-w-0 border-border/70 bg-card/70">
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-2xl" aria-hidden="true">{animal.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black uppercase">{animal.name}</p>
                    <Badge variant="outline" className="shrink-0 tabular-nums">{animal.id}</Badge>
                  </div>
                  <p className="mt-1 break-words font-mono text-xs font-bold text-muted-foreground">{animal.dezenas.join(" · ")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {active === "metodos" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {traditionalMethods.map((method, index) => (
            <Card key={method.title} className="min-w-0 border-border/70 bg-card/70">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-black text-secondary-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-sm font-black uppercase">{method.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{method.copy}</p>
              </CardContent>
            </Card>
          ))}
          <Alert className="border-emerald-500/25 bg-emerald-500/5 md:col-span-2">
            <Layers3 className="size-4 text-emerald-400" />
            <AlertTitle>Como a plataforma usa essas referências</AlertTitle>
            <AlertDescription className="leading-relaxed text-muted-foreground">
              As referências tradicionais são apenas contexto. Rankings, atrasos, frequências e puxadas exibidos nas demais abas são recalculados com resultados atuais e históricos de cada loteria, sem misturar Rio, Capital &amp; LCAP e Federal.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {active === "documentos" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              title: "Apostila sobre o Jogo do Bicho",
              description: "História, tabela dos grupos, modalidades e técnicas tradicionais reunidas no material enviado.",
              href: apostilaAsset.url,
            },
            {
              title: "Guia: Aprenda a ganhar no Jogo de Bicho",
              description: "Relação dos 25 grupos, leitura dos prêmios, modalidades e métodos como Cruz do Dia e sequências.",
              href: guiaAsset.url,
            },
          ].map((document) => (
            <Card key={document.title} className="min-w-0 border-border/70 bg-card/70">
              <CardContent className="flex h-full flex-col p-4 sm:p-5">
                <FileText className="mb-4 size-8 text-primary" />
                <h3 className="break-words text-base font-black uppercase">{document.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{document.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <a href={document.href} target="_blank" rel="noreferrer">
                      <ExternalLink /> Abrir PDF
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={document.href} download>
                      <Download /> Baixar
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}