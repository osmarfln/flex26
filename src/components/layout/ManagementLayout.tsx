import React, { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { createPageUrl } from "@/utils";
import {
  BrainCircuit,
  Menu,
  LogOut,
  User as UserIcon,
  Gem,
  Settings,
  Archive,
  Crown,
  Award,
  Sparkles,
  Maximize,
  Minimize,
  Clock,
  ShieldOff,
  MessageSquare,
  RefreshCw,
  Star,
  Search,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import { BackNav } from "@/components/layout/BackNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const navigationItems = [
  {
    title: "Análises",
    url: createPageUrl("AnalisesIA"),
    icon: BrainCircuit,
    color: "from-cyan-500 to-teal-500",
    bgColor: "bg-gradient-to-r from-cyan-500/10 to-teal-500/10",
    textColor: "text-cyan-600"
  },
  {
    title: "Palpite do Dia",
    url: createPageUrl("PalpiteDoDia"),
    icon: Sparkles,
    color: "from-red-400 to-red-600",
    bgColor: "bg-gradient-to-r from-red-400/10 to-red-600/10",
    textColor: "text-red-600"
  },
  {
    title: "Arquivo",
    url: createPageUrl("ArquivoResultados"),
    icon: Archive,
    color: "from-blue-500 to-sky-500",
    bgColor: "bg-gradient-to-r from-blue-500/10 to-sky-500/10",
    textColor: "text-blue-600"
  },
  {
    title: "Calendário",
    url: createPageUrl("CalendarioResultados"),
    icon: CalendarDays,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-gradient-to-r from-blue-500/10 to-indigo-600/10",
    textColor: "text-blue-600"
  },
  {
    title: "Gerenciar Jogos",
    url: "/jogos",
    icon: Star,
    color: "from-purple-500 to-indigo-600",
    bgColor: "bg-gradient-to-r from-purple-500/10 to-indigo-600/10",
    textColor: "text-purple-600",
    diamanteOnly: true
  },
  {
    title: "Cadastrar",
    url: createPageUrl("CadastroManual"),
    icon: ClipboardList,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-600/10",
    textColor: "text-blue-600",
    diamanteOnly: true
  },
  {
    title: "Admin",
    url: createPageUrl("Admin"),
    icon: Settings,
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-gradient-to-r from-emerald-500/10 to-green-600/10",
    textColor: "text-emerald-600",
    diamanteOnly: true
  },
];

const getNivelInfo = (nivel: string) => {
  switch(nivel) {
    case 'diamante':
      return {
        nome: 'Diamante',
        icon: Crown,
        color: 'from-cyan-400 via-blue-500 to-purple-600',
        bgColor: 'bg-gradient-to-r from-cyan-100 to-purple-100 dark:from-cyan-900/30 dark:to-purple-900/30',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        description: 'Admin Master - Acesso Total'
      };
    case 'ouro':
      return {
        nome: 'Ouro',
        icon: Award,
        color: 'from-red-400 via-red-500 to-red-600',
        bgColor: 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30',
        textColor: 'text-red-600 dark:text-red-400',
        description: 'Intermediário'
      };
    case 'prata':
    default:
      return {
        nome: 'Prata',
        icon: Sparkles,
        color: 'from-gray-300 via-gray-400 to-gray-500',
        bgColor: 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30',
        textColor: 'text-gray-600 dark:text-gray-400',
        description: 'Acesso Simples'
      };
  }
};

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

export default function ManagementLayout({ children, currentPageName }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const pageTitle = currentPageName === "Home"
      ? "Flex Gerenciamentos - Palpites & Estatísticas"
      : `${currentPageName} | Flex Gerenciamentos`;
    document.title = pageTitle;
  }, [currentPageName]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const authUser = data.user;
        if (!authUser) return;

        const [{ data: profile }, { data: adminFlag }] = await Promise.all([
          supabase.from("profiles").select("display_name, email, status").eq("id", authUser.id).maybeSingle(),
          supabase.rpc("has_role", { _user_id: authUser.id, _role: "admin" }),
        ]);

        setUser({
          email: profile?.email ?? authUser.email,
          nome: profile?.display_name ?? authUser.email,
          status: profile?.status ?? "pending",
          nivel: adminFlag ? "diamante" : "prata",
          isAdmin: Boolean(adminFlag),
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const nivelInfo = user ? getNivelInfo(user.nivel) : getNivelInfo('prata');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigationItems.filter(i => !i.diamanteOnly || user?.isAdmin).map((item) => (
                    <Link
                      key={item.url}
                      to={item.url as any}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <BackNav hideOnHome={false} />
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Flex Gerenciamentos</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navigationItems.filter(i => !i.diamanteOnly || user?.isAdmin).map((item) => (
              <Link
                key={item.url}
                to={item.url as any}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleFullscreenToggle}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.nome ?? "Minha Conta"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes">Configuração</Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Área Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentPageName}</h1>
              <p className="text-muted-foreground">Bem-vindo ao seu painel de gerenciamento.</p>
            </div>
            {user && (
              <Badge className={`bg-gradient-to-r ${nivelInfo.color} text-white px-3 py-1`}>
                <nivelInfo.icon className="mr-2 h-4 w-4" />
                {nivelInfo.nome}
              </Badge>
            )}
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
