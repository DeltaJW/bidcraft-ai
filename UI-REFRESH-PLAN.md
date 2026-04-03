# BidCraft AI — UI Refresh Plan

## Context
The app has 33 pages and 21,900+ lines of code. It's functionally complete but visually looks like "every AI-generated app" — generic glass-morphism, uniform card layouts, no visual personality.

## Tools Available (installed this session)
1. **Frontend Design Plugin** (`.claude/skills/frontend-design/SKILL.md`) — auto-activates on UI work
2. **21st.dev Magic MCP** — generates polished component variations
3. **Context7 MCP** — current Tailwind/Framer Motion docs
4. **Figma MCP** — pixel-perfect from Figma designs (needs `claude mcp auth figma`)
5. **Playwright MCP** — screenshot and visually verify

## What Needs to Change

### Current Problems
- Every page uses the same `.glass` card with identical padding/radius/border
- No visual hierarchy — all cards look the same importance
- Sidebar is a long list of items with no visual grouping beyond collapsible headers
- Dashboard is just stats + cards, no personality or delight
- Typography is uniform — no dramatic size/weight contrasts
- No background texture or atmosphere
- Animations are basic fade-ups, no orchestrated sequences
- Color usage is timid — accent blue everywhere with no variation

### Design Direction
BidCraft is a **professional tool for government contractors**. Not playful, not flashy — but **confident, authoritative, and precise**. Think:
- **Linear's** discipline and restraint
- **Vercel's** clean geometry
- **Bloomberg Terminal's** information density
- **Stripe's** polished documentation

### Priority Pages to Refresh (in order)
1. **Landing.tsx** — first impression, must be unforgettable
2. **Dashboard.tsx** — daily driver, needs to feel like a command center
3. **BurdenBuilder.tsx** — most-used tool, the cost waterfall should be beautiful
4. **Proposal.tsx** — the output page, needs to feel premium
5. **Sidebar.tsx** — navigation, used on every page
6. **Onboarding.tsx** — first experience, sets expectations

### Specific Improvements
- **Typography**: Use dramatic size jumps (48px → 14px), not uniform 16px
- **Cards**: 3+ distinct card styles (not just .glass everywhere)
- **Background**: Subtle dot grid, noise texture, or gradient mesh on surface-0
- **Dashboard**: Make it feel like a mission control, not a list of stats
- **Animations**: Orchestrated page-load sequence with staggered reveals
- **Sidebar**: Tighter spacing, icon-only collapsed mode on hover-expand
- **Color**: Use navy brand color more boldly, accent as highlight not default
- **Data density**: Tables and number-heavy pages should feel like Bloomberg, not Bootstrap

## How to Use the Tools

### Frontend Design Plugin
Just start building UI — it activates automatically and steers toward distinctive design.

### 21st.dev Magic MCP  
Ask: "Use 21st-magic to generate a polished dashboard stats card component" — it returns multiple styled variations.

### Context7 MCP
Ask: "Use context7 to get current Framer Motion staggerChildren API" — ensures correct, current syntax.

### Playwright Screenshot Loop
After building: "Take a screenshot of localhost:5173 and evaluate the visual design quality"
