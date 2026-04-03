# BidCraft AI — Next Session Startup Prompt

Copy-paste this into Claude Code when you start:

---

Read NEXT-SESSION.md and CLAUDE.md. This is a continuation of a UI refresh session on BidCraft AI.

## First: Verify MCPs are working

Run `claude mcp list` and confirm these are connected:
- **21st-magic** — component generation (API key installed)
- **ux-server** — WCAG audits, color palettes, design analysis
- **context7** — current Tailwind/React/Framer Motion docs
- **figma** — may need OAuth prompt on first use

For each one that shows connected, try calling one of its tools to verify it actually exposes tools (not just connects silently). If any are broken, fix them before proceeding.

Also install these if not already present:
- **AccessLint**: `claude mcp add accesslint -s user -- npx @anthropic/accesslint-mcp`
  (check https://github.com/accesslint/claude-marketplace for correct install command)
- **Conversion Copywriter**: check https://mcpmarket.com/tools/skills/conversion-copywriter

## Then: Continue the UI refresh

### What's done:
- All 33 pages have section labels, warm amber accent (#D97706), GitHub dark surfaces (#0D1117), copper structural labels (#C09B7A), green conversion CTAs
- Lighthouse accessibility: 98/100
- Landing page has gradient hero, pain-point copy, centered headline
- PORTCO app also refreshed with matching palette

### What to do next (priority order):

1. **Landing page product screenshot** — Take a screenshot of the Burden Builder with real data loaded (use demo data). Add it below the hero as social proof. Every SaaS landing page that converts shows the actual product. This is the #1 missing thing.

2. **Mobile responsiveness audit** — Resize Playwright to 375px width and screenshot every key page. Fix anything that breaks. Test: Landing, Dashboard, BurdenBuilder, Proposal, Sidebar mobile menu.

3. **Wire micro-interactions** — CSS classes `.save-flash` and `.micro-pulse` exist but aren't used yet. Wire save-flash to the BurdenBuilder save button and Proposal save button. Wire micro-pulse to step indicator clicks.

4. **Light mode verification** — Toggle theme in Settings, screenshot key pages, fix any broken colors. The light theme tokens were updated but never visually tested.

5. **Landing page alignment** — The hero (max-w-2xl centered) doesn't align with the features section (max-w-5xl). Walk the full page and make the visual rhythm consistent.

6. **Use 21st-magic** to generate a polished testimonial/social proof component for the landing page.

7. **Use ux-server** to run a full WCAG audit and color palette analysis on the current state.

### Design system:
- Amber accent (#D97706) = interactive
- Copper labels (#C09B7A) = structural via `.section-label` class
- Green (#22C55E) = conversion CTAs via `.btn-cta` class
- Navy (#17355E) = in-app primary buttons
- Surfaces: #0D1117 → #161B22 → #1C2128 → #21262D → #282E36
- All numbers: font-mono, tabular-nums
- Accessibility: WCAG 4.5:1 minimum on all text

### Live URLs:
- BidCraft: https://deltajw.github.io/bidcraft-ai/
- PORTCO: https://portco-workloading-generator.vercel.app/
- BidCraft localhost: http://localhost:5175/bidcraft-ai/ (run `npm run dev` first)

---
