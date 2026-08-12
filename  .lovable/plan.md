# Plan: Modernize Homepage Design

Modernize the **Flex Gerenciamentos** homepage to match the professional dark dashboard aesthetic from the user-provided reference image.

## Proposed Changes

### Visual & Design System
- Update global CSS to include dark-mode colors as default or primary theme.
- Define specific palette: Deep Navy Background (#0B0F19), Golden Accents (#EAB308), and Slate/Zinc borders.
- Transition from the "terracotta/cream" roastery theme to a "high-tech data dashboard" theme.

### Homepage (`src/routes/index.tsx`)
- **Header**: Replace existing navigation with a more compact dashboard-style header (Logo, Navigation Links, Update Button).
- **Hero & Search**: A cleaner section for selecting results by bank, date, and time.
- **Results Layout**:
  - Main Grid: 6 detailed cards for PTM, PT, PTV, PTN, Corujinha.
  - Sidebar: "Últimos Resultados" list.
- **Data Tables**: Add the "Grupos do Jogo" grid (01 Avestruz to 25 Vaca) with icons.
- **Analytics**: Add a "Resultados por horário" bar chart component.

### Data & Components
- Add animal icons (SVG or Lucide equivalents) to match the reference.
- Enhance the `base44` mock to provide more structured data for the group table and history.

## Technical Details
- Use `framer-motion` for subtle entry animations.
- Use `shadcn/ui` components (Card, Badge, Button, Input) styled with custom tokens.
- Implement responsive design matching the grid structure in the screenshot.
