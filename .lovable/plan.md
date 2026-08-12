# Plan: Add Futuristic Welcome Clock Card

Add a modern, futuristic welcome card to the homepage that displays a real-time clock (seconds, day, month, year) on the right side of the welcome section.

## Proposed Changes

### Frontend Improvements

#### 1. Create Digital Clock Component
- Implement a new component `src/components/DigitalClock.tsx`.
- Design: Glassmorphism effect, futuristic typography, and subtle animations.
- Functionality: Display real-time hour, minutes, seconds, and the full date (day, month, year) in Portuguese.
- Animation: Use `framer-motion` for a smooth entry and subtle pulsating effects.

#### 2. Integrate into Homepage
- Update `src/routes/index.tsx`.
- Replace the empty placeholder column (`lg:col-span-4`) in the welcome section with the new `DigitalClock` component.
- Ensure responsive behavior: stacked on mobile, side-by-side on desktop.

## Technical Details

- **Typography**: Use a mono-spaced or tech-focused font for the numbers to enhance the futuristic feel.
- **Styling**: Tailwind CSS with OKLCH colors, `backdrop-blur`, and `bg-white/5`.
- **Date Handling**: Use `date-fns` for consistent Portuguese formatting.
- **State**: Use a `useEffect` interval (1s) to keep the clock accurate.
