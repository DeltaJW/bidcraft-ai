import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  FileStack,
  Sparkles,
  TrendingUp,
  CheckCircle,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'
import { loadDemoData } from '@/data/demoData'
import { quotesStore, burdenProfilesStore, templatesStore, useStore } from '@/data/mockStore'

/* ───── animation variants ─────
   The dashboard loads in a specific sequence:
   1. Header fades in instantly (0ms)
   2. Stats scale up with a slight bounce (100ms stagger)
   3. Recent quotes slide in from left (after stats)
   4. Shortcuts stagger in from bottom (last)
   This creates a "systems coming online" feel — like a mission control boot sequence. */

const pageOrchestration = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const SHORTCUTS = [
  { to: '/company', icon: Building2, label: 'Company Profile', color: 'text-blue-400' },
  { to: '/rates', icon: BookOpen, label: 'Rate Library', color: 'text-emerald-400' },
  { to: '/burden', icon: Calculator, label: 'Burden Builder', color: 'text-amber-400' },
  { to: '/workload', icon: ClipboardList, label: 'Workloading', color: 'text-purple-400' },
  { to: '/quote', icon: FileText, label: 'Task Order', color: 'text-rose-400' },
  { to: '/proposal', icon: FileStack, label: 'Full Proposal', color: 'text-cyan-400' },
]

export default function Dashboard() {
  const quotes = useStore(quotesStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const templates = useStore(templatesStore)

  const totalQuoted = quotes.reduce((s, q) => s + q.grandTotal, 0)
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length
  const winRate = quotes.length > 0 ? Math.round((acceptedCount / quotes.length) * 100) : 0

  const stats = [
    {
      label: 'Quotes',
      value: quotes.length,
      icon: FolderOpen,
      color: 'text-accent',
      borderColor: 'hover:after:bg-accent',
    },
    {
      label: 'Total Quoted',
      value: totalQuoted >= 1000 ? `$${(totalQuoted / 1000).toFixed(0)}K` : `$${totalQuoted.toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      borderColor: 'hover:after:bg-emerald-400',
    },
    {
      label: 'Accepted',
      value: acceptedCount,
      icon: CheckCircle,
      color: 'text-cyan-400',
      borderColor: 'hover:after:bg-cyan-400',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      borderColor: 'hover:after:bg-amber-400',
    },
  ]

  return (
    <motion.div
      className="max-w-5xl"
      initial="hidden"
      animate="show"
      variants={pageOrchestration}
    >
      {/* ── Header ── */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label">Command Center</p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              BidCraft <span className="text-accent font-normal">AI</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/burden" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-navy text-white text-xs font-semibold no-underline hover:bg-brand-navy-light transition-colors">
              <Calculator className="w-3.5 h-3.5" />
              New Burden Rate
            </Link>
            <Link to="/workload" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border-default text-text-secondary text-xs font-medium no-underline hover:text-text-primary hover:border-border-strong hover:bg-surface-2 transition-all">
              <ClipboardList className="w-3.5 h-3.5" />
              New Workload
            </Link>
            <Link to="/quote" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border-default text-text-secondary text-xs font-medium no-underline hover:text-text-primary hover:border-border-strong hover:bg-surface-2 transition-all">
              <FileText className="w-3.5 h-3.5" />
              Quick Quote
            </Link>
          </div>
        </div>
        {quotes.length === 0 && burdenProfiles.length === 0 && (
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-subtle text-text-disabled text-[11px] font-medium bg-transparent cursor-pointer hover:text-text-tertiary hover:border-border-default transition-colors" onClick={loadDemoData}>
            <Sparkles className="w-3 h-3" />
            Load demo data
          </button>
        )}
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <motion.div key={s.label} variants={scaleIn}>
            <div className="stat-card p-4">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled">{s.label}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-text-primary tracking-tight">
                {s.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Recent Quotes ── */}
      {quotes.length > 0 && (
        <motion.div variants={slideInLeft} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] tracking-widest uppercase font-semibold text-text-disabled">Recent Quotes</h2>
            <Link to="/saved" className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors no-underline font-medium">
              View all
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-lg border border-border-subtle overflow-hidden">
            {[...quotes]
              .reverse()
              .slice(0, 5)
              .map((q, i) => (
                <div
                  key={q.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0'
                  } ${i < Math.min(quotes.length, 5) - 1 ? 'border-b border-border-subtle' : ''} hover:bg-surface-2 transition-colors`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      q.status === 'accepted' ? 'bg-success' :
                      q.status === 'sent' ? 'bg-accent' :
                      'bg-text-disabled'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{q.title}</p>
                      <p className="text-[11px] text-text-disabled">
                        {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span className="mx-1.5 text-border-default">·</span>
                        {q.quoteType === 'proposal' ? 'Proposal' : 'Task Order'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-text-primary tabular-nums">
                    ${q.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* ── Building Templates ── */}
      {templates.length > 0 && (
        <motion.div variants={fadeIn} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] tracking-widest uppercase font-semibold text-text-disabled">Templates</h2>
            <Link to="/workload" className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors no-underline font-medium">
              Open Workloading
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.slice(0, 3).map((tmpl) => (
              <Link key={tmpl.id} to="/workload" className="block no-underline group">
                <div className="card-accent-left p-4">
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{tmpl.name}</h4>
                  <p className="text-[11px] text-text-disabled mt-0.5">{tmpl.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Quick Access ── */}
      <motion.div variants={fadeIn}>
        <h2 className="text-[11px] tracking-widest uppercase font-semibold text-text-disabled mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {SHORTCUTS.map((s) => (
            <motion.div key={s.to} variants={scaleIn}>
              <Link to={s.to} className="block no-underline group">
                <div className="stat-card p-3 text-center hover:border-border-default transition-colors">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">{s.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
