import { useEffect, useRef } from "react";

export interface IntelTab<T extends string = string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  tabs: IntelTab<T>[];
  active: T;
  onChange: (id: T) => void;
}

/**
 * Barra de abas compartilhada dos painéis de inteligência.
 * - Indicador de aba ativa bem visível (barra inferior vermelha + brilho).
 * - Foco automático: ao trocar, a aba ativa rola para o centro da tela.
 * - Otimizada para celular: rolagem horizontal fina, botões compactos.
 */
export function IntelTabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const btn = buttonRefs.current[active];
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              buttonRefs.current[t.id] = el;
            }}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative shrink-0 snap-center whitespace-nowrap rounded-t-lg rounded-b-none border-b-2 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wide transition-all ${
              isActive
                ? "border-primary bg-primary/15 text-primary shadow-[0_-4px_18px_-6px_var(--primary)]"
                : "border-transparent bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            {t.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-[2px] h-[3px] rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
