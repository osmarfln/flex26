import { getAnimalByTen } from "@/lib/animals";

interface PrizeAnimalRowProps {
  position: number;
  result?: string | null;
  compact?: boolean;
}

interface AnimalBadgeProps {
  result?: string | null;
  ten?: string | null;
  compact?: boolean;
}

export function AnimalBadge({ result, ten, compact = false, showIcon = true }: AnimalBadgeProps & { showIcon?: boolean }) {
  const digits = (ten ?? result ?? "").replace(/\D/g, "");
  const animal = digits.length >= 2 ? getAnimalByTen(digits.slice(-2)) : undefined;

  return (
    <span
      className={`prize-animal-badge ${compact ? "prize-animal-badge--compact" : ""} ${!showIcon ? "prize-animal-badge--name-only" : ""}`}
      title={`${animal?.name ?? "Bicho não identificado"} — grupo ${animal?.id ?? "--"}`}
      aria-label={`${animal?.name ?? "Bicho não identificado"}, grupo ${animal?.id ?? "não identificado"}`}
    >
      {showIcon && <span aria-hidden="true" className="prize-animal-icon">{animal?.icon ?? "✦"}</span>}
      <span className="prize-animal-name">{animal?.name ?? "Grupo"}</span>
    </span>
  );
}

export function PrizeAnimalRow({ position, result, compact = false }: PrizeAnimalRowProps) {
  const normalized = result?.replace(/\D/g, "") ?? "";
  const isWaiting = normalized.length < 2;
  const animal = isWaiting ? undefined : getAnimalByTen(normalized.slice(-2));

  return (
    <div className={`prize-animal-row ${compact ? "prize-animal-row--compact" : ""}`}>
      <span className="prize-animal-position">{position}º</span>
      {isWaiting ? (
        <span className="prize-animal-waiting">Aguardando...</span>
      ) : (
        <>
          <span className="prize-animal-number">{normalized.padStart(4, "0")}</span>
          <AnimalBadge result={normalized} compact showIcon={false} />
        </>
      )}
    </div>
  );
}