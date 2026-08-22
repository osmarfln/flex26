# Plan - Fix "Tendência de Atraso Médio" Chart Visibility

The "Tendência de Atraso Médio" chart in the "Ranking Geral" tab is not appearing correctly (showing as a black area) because it is squished within a 12-column grid without an explicit column span, resulting in a width of only 32px. Recharts fails to render paths when the container dimensions are insufficient.

## User Review Required

> [!IMPORTANT]
> The fix involves adjusting the layout properties of the chart container to ensure it occupies the full available width.

## Proposed Changes

### Frontend Layout

#### `src/routes/_authenticated/estatisticas.tsx`
- Add `lg:col-span-12` to the `Card` component wrapping the "Tendência de Atraso Médio" chart (around line 910).
- Update the gradient ID from `colorAvg` to `colorTrend` to prevent potential clashes with other charts using generic IDs.
- Ensure the `ResponsiveContainer` and its parent have proper minimum dimensions.

## Technical Details
- **Grid Layout Fix:** In a `lg:grid-cols-12` container, elements without a span default to `col-span-1`. By adding `lg:col-span-12`, the chart card will correctly span the entire width of the statistics section.
- **Gradient ID Safety:** Standardizing unique IDs for SVG gradients prevents rendering bugs where one chart's gradient definition overrides another's.

## Verification Plan

### Automated Tests
- Run a Playwright script to:
  1. Navigate to the `/estatisticas` page.
  2. Switch to the "Ranking Geral" tab.
  3. Verify the `ResponsiveContainer` for the trend chart has a width greater than 100px.
  4. Confirm the presence of the `.recharts-area` path in the DOM.
  5. Capture a screenshot to visually confirm the chart is rendered.
