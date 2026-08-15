import { useEffect, useState } from "react";

/** Evita mismatch de hidratação em rotas client-only: só renderiza após montar. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
