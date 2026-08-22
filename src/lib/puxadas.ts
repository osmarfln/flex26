/**
 * Tabela tradicional de PUXADAS do Jogo do Bicho.
 * Cada grupo "puxa" (tende a chamar) outros grupos no sorteio seguinte.
 */
import { ANIMAL_GROUPS } from "@/lib/animals";

const NAME_TO_ID: Record<string, string> = Object.fromEntries(
  ANIMAL_GROUPS.map((a) => [
    a.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ç/g, "c")
      .replace(/-/g, " ")
      .trim(),
    a.id
  ]),
);

const RAW: Record<string, string[]> = {
  "01": ["Vaca", "Águia", "Galo", "Pavão", "Peru"],
  "02": ["Coelho", "Avestruz", "Galo", "Pavão", "Peru"],
  "03": ["Cavalo", "Elefante", "Touro", "Veado", "Coelho", "Cobra"],
  "04": ["Cabra", "Elefante", "Gato", "Leão", "Cachorro", "Galo"],
  "05": ["Galo", "Gato", "Camelo", "Macaco", "Porco", "Pavão"],
  "06": ["Carneiro", "Macaco", "Elefante", "Touro", "Tigre", "Urso"],
  "07": ["Cabra", "Coelho", "Vaca"],
  "08": ["Cachorro", "Elefante", "Urso"],
  "09": ["Jacaré", "Porco", "Burro", "Gato"],
  "10": ["Carneiro", "Águia", "Burro"],
  "11": ["Burro", "Cabra", "Touro"],
  "12": ["Cabra", "Urso", "Tigre", "Leão", "Burro"],
  "13": ["Cachorro", "Avestruz", "Águia", "Pavão", "Peru"],
  "14": ["Cachorro", "Leão", "Tigre", "Cobra"],
  "15": ["Cobra", "Porco", "Borboleta", "Macaco"],
  "16": ["Elefante", "Gato", "Tigre", "Urso"],
  "17": ["Cachorro", "Cabra", "Peru", "Jacaré"],
  "18": ["Cobra", "Peru", "Jacaré", "Cachorro"],
  "19": ["Avestruz", "Águia", "Galo", "Peru"],
  "20": ["Avestruz", "Águia", "Galo", "Pavão", "Veado"],
  "21": ["Vaca", "Burro", "Cabra"],
  "22": ["Gato", "Leão", "Cabra"],
  "23": ["Leão", "Elefante", "Camelo", "Cabra"],
  "24": ["Peru", "Burro", "Cabra"],
  "25": ["Touro", "Avestruz", "Carneiro"],
};

export interface PuxadaEntry {
  groupId: string;
  name: string;
  icon: string;
  puxa: { id: string; name: string; icon: string }[];
}

export const PUXADAS: PuxadaEntry[] = ANIMAL_GROUPS.map((a) => ({
  groupId: a.id,
  name: a.name,
  icon: a.icon,
  puxa: (RAW[a.id] ?? []).map((n) => {
    const cleanName = n.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ç/g, "c")
      .replace(/-/g, " ")
      .trim();
    const id = NAME_TO_ID[cleanName] ?? "";
    return { 
      id, 
      name: n, 
      icon: id ? ANIMAL_GROUPS.find((g) => g.id === id)!.icon : "❓" 
    };
  }),
}));

export const PUXADAS_MAP: Record<string, string[]> = Object.fromEntries(
  PUXADAS.map((p) => [p.groupId, p.puxa.map((x) => x.id).filter(Boolean)]),
);
