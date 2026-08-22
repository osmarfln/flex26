import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Users, History, Activity, BarChart3 } from "lucide-react";
import { BackNav } from "@/components/layout/BackNav";

import { UserMenu } from "@/components/layout/UserMenu";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navItems = [
  { to: "/", label: "Início", icon: Users, adminOnly: false },
  { to: "/historico", label: "Histórico", icon: History, adminOnly: false },
  { to: "/robot-status", label: "Robô", icon: Activity, adminOnly: true },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3, adminOnly: false },
] as const;

interface SiteHeaderProps {
  subtitle?: string;
}

export function SiteHeader({ subtitle = "VEM COM A GENTE" }: SiteHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useIsAdmin();


  return (
    <header className="border-b border-white/5 bg-background/60 backdrop-blur-2xl sticky top-0 z-50 overflow-x-hidden">
      <div className="container mx-auto px-4 py-2 md:h-20 flex flex-col md:flex-row md:items-center gap-2 md:gap-8 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:items-center md:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <BackNav />
            <Link to="/" className="flex min-w-0 flex-col group">
              <span className="flex min-w-0 items-center gap-2">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-primary fill-primary" />
                <span className="truncate text-base sm:text-xl md:text-2xl font-black tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                  Flex Gerenciador
                </span>
              </span>
              <span className="truncate text-[9px] md:text-[10px] text-primary/60 font-bold tracking-[0.2em] -mt-1 ml-7 md:ml-8">
                {subtitle}
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:hidden">
            <UserMenu />
          </div>
        </div>

        <nav className="-mx-3 flex items-center gap-3 overflow-x-auto no-scrollbar px-3 pb-1 md:mx-0 md:gap-8 md:px-0 md:pb-0">
          {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 flex items-center gap-1.5 md:gap-2 whitespace-nowrap text-xs md:text-sm font-bold transition-colors ${
                  active
                    ? "text-foreground border-b-2 border-primary pb-1"
                    : "text-white/40 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex ml-auto items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
