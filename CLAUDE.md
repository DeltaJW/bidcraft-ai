# BidCraft AI

## What This Is
SaaS web application for janitorial contractors to calculate labor hours from industry production rates, build fully burdened labor rates, and generate professional branded quotes/proposals.

**Owner:** Justin Wilson (personal IP — NOT PORTCO, NOT GovCon AI)

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (with @tailwindcss/vite plugin)
- Framer Motion for animations
- Lucide React for icons
- IBM Plex Sans / IBM Plex Mono fonts
- Path aliases: `@/` maps to `src/`

## Project Structure
```
src/
  types/index.ts          — TypeScript interfaces
  data/
    defaultRates.ts       — 45 industry production rates
    mockStore.ts          — Reactive store with localStorage persistence
  components/
    Sidebar.tsx           — Navigation sidebar
    GlassCard.tsx         — Glass-morphism card component
    QuotePreview.tsx      — Printable task order output
    ProposalPreview.tsx   — Printable annual proposal output
  layouts/
    AppLayout.tsx         — Sidebar + main content + mobile responsive
  pages/
    Dashboard.tsx         — Stats + recent quotes + feature nav
    CompanyProfile.tsx    — Company CRUD with logo upload
    RateLibrary.tsx       — Production rates by category
    BurdenBuilder.tsx     — 6-step burden rate wizard
    Workloading.tsx       — Zone/task/frequency workloading
    TaskOrderQuote.tsx    — One-off task order quotes
    Proposal.tsx          — Full annual proposal generator
    SavedQuotes.tsx       — Saved quotes list with status tracking
    Landing.tsx           — Marketing/landing page
```

## Key Commands
```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build
npx tsc --noEmit  # Type-check without building
```

## Design System
- **Theme:** Dark navy glass-morphism (navy-950 background, glass cards with backdrop-blur)
- **Accent:** #5B8DEF (soft blue)
- **Fonts:** IBM Plex Sans (body), IBM Plex Mono (numbers)
- CSS classes: `.glass`, `.glass-hover`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`
- Print output uses white background with professional government styling

## Data Flow
- All state in reactive stores (`src/data/mockStore.ts`) with localStorage persistence
- `workloadDraftStore` bridges Workloading → Proposal pages
- No backend yet — planned: Azure Static Web Apps + Azure PostgreSQL

## Important Rules
- Production rates are "industry-standard field-validated cleaning production rates" — NO ISSA references
- This is personal IP, not PORTCO
- Accounts use jdeltawiskey@gmail.com
