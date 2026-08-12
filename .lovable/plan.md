# Plan: Full Backend for Flex Gerenciador

Implement a robust backend with Lovable Cloud for Rio lottery results, including real-time sync, historical data scraping, and a dedicated history UI.

## User Review Required

> [!IMPORTANT]
> The historical sync from `soresultados.info` for "all years" may take significant time to process. I will implement the infrastructure to support this, but the initial sync will be triggered in chunks to avoid timeouts.

## Proposed Changes

### Database Schema
- Create `public.lottery_results` table to store Rio lottery data.
- Enable RLS and set policies for public read access and service-role write access.
- Add indexes for optimized searching by date and draw type.

### API & Sync Logic
- **Server Route**: Create `src/routes/api/public/sync-results.ts` to handle:
  - Real-time updates via webhook/cron.
  - Historical sync for specific date ranges.
- **Server Functions**: Create `src/lib/lottery.functions.ts` for:
  - Querying results with filters (day, month, year).
  - Calculating real-time statistics (delayed groups, frequent tens) from live data.
- **API Client**: Update `src/api/base44Client.ts` to bridge to the new server functions.

### UI Implementation
- **History Page**: Create `src/routes/historico.tsx` with a searchable grid of results.
- **Search Component**: Implement date pickers and filters for history.
- **Homepage Integration**: Update the landing page to fetch data from the real database.

## Technical Details
- **Scraping**: Use a server-side fetch to parse HTML from `soresultados.info` (Rio results only).
- **Automation**: Configure `pg_cron` to trigger the sync route every 10 minutes.
- **Security**: Use `apikey` header validation for the sync route.
- **History**: Implement a "Sync History" button in the admin portal to trigger historical imports.

## Next Steps
1. Apply database migration for schema and RLS.
2. Implement the server-side sync logic.
3. Create the history UI and search functionality.
4. Integrate the homepage with the real data source.
