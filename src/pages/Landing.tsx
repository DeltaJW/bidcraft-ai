import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calculator,
  FileText,
  ClipboardList,
  Zap,
  Shield,
  Clock,
  Check,
  ArrowRight,
  Building2,
  Brain,
  Bot,
  Download,
  Layers,
  ChevronRight,
} from 'lucide-react'

/* ───── animation orchestration ─────
   Key principle: different elements enter from different distances
   and with different timings. This breaks the "AI generated" feel
   where everything fades up identically. */

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const sectionStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const FEATURES = [
  {
    icon: Layers,
    title: 'Multi-Industry Rate Library',
    desc: '120+ production rates across janitorial, security, landscaping, and facilities maintenance.',
    stat: '120+',
    statLabel: 'rates',
  },
  {
    icon: Calculator,
    title: 'Burden Rate Builder',
    desc: '6-step wizard builds fully burdened labor rates. Base wage, fringe, taxes, leave, G&A, and profit.',
    stat: '6',
    statLabel: 'steps',
  },
  {
    icon: ClipboardList,
    title: 'Workloading Calculator',
    desc: 'Zone-based workloading with 9 frequency options. Auto-calculates annual hours, FTE needs, and labor costs.',
    stat: '9',
    statLabel: 'frequencies',
  },
  {
    icon: FileText,
    title: 'Professional Proposals',
    desc: 'Government-ready proposals with your logo, CAGE code, and set-aside status. Navy letterhead, signature blocks.',
    stat: 'Gov',
    statLabel: 'ready',
  },
  {
    icon: Bot,
    title: 'AI Pricing Assistant',
    desc: 'Describe a building or paste a scope of work. AI suggests zones, tasks, rates, and pricing strategies.',
    stat: 'AI',
    statLabel: 'powered',
  },
  {
    icon: Download,
    title: 'Export Everything',
    desc: 'CSV, PDF, and DOCX export. Print-ready government documents. Backup and restore all data in one click.',
    stat: '3',
    statLabel: 'formats',
    accent: '#F97316', // orange
  },
]

const INDUSTRIES = [
  { name: 'Janitorial', count: '45', unit: 'rates', desc: 'Floor care, carpet, restrooms, trash' },
  { name: 'Security', count: '24', unit: 'rates', desc: 'Fixed post, patrol, access control' },
  { name: 'Landscaping', count: '30', unit: 'rates', desc: 'Mowing, trimming, turf care, snow' },
  { name: 'Maintenance', count: '28', unit: 'rates', desc: 'HVAC, electrical, plumbing, PM' },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Try it out',
    features: ['3 quotes/month', 'All rate libraries', 'Burden rate builder', 'Basic PDF output'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    desc: 'For solo contractors',
    features: [
      'Unlimited quotes',
      'Custom company branding',
      'Saved rate profiles',
      'Full proposal generator',
      'Building templates',
      'CSV export',
    ],
    cta: 'Start Pro Trial',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    desc: 'For growing teams',
    features: [
      'Everything in Pro',
      'AI Pricing Assistant',
      'PDF + .docx export',
      'Team access (3 seats)',
      'SCA wage auto-lookup',
      'Custom report templates',
    ],
    cta: 'Start Business Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/mo',
    desc: 'For large operations',
    features: [
      'Everything in Business',
      'Unlimited team seats',
      'API access',
      'SSO / SAML',
      'White-label output',
      'Dedicated onboarding',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface-0/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-brand-navy flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">BC</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              BidCraft <span className="text-accent font-normal">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs text-text-tertiary hover:text-text-primary transition-colors no-underline tracking-wide uppercase font-medium">Features</a>
            <a href="#pricing" className="text-xs text-text-tertiary hover:text-text-primary transition-colors no-underline tracking-wide uppercase font-medium">Pricing</a>
            <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold no-underline hover:bg-brand-navy-light transition-colors">
              Launch App
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        {/* Gradient mesh — the "this is alive" layer */}
        <div className="absolute inset-0 hero-gradient" />
        {/* Radial glow behind headline */}
        <div className="absolute inset-0 hero-glow" />
        {/* Dot grid for texture */}
        <div className="absolute inset-0 dot-grid opacity-20" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={heroStagger}
          className="relative max-w-2xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={heroItem} className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium text-text-tertiary border border-border-subtle bg-surface-1/60 tracking-wide uppercase">
              <Zap className="w-3 h-3 text-accent" />
              Facility Services Bid Pricing Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={heroItem}
            className="text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6 inline-block"
          >
            <span className="block">Price the work.</span>
            <span className="block text-center gradient-text">Win the bid.</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="text-lg text-text-secondary max-w-xl mb-10 leading-relaxed"
          >
            Production rates, burdened labor costs, and government-ready
            proposals — calculated in minutes, not days. For janitorial,
            security, landscaping, and maintenance contractors who win.
          </motion.p>

          <motion.div variants={heroItem} className="flex items-center gap-3">
            <Link to="/" className="btn btn-cta !text-sm !px-6 !py-2.5 no-underline">
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md border border-border-default text-text-secondary text-sm font-medium no-underline hover:text-text-primary hover:border-border-strong hover:bg-surface-1 transition-all">
              See Features
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          {/* Trust bar — horizontal, minimal */}
          <motion.div
            variants={heroItem}
            className="mt-16 pt-8 border-t border-border-subtle flex flex-wrap gap-6 items-center"
          >
            {[
              { icon: Building2, text: 'Built for federal contractors' },
              { icon: Clock, text: 'Quotes in minutes' },
              { icon: Shield, text: 'SCA wage compliant' },
              { icon: Brain, text: 'AI-powered pricing' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-text-disabled">
                <item.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] tracking-wide uppercase font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 relative section-lifted">
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionStagger}
          >
            <motion.div variants={cardReveal} className="mb-14">
              <p className="section-label mb-3">Capabilities</p>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Every tool you need to win</h2>
              <p className="text-text-tertiary max-w-lg text-sm leading-relaxed">
                From production rates to professional proposals — one platform replaces
                your spreadsheets, rate books, and Word templates.
              </p>
            </motion.div>

            {/* Feature cards — left-border accent style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <motion.div key={f.title} variants={cardReveal}>
                  <div className="card-accent-left p-5 flex gap-4 h-full">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-surface-2 flex items-center justify-center">
                      <f.icon className="w-4.5 h-4.5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-text-primary">{f.title}</h3>
                        <span className="text-[10px] font-mono font-bold text-accent tracking-wide">
                          {f.stat} <span className="text-text-disabled font-normal">{f.statLabel}</span>
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Industries — "Bloomberg style" number-forward ── */}
      <section id="industries" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionStagger}
          >
            <motion.div variants={cardReveal} className="mb-14">
              <p className="section-label mb-3">Coverage</p>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Not just cleaning</h2>
              <p className="text-text-tertiary max-w-lg text-sm leading-relaxed">
                BidCraft ships with rate libraries for four facility services industries.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INDUSTRIES.map((ind) => (
                <motion.div key={ind.name} variants={scaleIn}>
                  <div className="stat-card p-5 text-center">
                    <div className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-0.5">
                      {ind.count}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-3">
                      {ind.unit}
                    </div>
                    <div className="separator-gradient mb-3" />
                    <h4 className="text-sm font-semibold text-text-primary mb-1">{ind.name}</h4>
                    <p className="text-[11px] text-text-disabled leading-snug">{ind.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 relative section-lifted">
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionStagger}
          >
            <motion.div variants={cardReveal} className="mb-14 text-center">
              <p className="section-label mb-3">Workflow</p>
              <h2 className="text-3xl font-bold tracking-tight">Four steps to a professional proposal</h2>
            </motion.div>

            <div className="grid grid-cols-4 gap-0">
              {[
                { step: '01', title: 'Set up', desc: 'Company info, logo, CAGE code' },
                { step: '02', title: 'Build rates', desc: 'Fully burdened labor rate' },
                { step: '03', title: 'Workload', desc: 'Zones, tasks, frequencies' },
                { step: '04', title: 'Propose', desc: 'Government-ready output' },
              ].map((s, i) => (
                <motion.div key={s.step} variants={cardReveal} className="relative text-center px-4">
                  {/* Connecting line */}
                  {i < 3 && (
                    <div className="absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-border-subtle" />
                  )}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-accent/30 bg-surface-1 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xs font-mono font-bold text-accent">{s.step}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">{s.title}</h4>
                    <p className="text-[11px] text-text-disabled">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionStagger}
          >
            <motion.div variants={cardReveal} className="text-center mb-14">
              <p className="section-label mb-3">Pricing</p>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Simple, transparent pricing</h2>
              <p className="text-text-tertiary text-sm">
                Start free. Upgrade when you need more.
                <span className="text-accent ml-1 font-medium">Save 20% annually.</span>
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {PRICING.map((tier) => (
                <motion.div key={tier.name} variants={scaleIn}>
                  <div
                    className={`relative rounded-lg p-6 h-full flex flex-col ${
                      tier.highlighted
                        ? 'glow-ring bg-surface-1'
                        : 'bg-surface-1 border border-border-subtle'
                    }`}
                  >
                    {/* Highlighted tier gets a navy header bar */}
                    {tier.highlighted && (
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r from-accent via-brand-navy-light to-accent" />
                    )}

                    <div className="mb-4">
                      {tier.highlighted && (
                        <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-accent mb-2">Most Popular</span>
                      )}
                      <h3 className="text-base font-bold text-text-primary">{tier.name}</h3>
                      <p className="text-[11px] text-text-disabled mt-0.5">{tier.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">{tier.price}</span>
                      <span className="text-text-disabled text-xs">{tier.period}</span>
                    </div>

                    <div className="separator-gradient mb-5" />

                    <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                          <span className="text-text-secondary">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/"
                      className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs no-underline transition-all ${
                        tier.highlighted
                          ? 'btn-cta'
                          : 'border border-border-default text-text-secondary font-semibold hover:text-text-primary hover:border-border-strong hover:bg-surface-2'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 hero-glow" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={sectionStagger}
          className="relative max-w-2xl mx-auto text-center"
        >
          <motion.h2 variants={cardReveal} className="text-3xl font-bold tracking-tight mb-4">
            Your competitors are using spreadsheets.
          </motion.h2>
          <motion.p variants={cardReveal} className="text-text-secondary text-sm mb-8 leading-relaxed">
            You're going to walk in with AI-powered pricing, professional proposals,
            and burden rates calculated to the penny. That's the difference.
          </motion.p>
          <motion.div variants={cardReveal}>
            <Link to="/" className="btn btn-cta !text-sm !px-8 !py-3 no-underline">
              Start Free Today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border-subtle py-6 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-brand-navy flex items-center justify-center">
              <span className="text-white text-[9px] font-bold font-mono">BC</span>
            </div>
            <span className="text-xs font-semibold">
              BidCraft <span className="text-text-tertiary font-normal">AI</span>
            </span>
          </div>
          <p className="text-[11px] text-text-disabled">
            &copy; {new Date().getFullYear()} BidCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
