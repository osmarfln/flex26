# Plan - Fix "Próximo Resultado" and Rio Schedule

The user reported that the "Próximo Resultado" card on the homepage is showing incorrect information (hardcoded) and the Rio lottery schedule needs adjustment (COR at 21:30 instead of 21:20).

## User Review Required

> [!IMPORTANT]
> The next draw will be calculated based on the current Brasília time (UTC-3). If the current day's draws are finished, it will show the first draw of the next day.

- **Rio Schedule**: 09:20 (PPT), 11:20 (PTM), 14:20 (PT), 16:20 (PTV), 18:20 (PTN), 21:30 (COR).
- **Logic**: The card will dynamically update based on the system time.

## Proposed Changes

### Logic & Constants

#### `src/lib/draw-order.ts`
- Update `DRAW_SCHEDULE_RIO` to change `COR` time from `21:20` to `21:30`.
- Implement `getNextDraw(location: 'rio' | 'capital')` function:
    - Get current Brasília time.
    - Compare with the schedule for the selected location.
    - Return the first schedule item whose `timeValue` is greater than current time.
    - If all today's draws are past, return the first draw of the next day.

### UI Components

#### `src/routes/_authenticated/index.tsx`
- Import `getNextDraw` from `@/lib/draw-order`.
- Use `useMemo` to calculate the next draw dynamically based on the current location and a periodic timer (or just on render if acceptable for now).
- Update the "Próximo Resultado" card to display the dynamic `timeValue`, `timeType`, and `date`.

## Technical Details
- Use `Intl.DateTimeFormat` or manual UTC offset to ensure Brasília time (UTC-3) is used regardless of the server/client local timezone.
- Ensure the "Data" field in the card correctly shows tomorrow's date if the next draw is for the next day.
