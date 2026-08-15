import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

interface AcessoRestritoProps {
  area: string;
}

/** Bloqueio padrão para abas liberadas apenas ao administrador. */
export function AcessoRestrito({ area }: AcessoRestritoProps) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center">
      <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
      <h2 className="text-xl font-black uppercase tracking-tight">Acesso restrito</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A área <span className="font-bold text-foreground">{area}</span> é liberada apenas para o
        administrador da plataforma.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
