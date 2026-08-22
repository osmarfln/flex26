# Plan: Remove "IA" labels from Lottery Statistics

The user wants to remove "IA" references from the statistics page, specifically in the context of "Puxadas" (draw trends) and "Palpites" (tips), replacing them with cleaner labels or just the names themselves. This aligns with the previous step of removing IA-based calculations and focusing on traditional lottery logic.

## Proposed Changes

### 1. Statistics Page (`src/routes/_authenticated/estatisticas.tsx`)
- Change the card title "Puxadas IA" to just "Puxadas".
- Change the card title "Palpites IA" to "Palpites Sugeridos" or just "Palpites".
- Update the internal variable `palpitesIA` to `palpitesSugeridos` for consistency (optional but good for maintainability).
- Remove "(IA)" suffix from the "Combinação Sugerida" label.
- Update the descriptive text for these cards to remove "inteligente" or "robo ai" if they imply IA intervention where it has been removed.

### 2. Puxadas Panel (`src/components/PuxadasPanel.tsx`)
- Ensure all headers and labels only refer to "Puxadas" or "Puxada Tradicional". (Verified in previous turn, but will double-check).

## Technical Details
- **File**: `src/routes/_authenticated/estatisticas.tsx`
  - Line 547: `<h3 className="text-xl font-black italic uppercase">Puxadas IA</h3>` -> `Puxadas`
  - Line 558: `<h3 className="text-xl font-black italic uppercase mb-2">Palpites IA</h3>` -> `Palpites Sugeridos`
  - Line 1358 (approx): `<h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Combinação Sugerida (IA)</h4>` -> `Combinação Sugerida`
- The `SiteHeader` subtitle and robot monitoring labels will be reviewed to ensure they match the "sem intervenção humana" (no human intervention) branding requested previously without over-emphasizing "IA".
