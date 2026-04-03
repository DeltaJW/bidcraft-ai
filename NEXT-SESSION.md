# BidCraft AI — Next Session Kickoff

## MCP Setup (do this FIRST)

### Already installed (should work after restart):
- **UX MCP Server** — `ux-server` — 23 analysis tools, WCAG audits, color palettes
- **Context7** — `context7` — current Tailwind/React/Framer Motion docs

### Need API key:
- **21st.dev Magic** — currently installed with placeholder key. Get a real key:
  1. Go to https://21st.dev and create a free account
  2. Copy your API key
  3. Run: `claude mcp remove 21st-magic`
  4. Run: `claude mcp add 21st-magic -s user -e TWENTY_FIRST_API_KEY=PASTE_REAL_KEY -- npx -y @21st-dev/magic@latest`

### Need to install:
- **Conversion Copywriter** — landing page and marketing copy optimization
  - Check: https://mcpmarket.com/tools/skills/conversion-copywriter
  - Install per instructions on the page

- **AccessLint** — color contrast checker with suggested alternatives
  - Repo: https://github.com/accesslint/claude-marketplace
  - Install per repo instructions

### Figma MCP:
- Already configured as HTTP MCP at `https://mcp.figma.com/mcp`
- There is no `claude mcp auth` or `claude mcp login` command
- It should prompt OAuth in the browser when you first use a Figma tool after restart
- If it doesn't work, try removing and re-adding: `claude mcp remove figma && claude mcp add --transport http figma https://mcp.figma.com/mcp`

### Verify after restart:
Run `claude mcp list` and confirm all servers show `✓ Connected`. Then try using a tool from each to confirm they expose tools (not just connect).

---

## What was done this session

### BidCraft AI (https://deltajw.github.io/bidcraft-ai/)
**15 commits, 39+ files changed:**

- Full UI refresh across all 33 pages — section labels, typography, card variants, animations
- Sidebar: BC monogram, left-accent active indicator, collapsible sections
- Onboarding: "Let's Win" confidence language, stat-card lane picker
- BidWizard: collapsible, "WIN TRACK" label, "Ready to win"
- BurdenBuilder: segmented step control, Bloomberg-style breakdown panel, animated waterfall
- Proposal: stat-card cost summary, "Your Bid" / "Your Price" language
- **Color palette: cold navy → warm amber accent (#D97706) on GitHub dark surfaces (#0D1117)**
- **Green CTAs (#22C55E) on landing page conversion buttons only**
- **Warm copper section labels (#C09B7A) across all pages**
- WCAG accessibility: 84 → 98 score, all contrast passing
- Landing page: gradient mesh hero, pain-point copy, centered headline
- Dot grid texture + radial light on app interior

### PORTCO Workloading (https://portco-workloading-generator.vercel.app/)
- Warm amber accent, warm surfaces, PORTCO logo restored
- Section labels, colored metrics, rate breakdown highlighting
- WCAG contrast fixes

---

## What to work on next

### High priority:
1. **Landing page product screenshot** — The #1 thing missing. Every SaaS landing page shows the actual product. Take a screenshot of the Burden Builder with real data and put it in the hero or below-the-fold.
2. **Mobile responsiveness** — We designed at 1440px. Check 375px (iPhone), 768px (iPad). The sidebar, hero, pricing grid all need responsive testing.
3. **Light mode polish** — The light theme tokens were updated but never visually verified. Test by toggling in Settings.
4. **Micro-interactions** — save-flash and micro-pulse CSS classes exist but aren't wired to components yet. Wire them to: save buttons, step transitions, profile card creation.

### Medium priority:
5. **Rate Library page** — 120+ rates in a table. Needs Bloomberg-style data-table treatment.
6. **Analytics page** — Charts/trends dashboard. Needs color variety for chart segments.
7. **Print styles** — Verify government document output still looks correct after surface color changes.
8. **Onboarding flow** — Test the full guided path from onboarding → company → rates → burden → workload → proposal.

### Nice to have:
9. **Font loading optimization** — IBM Plex Sans loads 4 weights. Consider `font-display: swap`.
10. **Page transitions** — Currently each page has its own fade-in. Consider shared layout transitions.
11. **Command palette (Cmd+K)** — Already exists but hasn't been refreshed with the new design language.

---

## Design system reference

### Color roles:
| Color | Token | Hex | Role |
|---|---|---|---|
| Amber | `--color-accent` | `#D97706` | Interactive elements, active states, data highlights |
| Copper | `--color-label` | `#C09B7A` | Section labels, structural wayfinding |
| Green | `--color-cta` | `#22C55E` | Conversion buttons only (Start Free, Subscribe) |
| Navy | `--color-brand-navy` | `#17355E` | In-app primary buttons, brand identity |
| Success | `--color-success` | `#22C55E` | Completed states, checkmarks |

### Surface hierarchy:
| Token | Hex | Use |
|---|---|---|
| `surface-0` | `#0D1117` | Page background |
| `surface-1` | `#161B22` | Cards, panels |
| `surface-2` | `#1C2128` | Inputs, hover states |
| `surface-3` | `#21262D` | Table headers, pressed states |
| `surface-4` | `#282E36` | Elevated elements |

### CSS utility classes:
- `.section-label` — warm copper uppercase label
- `.stat-card` — card with bottom-accent on hover
- `.card-accent-left` — card with 3px left border
- `.glow-ring` — amber glow shadow
- `.dot-grid` — subtle dot grid background
- `.hero-gradient` — gradient mesh for landing hero
- `.hero-glow` — radial glow behind text
- `.section-lifted` — slightly lighter section background
- `.separator-gradient` — gradient horizontal rule
- `.gradient-text` — animated amber gradient on text
- `.btn-cta` — green conversion button
- `.save-flash` — green pulse animation
- `.micro-pulse` — subtle scale feedback

### Typography:
- IBM Plex Sans (body) / IBM Plex Mono (numbers)
- Section labels: 11px, tracking 0.1em, uppercase, 600 weight
- Page headings: text-2xl, bold, tracking-tight
- Mono numbers: tabular-nums always

### Accessibility:
- Lighthouse score: 98/100
- All text passes WCAG 4.5:1 contrast ratio
- `aria-label` on icon-only buttons
