import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Calculator,
  BookOpen,
  FileText,
  ClipboardList,
  Zap,
  Shield,
  Clock,
  Check,
  ArrowRight,
  Building2,
  Brain,
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
    icon: BookOpen,
    title: 'Production Rate Library',
    desc: '45+ industry-standard cleaning rates by equipment type and method. Fully customizable.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Calculator,
    title: 'Burden Rate Builder',
    desc: '6-step wizard builds fully burdened labor rates. Base wage, fringe, taxes, leave, G&A, profit.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: ClipboardList,
    title: 'Workloading Calculator',
    desc: 'Zone-based workloading with frequencies from daily to annually. Auto-calculates FTEs.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: FileText,
    title: 'Professional Proposals',
    desc: 'Generate branded, government-ready proposals with one click. Print to PDF.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Shield,
    title: 'SCA Wage Compliant',
    desc: 'Built for federal contractors. CAGE codes, UEI, set-aside status, wage determination support.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Brain,
    title: 'AI Document Parsing',
    desc: 'Upload an RFP or solicitation. AI extracts scope, square footage, and wage data. Coming soon.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Try it out',
    features: ['3 quotes/month', 'Rate library access', 'Burden rate builder', 'Basic PDF output'],
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
      'Priority support',
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
      'AI document parsing',
      '.docx export',
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
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-xl border-b border-navy-700/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">
              BidCraft <span className="text-accent">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-navy-300 hover:text-white transition-colors no-underline">Features</a>
            <a href="#pricing" className="text-sm text-navy-300 hover:text-white transition-colors no-underline">Pricing</a>
            <Link to="/" className="btn btn-primary !text-sm">
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
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20">
              <Zap className="w-3 h-3" />
              First-to-market for government janitorial pricing
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-6xl font-bold leading-tight mb-6"
          >
            Price the work.
            <br />
            <span className="text-accent">Win the bid.</span>
            <br />
            Generate the proposal.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-xl text-navy-300 max-w-2xl mx-auto mb-10"
          >
            The intelligent workloading and bid pricing platform for janitorial contractors.
            Stop guessing with spreadsheets — calculate production rates, build burden rates,
            and generate professional proposals in minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="flex justify-center gap-4">
            <Link to="/" className="btn btn-primary !text-base !px-8 !py-3">
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn btn-ghost !text-base !px-8 !py-3">
              See Features
            </a>
          </motion.div>

          {/* Social proof placeholder */}
          <motion.div variants={fadeUp} className="mt-16 flex justify-center gap-8 items-center">
            <div className="flex items-center gap-2 text-navy-500">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Built for federal contractors</span>
            </div>
            <div className="flex items-center gap-2 text-navy-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Quotes in minutes, not hours</span>
            </div>
            <div className="flex items-center gap-2 text-navy-500">
              <Shield className="w-4 h-4" />
              <span className="text-xs">SCA wage compliant</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-navy-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Everything you need to price and win</h2>
              <p className="text-navy-400 max-w-xl mx-auto">
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
                    <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-navy-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">How it works</h2>
              <p className="text-navy-400">Four steps from zero to a professional proposal</p>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Set up', desc: 'Enter your company info and logo' },
                { step: '2', title: 'Build rates', desc: 'Calculate your fully burdened labor rate' },
                { step: '3', title: 'Workload', desc: 'Map zones, tasks, and frequencies' },
                { step: '4', title: 'Propose', desc: 'Generate a branded, print-ready proposal' },
              ].map((s) => (
                <motion.div key={s.step} variants={fadeUp} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-accent font-bold text-lg">{s.step}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{s.title}</h4>
                  <p className="text-xs text-navy-400">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-navy-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
              <p className="text-navy-400">
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
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      <span className="text-navy-400 text-sm">{tier.period}</span>
                    </div>
                    <p className="text-xs text-navy-400 mb-5">{tier.desc}</p>
                    <ul className="flex flex-col gap-2 mb-6 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <span className="text-navy-300">{f}</span>
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
      <section className="py-20 px-6">
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
          <motion.p variants={fadeUp} className="text-navy-300 text-lg mb-8">
            Join the first modern platform built specifically for janitorial bid pricing.
            Your competitors are still using Excel — be the one with AI.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/" className="btn btn-primary !text-base !px-10 !py-3">
              <Sparkles className="w-5 h-5" />
              Start Free Today
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-semibold">
              BidCraft <span className="text-accent">AI</span>
            </span>
          </div>
          <p className="text-xs text-navy-500">
            &copy; {new Date().getFullYear()} BidCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
