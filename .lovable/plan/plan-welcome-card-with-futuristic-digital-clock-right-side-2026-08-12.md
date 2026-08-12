# Plan: Welcome Card with Futuristic Digital Clock (Right Side)

## Goal
Add a welcome card on the homepage's right column containing a modern, futuristic digital clock that displays seconds, day, month, and year — updating every second.

## Current State
- `src/routes/index.tsx` has a welcome section grid (`lg:grid-cols-12`).
  - Left column: `lg:col-span-8` with greeting, heading, and search controls.
  - Right column: `lg:col-span-4` is currently an **empty placeholder** (`<div className="lg:col-span-4" />`, line 241).
- `src/components/DigitalClock.tsx` does **not** exist (it was removed in a previous edit).
- The page already maintains a `currentTime` state updating every second (lines 76-84), so the data source for the clock exists.
- Design tokens: premium dark dashboard — graphite/navy background, gold (`--primary`) accents, glassmorphism cards (`bg-card`), `rounded-3xl` corners.

## What to Build

### 1. New component: `src/components/DigitalClock.tsx`
A self-contained, client-only welcome clock card. It will:
- Accept no required props (uses its own internal 1-second timer via `useEffect`).
- Display a futuristic digital clock with:
  - Large monospace **time** (HH:MM:SS) with a pulsing colon separator and seconds.
  - Full **date**: weekday, day, month, year (pt-BR, e.g. "Quarta-feira, 12 de Agosto de 2026").
  - A "Bem-vindo" welcome header with a subtle gold icon (Sparkles), matching the existing greeting aesthetic.
- Futuristic styling using **semantic tokens only** (no hardcoded colors):
  - `bg-card` glassmorphism base, `border border-white/10`, `rounded-3xl`, `backdrop-blur-2xl`.
  - Gold accent gradient ring/glow using `text-primary` and `bg-primary/10`.
  - Monospace font (`font-mono`) for the digits, `tabular-nums` to prevent width jitter.
  - Subtle motion (framer-motion fade-in) to match surrounding cards.
- Fully responsive: scales down gracefully on mobile (right column stacks below left under `lg`).

### 2. Wire it into the homepage
- Replace the empty `<div className="lg:col-span-4" />` on line 241 with `<DigitalClock />` (imported from `@/components/DigitalClock`).
- Keep all other layout and content untouched.

## Out of Scope
- No changes to other routes, the data layer, or backend.
- No removal of existing homepage content.
- No changes to text/copy elsewhere on the page.

## Validation
- Run the dev build/typecheck to confirm no errors.
- Verify the clock renders in the right column on desktop and stacks on mobile via a Playwright screenshot.
