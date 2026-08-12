/**
 * Tabela oficial do Jogo do Bicho — 25 grupos.
 * Cada grupo possui 4 dezenas. Grupo 25 (Vaca) inclui a dezena 00.
 * Fonte: tabela tradicional utilizada nas extrações do Rio de Janeiro.
 */
export interface AnimalGroup {
  id: string;
  number: number;
  name: string;
  icon: string;
  dezenas: string[];
}

const RAW: Array<[number, string, string]> = [
  [1, "Avestruz", "🦩"],
  [2, "Águia", "🦅"],
  [3, "Burro", "🫏"],
  [4, "Borboleta", "🦋"],
  [5, "Cachorro", "🐕"],
  [6, "Cabra", "🐐"],
  [7, "Carneiro", "🐏"],
  [8, "Camelo", "🐫"],
  [9, "Cobra", "🐍"],
  [10, "Coelho", "🐰"],
  [11, "Cavalo", "🐎"],
  [12, "Elefante", "🐘"],
  [13, "Galo", "🐓"],
  [14, "Gato", "🐈"],
  [15, "Jacaré", "🐊"],
  [16, "Leão", "🦁"],
  [17, "Macaco", "🐒"],
  [18, "Porco", "🐖"],
  [19, "Pavão", "🦚"],
  [20, "Peru", "🦃"],
  [21, "Touro", "🐂"],
  [22, "Tigre", "🐅"],
  [23, "Urso", "🐻"],
  [24, "Veado", "🦌"],
  [25, "Vaca", "🐄"],
];

export const ANIMAL_GROUPS: AnimalGroup[] = RAW.map(([n, name, icon]) => {
  const base = (n - 1) * 4 + 1;
  const dezenas = [base, base + 1, base + 2, base + 3].map((d) =>
    String(d === 100 ? 0 : d).padStart(2, "0"),
  );
  return { id: String(n).padStart(2, "0"), number: n, name, icon, dezenas };
});

export const ANIMAL_GROUPS_MAP: Record<string, AnimalGroup> = Object.fromEntries(
  ANIMAL_GROUPS.map((a) => [a.id, a]),
);

/** Mapa simples id -> emoji (compatível com usos legados). */
export const ANIMAL_ICONS: Record<string, string> = Object.fromEntries(
  ANIMAL_GROUPS.map((a) => [a.id, a.icon]),
);

/** Retorna o id do grupo (01..25) a partir de uma dezena "00".."99". */
export function getGroupFromTen(ten: string): string {
  const n = parseInt(ten, 10);
  if (Number.isNaN(n)) return "";
  const value = n === 0 ? 100 : n;
  return String(Math.floor((value - 1) / 4) + 1).padStart(2, "0");
}

/** Retorna o bicho correspondente a uma dezena. */
export function getAnimalByTen(ten: string): AnimalGroup | undefined {
  return ANIMAL_GROUPS_MAP[getGroupFromTen(ten)];
}

/** Retorna o bicho pelo id do grupo. */
export function getAnimalByGroup(groupId?: string | null): AnimalGroup | undefined {
  if (!groupId) return undefined;
  return ANIMAL_GROUPS_MAP[String(groupId).padStart(2, "0")];
}
