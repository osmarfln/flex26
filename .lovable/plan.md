# Plan - Analysis Filters and Search Logic Optimization

The goal is to update the search and filter behavior in the Analysis section (`/estatisticas`) so that data is only displayed when a search is active or specific filters are applied, maintaining a "zero state" otherwise. Additionally, the data range will be restricted to a single date by default.

## Proposed Changes

### 1. `AnaliseFiltros.tsx`

- **Initial State Update**: Change the initial `term` state to trigger the "zero state".
- **Conditional Rendering**: Wrap the summary cards and data charts in a condition that checks if `query.kind !== 'none'` or if specific filters (like `times`) are active.
- **Date Range Restriction**: Update the default `start` and `end` dates to both point to the current date (today) or the most recent date with results, instead of a 14-day range.
- **Search-Driven Visibility**:
    - Ensure that summary metrics (Sorteios, Dias com dados, etc.) only show values when a search term is active.
    - The "Resultados filtrados" table should only appear when a search is performed.
    - If no search is active, show a friendly "Digite um termo para iniciar a análise" message.

### 2. `estatisticas.tsx` (Route)

- **Layout Adjustments**: Ensure the `AnaliseFiltros` component integrates smoothly with the new visibility logic.
- **Header Info**: Maintain the sync timestamp display but ensure it reflects that the specific analysis view is filtered.

## Technical Details

- Modify `AnaliseFiltros` component to handle `hits.length === 0` vs `query.kind === 'none'`.
- Use a `showData` boolean derived from `query.kind !== 'none' || times.length > 0`.
- Update `summarize` logic to return zeros or nulls if `showData` is false to satisfy the "zerados" requirement.

## Verification Plan

### Manual Verification
1. Navigate to the Statistics page.
2. Confirm that by default, the analysis charts and tables are empty/zeroed.
3. Type a dezena (e.g., "45") in the search box.
4. Verify that charts and tables populate with data for the selected date.
5. Change the date and verify results update.
6. Clear the search and verify the UI returns to the "zeroed" state.
