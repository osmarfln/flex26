import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renderiza a resposta do robô em markdown organizado:
 * tabelas com cabeçalho fixo, listas, títulos e destaques.
 */
export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => (
            <h3 className="mt-4 mb-2 text-sm font-black uppercase tracking-wide text-primary" {...p} />
          ),
          h2: (p) => (
            <h3 className="mt-4 mb-2 text-sm font-black uppercase tracking-wide text-primary" {...p} />
          ),
          h3: (p) => (
            <h4 className="mt-3 mb-1.5 text-xs font-black uppercase tracking-widest text-foreground/70" {...p} />
          ),
          p: (p) => <p className="mb-2 last:mb-0" {...p} />,
          strong: (p) => <strong className="font-black text-foreground" {...p} />,
          ul: (p) => <ul className="mb-2 list-disc space-y-1 pl-4 marker:text-primary" {...p} />,
          ol: (p) => <ol className="mb-2 list-decimal space-y-1 pl-4 marker:text-primary" {...p} />,
          hr: () => <hr className="my-3 border-border" />,
          a: (p) => <a className="text-primary underline underline-offset-2" {...p} />,
          code: (p) => (
            <code className="rounded-md bg-foreground/10 px-1.5 py-0.5 font-mono text-[11px]" {...p} />
          ),
          blockquote: (p) => (
            <blockquote className="my-2 rounded-xl border-l-2 border-primary/60 bg-foreground/[0.04] px-3 py-2" {...p} />
          ),
          table: (p) => (
            <div className="my-3 w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-xs" {...p} />
            </div>
          ),
          thead: (p) => <thead className="bg-foreground/[0.07]" {...p} />,
          th: (p) => (
            <th
              className="whitespace-nowrap border-b border-border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/70"
              {...p}
            />
          ),
          tbody: (p) => <tbody {...p} />,
          tr: (p) => <tr className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.04]" {...p} />,
          td: (p) => <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold tabular-nums" {...p} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
