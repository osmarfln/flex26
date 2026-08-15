import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

interface BackNavProps {
  /** Esconde os botões quando já estamos na homepage */
  hideOnHome?: boolean;
  className?: string;
}

/**
 * Navegação padrão da plataforma:
 * - "Voltar": volta UMA página no histórico (voltando sucessivamente até a home)
 * - "Início": vai direto para a homepage
 */
export function BackNav({ hideOnHome = true, className = "" }: BackNavProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  if (isHome && hideOnHome) return null;

  return (
    <div className={`flex shrink-0 items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleBack}
        aria-label="Voltar uma página"
        title="Voltar uma página"
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-white/50 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white">
          Voltar
        </span>
      </button>
      <Link
        to="/"
        aria-label="Ir para a página inicial"
        title="Ir para a página inicial"
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
      >
        <Home className="w-4 h-4 text-white/50 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white">
          Início
        </span>
      </Link>
    </div>
  );
}
