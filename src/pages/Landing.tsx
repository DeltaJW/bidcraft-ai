import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
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
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const FEATURES = [
  {
    icon: Layers,
    title: 'Multi-Industry Rate Library',
    desc: '120+ production rates across janitorial, security, landscaping, and facilities maintenance. Fully customizable.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Calculator,
    title: 'Burden Rate Builder',
    desc: '6-step wizard builds fully burdened labor rates. Base wage, fringe, taxes, leave, G&A, and profit — all calculated live.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ClipboardList,
    title: 'Workloading Calculator',
    desc: 'Zone-based workloading with 9 frequency options. Auto-calculates annual hours, monthly hours, FTE needs, and labor costs.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: FileText,
    title: 'Professional Proposals',
    desc: 'Generate government-ready proposals with your logo, CAGE code, and set-aside status. Navy letterhead, signature blocks, the works.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Bot,
    title: 'AI Pricing Assistant',
    desc: 'Describe a building, paste a scope of work, or ask about burden rates. AI suggests zones, tasks, rates, and pricing strategies.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Download,
    title: 'Export Everything',
    desc: 'CSV export on every table. Print-ready government documents. Backup and restore all your data in one click.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
]

const INDUSTRIES = [
  { name: 'Janitorial', count: '45+ rates', desc: 'Floor care, carpet, restrooms, trash' },
  { name: 'Security', count: '24 rates', desc: 'Fixed post, patrol, access control, monitoring' },
  { name: 'Landscaping', count: '30 rates', desc: 'Mowing, trimming, turf care, snow removal' },
  { name: 'Maintenance', count: '28 rates', desc: 'HVAC, electrical, plumbing, PM' },
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
    period: '/month',
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
    period: '/month',
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
    period: '/month',
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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">
              BidCraft <span className="text-accent">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Features</a>
            <a href="#industries" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Industries</a>
            <a href="#pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Pricing</a>
            <Link to="/" className="btn btn-primary !text-sm no-underline">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-muted text-accent border border-accent/20">
              <Zap className="w-3 h-3" />
              The only bid pricing platform built for facility services
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            Price the work.
            <br />
            <span className="text-accent">Win the bid.</span>
            <br />
            Generate the proposal.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-xl text-text-secondary max-w-2xl mx-auto mb-10"
          >
            Stop guessing with spreadsheets. Calculate production rates, build burdened labor rates,
            and generate government-ready proposals — for janitorial, security, landscaping, and maintenance.
          </motion.p>
          <motion.div variants={fadeUp} className="flex justify-center gap-4">
            <Link to="/" className="btn btn-primary !text-base !px-8 !py-3 no-underline">
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn btn-ghost !text-base !px-8 !py-3 no-underline">
              See Features
            </a>
          </motion.div>

          {/* Trust signals */}
          <motion.div variants={fadeUp} className="mt-16 flex justify-center gap-8 items-center">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Built for federal contractors</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Quotes in minutes, not hours</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary">
              <Shield className="w-4 h-4" />
              <span className="text-xs">SCA wage compliant</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary">
              <Brain className="w-4 h-4" />
              <span className="text-xs">AI-powered pricing</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-surface-1/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Everything you need to price and win</h2>
              <p className="text-text-tertiary max-w-xl mx-auto">
                From production rates to professional proposals — one platform replaces your spreadsheets,
                rate books, and Word templates.
              </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <motion.div key={f.title} variants={fadeUp}>
                  <div className="glass p-6 h-full">
                    <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                    <p className="text-sm text-text-tertiary leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Not just cleaning</h2>
              <p className="text-text-tertiary max-w-xl mx-auto">
                BidCraft ships with rate libraries for four facility services industries.
                Same powerful engine, purpose-built rates.
              </p>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {INDUSTRIES.map((ind) => (
                <motion.div key={ind.name} variants={fadeUp}>
                  <div className="glass p-5 text-center h-full">
                    <h4 className="text-sm font-bold text-text-primary mb-1">{ind.name}</h4>
                    <p className="text-accent font-mono text-xs font-semibold mb-2">{ind.count}</p>
                    <p className="text-xs text-text-tertiary">{ind.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-surface-1/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">How it works</h2>
              <p className="text-text-tertiary">Four steps from zero to a professional proposal</p>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Set up', desc: 'Enter your company info, logo, and CAGE code' },
                { step: '2', title: 'Build rates', desc: 'Calculate your fully burdened labor rate step by step' },
                { step: '3', title: 'Workload', desc: 'Map zones, tasks, and frequencies for each building' },
                { step: '4', title: 'Propose', desc: 'Generate a branded, government-ready proposal' },
              ].map((s) => (
                <motion.div key={s.step} variants={fadeUp} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-navy flex items-center justify-center mx-auto mb-3 border border-brand-navy-light">
                    <span className="text-white font-bold text-lg">{s.step}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mb-1">{s.title}</h4>
                  <p className="text-xs text-text-tertiary">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
              <p className="text-text-tertiary">
                Start free. Upgrade when you need more.
                <span className="text-accent ml-1">Save 20% with annual billing.</span>
              </p>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {PRICING.map((tier) => (
                <motion.div key={tier.name} variants={fadeUp}>
                  <div
                    className={`glass p-6 h-full flex flex-col ${
                      tier.highlighted ? 'border-accent/40 ring-1 ring-accent/20' : ''
                    }`}
                  >
                    {tier.highlighted && (
                      <span className="text-xs font-medium text-accent mb-2">Most Popular</span>
                    )}
                    <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-bold text-text-primary">{tier.price}</span>
                      <span className="text-text-tertiary text-sm">{tier.period}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mb-5">{tier.desc}</p>
                    <ul className="flex flex-col gap-2 mb-6 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span className="text-text-secondary">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/"
                      className={`btn justify-center w-full no-underline ${
                        tier.highlighted ? 'btn-primary' : 'btn-ghost'
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

      {/* CTA */}
      <section className="py-20 px-6 bg-surface-1/50">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-4">
            Stop pricing on spreadsheets
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary text-lg mb-8">
            Your competitors are still using Excel. Be the one with AI-powered pricing,
            professional proposals, and burden rates calculated in seconds.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/" className="btn btn-primary !text-base !px-10 !py-3 no-underline">
              <Sparkles className="w-5 h-5" />
              Start Free Today
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-semibold">
              BidCraft <span className="text-accent">AI</span>
            </span>
          </div>
          <p className="text-xs text-text-disabled">
            &copy; {new Date().getFullYear()} BidCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
