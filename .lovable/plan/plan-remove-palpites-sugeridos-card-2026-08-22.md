# Plan: Remove "Palpites Sugeridos" Card

The user wants to remove the "Palpites Sugeridos" (Suggested Tips) card/section from the statistics page for both Rio and Capital lotteries. This includes removing the tab trigger and the corresponding content section.

## Proposed Changes

### Statistics Page (`src/routes/_authenticated/estatisticas.tsx`)

- Remove the `palpites` option from the `activeTab` state definition.
- Remove the `palpitesSugeridos` `useMemo` calculation.
- Remove the "Palpites Sugeridos" `Card` from the tools grid (tab triggers).
- Remove the `activeTab === 'palpites'` conditional rendering block from the dynamic content section.
- Adjust the tools grid layout if necessary (currently using `grid-cols-5` on large screens, removing one card might leave a gap or I can adjust to `grid-cols-4` or let it auto-flow).

## Technical Details

- **File**: `src/routes/_authenticated/estatisticas.tsx`
- **Tab State**: Line 62.
- **Memoized Data**: Lines 260-273.
- **Tab Trigger**: Lines 552-560.
- **Tab Content**: Lines 675-706.

## User Review Required

> [!IMPORTANT]
> This will completely remove the "Palpites Sugeridos" feature from the statistics page as requested.
