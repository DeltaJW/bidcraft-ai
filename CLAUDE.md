# BidCraft AI

## What This Is
Multi-industry facility services bid pricing SaaS platform. Covers janitorial, security guard, landscaping, and facilities maintenance. Users calculate labor hours from production rates, build burdened labor rates, generate professional proposals, and manage their bid pipeline.

**Owner:** Justin Wilson (personal IP — NOT PORTCO, NOT GovCon AI)
**Contact:** jdeltawiskey@gmail.com
**Deployed:** GitHub Pages via CI/CD (push to master triggers deploy)
**Repo:** https://github.com/DeltaJW/bidcraft-ai

## Tech Stack
- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 (with @tailwindcss/vite plugin)
- Framer Motion for animations
- Lucide React for icons
- IBM Plex Sans / IBM Plex Mono fonts
- html2pdf.js for PDF export
- docx + file-saver for DOCX export
- xlsx for spreadsheet import
- Path aliases: `@/` maps to `src/`
- No backend yet — all data in localStorage
- AI features use Claude API directly from browser (BYOK)

## Key Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build (tsc -b && vite build)
npx tsc --noEmit  # Type-check without building
```

## Project Structure

### Pages (30+)
```
src/pages/
  Dashboard.tsx          — Stats, recent quotes, templates, quick actions
  QuickEstimate.tsx      — Pre-built building templates, one-click proposals
  CompanyProfile.tsx     — Company CRUD + SAM.gov auto-fill
  Clients.tsx            — Client management, quote history per client
  RateLibrary.tsx        — 120+ rates across 4 industries, import/export
  BurdenBuilder.tsx      — 6-step burden rate wizard + cost waterfall
  LaborCategories.tsx    — Multi-role pricing (Janitor, Lead, Supervisor, PM)
  CrewScheduler.tsx      — Shift planning, OT analysis, visual week grid
  SCALookup.tsx          — SAM.gov wage determination lookup
  RFPParser.tsx          — AI extracts scope from RFP text
  BidNoBid.tsx           — 10-factor bid/no-bid decision scorecard
  CompetitiveIntel.tsx   — USASpending award search by NAICS/state
  RecompeteRadar.tsx     — Find expiring contracts to bid on
  Workloading.tsx        — Zone/task/frequency calculator
  TaskOrderQuote.tsx     — One-off task order quotes
  Proposal.tsx           — Full annual proposals + cover page
  MultiBuilding.tsx      — Multi-building proposals
  NarrativeWriter.tsx    — AI generates proposal narratives
  SavedQuotes.tsx        — Quote management with versioning + email
  Analytics.tsx          — Win/loss dashboard, monthly trends
  ProfitOptimizer.tsx    — Reverse-engineer from target price
  ScenarioCompare.tsx    — Side-by-side what-if comparison
  PriceEscalation.tsx    — Multi-year option year projections
  TurnoverCalc.tsx       — Turnover cost modeling
  Inspections.tsx        — QC inspection checklist generator
  ContractCalendar.tsx   — Contract dates, renewals, WD expirations
  ContractPL.tsx         — Post-award actual vs bid cost tracking
  RegionalCost.tsx       — BLS wage benchmarks by metro area
  AIAssistant.tsx        — Claude-powered chat with user context
  Settings.tsx           — Theme, mode, AI key, backup/restore
  Landing.tsx            — Marketing page with pricing
```

### Components
```
src/components/
  Sidebar.tsx            — Grouped collapsible navigation (5 sections)
  GlassCard.tsx          — Card component with variants (default/elevated/inset/brand)
  BidWizard.tsx          — TurboTax-style progress tracker
  CommandPalette.tsx     — Cmd+K fuzzy search (pages, actions, quotes)
  HelpTip.tsx            — Contextual (?) tooltips
  Toast.tsx              — Notifications with undo action support
  ConfirmDialog.tsx      — Destructive action confirmation
  QuotePreview.tsx       — Printable task order (gov document styling)
  ProposalPreview.tsx    — Printable proposal (navy letterhead)
  ProposalCoverPage.tsx  — Federal proposal cover page
  SupplyCatalogModal.tsx — Supply picker for materials
  RateImportWizard.tsx   — Excel/CSV rate import with column mapping
  Onboarding.tsx         — 4-step first-time setup
```

### Data
```
src/data/
  mockStore.ts           — All reactive stores (localStorage persistence)
  defaultRates.ts        — 45 janitorial production rates
  industryRates.ts       — Security (24), Landscaping (30), Maintenance (28) rates
  defaultSupplies.ts     — 50+ supply items with market pricing
  buildingTemplates.ts   — 8 pre-built building templates
  regionalBenchmarks.ts  — BLS wage data for 20 metro areas
  demoData.ts            — Demo company + quotes for new users
```

### Services
```
src/services/
  ai.ts                  — Claude API integration with user context injection
  sca.ts                 — SAM.gov wage determination API
  sam.ts                 — SAM.gov entity lookup for company auto-fill
```

### Utils
```
src/utils/
  csv.ts                 — CSV export with escaping
  pdf.ts                 — PDF generation via html2pdf.js
  docx.ts                — DOCX generation via docx library
  units.ts               — Unit label helpers
```

## Design System
- **Theme:** Dark (default) + Light mode, toggled in Settings
- **Mode:** Guided (wizard rail) + Expert, toggled in Settings
- **Brand Navy:** #17355E
- **Accent:** #5B8DEF (soft blue)
- **Surfaces:** 5-level elevation system (surface-0 through surface-4)
- **Text:** 4-level hierarchy (primary, secondary, tertiary, disabled)
- **Fonts:** IBM Plex Sans (body), IBM Plex Mono (numbers)
- **Components:** .glass, .card-elevated, .card-inset, .card-brand, .btn-primary/ghost/danger/success, .data-table, .badge-*
- **Print:** Government document styling with Calibri/Georgia, navy headers, signature blocks

## Data Flow
- All state in reactive stores (`src/data/mockStore.ts`) with localStorage persistence
- Stores: company, rateLibrary, burdenProfiles, laborCategories, quotes, templates, clients, contracts, inspections, contractPL, supplies, bidDecisions, aiSettings, theme, userMode, onboardingDismissed, workloadDraft
- `workloadDraftStore` bridges Workloading → Proposal pages
- AI uses `sendMessage()` from services/ai.ts — injects user's company, profiles, quotes into system prompt

## External APIs (no keys needed)
- **SAM.gov WD API:** `https://sam.gov/api/prod/wdol/v1/wd/{wdNumber}/{revision}` — wage determinations
- **SAM.gov Entity API:** `https://api.sam.gov/entity-information/v3/entities` — company lookup (uses DEMO_KEY)
- **USASpending API:** `https://api.usaspending.gov/api/v2/search/spending_by_award/` — contract awards
- **Claude API:** User provides own key (BYOK), stored in localStorage

## Important Rules
- Production rates are "industry-standard field-validated cleaning production rates" — NO ISSA references
- This is personal IP, not PORTCO
- Accounts use jdeltawiskey@gmail.com
- Never use PORTCO branding or data in this project

## What's Not Built Yet
- Supabase auth (email + Google login)
- Stripe billing with tier gating
- PWS Auto-Workloader (AI generates full workload from uploaded document)
- Government format export (SF-1449, CLIN Excel)
- 3-lane onboarding router
- SCA wage floor validation in Burden Builder
- Custom domain
