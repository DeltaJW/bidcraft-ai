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
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { loadDemoData } from '@/data/demoData'
import { quotesStore, burdenProfilesStore, templatesStore, useStore } from '@/data/mockStore'

const FEATURES = [
  {
    to: '/company',
    icon: Building2,
    title: 'Company Profile',
    desc: 'Set up your company info, CAGE code, and branding',
    color: 'text-blue-400',
  },
  {
    to: '/rates',
    icon: BookOpen,
    title: 'Rate Library',
    desc: 'Industry production rates by equipment and method',
    color: 'text-emerald-400',
  },
  {
    to: '/burden',
    icon: Calculator,
    title: 'Burden Builder',
    desc: 'Build fully burdened labor rates step by step',
    color: 'text-amber-400',
  },
  {
    to: '/workload',
    icon: ClipboardList,
    title: 'Workloading',
    desc: 'Calculate labor hours by zone, task, and frequency',
    color: 'text-purple-400',
  },
  {
    to: '/quote',
    icon: FileText,
    title: 'Task Order Quote',
    desc: 'Quick one-off quotes for task orders',
    color: 'text-rose-400',
  },
  {
    to: '/proposal',
    icon: FileStack,
    title: 'Full Proposal',
    desc: 'Annual proposals with multi-zone breakdowns',
    color: 'text-cyan-400',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const quotes = useStore(quotesStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const templates = useStore(templatesStore)

  const totalQuoted = quotes.reduce((s, q) => s + q.grandTotal, 0)
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length

  return (
    <div className="max-w-5xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">
            BidCraft <span className="text-accent">AI</span>
          </h1>
        </div>
        <p className="text-text-secondary text-lg mb-4">
          Price the work. Win the bid. Generate the proposal.
        </p>
        <div className="flex gap-3">
          <Link to="/burden" className="btn btn-primary no-underline">
            <Calculator className="w-4 h-4" />
            New Burden Rate
          </Link>
          <Link to="/workload" className="btn btn-ghost no-underline">
            <ClipboardList className="w-4 h-4" />
            New Workload
          </Link>
          <Link to="/quote" className="btn btn-ghost no-underline">
            <FileText className="w-4 h-4" />
            Quick Quote
          </Link>
          {quotes.length === 0 && burdenProfiles.length === 0 && (
            <button className="btn btn-ghost" onClick={loadDemoData}>
              <Sparkles className="w-4 h-4" />
              Load Demo Data
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-8"
      >
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{quotes.length}</div>
            <div className="text-xs text-text-tertiary">Quotes Saved</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">
              ${totalQuoted >= 1000 ? `${(totalQuoted / 1000).toFixed(0)}K` : totalQuoted.toFixed(0)}
            </div>
            <div className="text-xs text-text-tertiary">Total Quoted</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{acceptedCount}</div>
            <div className="text-xs text-text-tertiary">Accepted</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{burdenProfiles.length}</div>
            <div className="text-xs text-text-tertiary">Burden Profiles</div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent quotes */}
      {quotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">Recent Quotes</h2>
            <Link to="/saved" className="text-xs text-accent hover:text-accent-hover transition-colors no-underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {[...quotes]
              .reverse()
              .slice(0, 3)
              .map((q) => (
                <div key={q.id} className="glass glass-hover p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                      {q.quoteType === 'proposal' ? (
                        <FileStack className="w-4 h-4 text-accent" />
                      ) : (
                        <FileText className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-text-primary font-medium truncate max-w-md">{q.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(q.createdAt).toLocaleDateString()} | {q.quoteType === 'proposal' ? 'Proposal' : 'Task Order'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-accent">
                    ${q.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Building Templates */}
      {templates.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">Building Templates</h2>
            <Link to="/workload" className="text-xs text-accent hover:text-accent-hover transition-colors no-underline">
              Open Workloading
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {templates.slice(0, 3).map((tmpl) => (
              <Link key={tmpl.id} to="/workload" className="block no-underline">
                <div className="glass glass-hover p-4">
                  <h4 className="text-sm font-medium text-text-primary">{tmpl.name}</h4>
                  <p className="text-xs text-text-tertiary mt-0.5">{tmpl.description}</p>
                  <p className="text-xs text-text-disabled mt-1">
                    {new Date(tmpl.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-4"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.to} variants={item}>
            <Link to={f.to} className="block no-underline">
              <div className="glass glass-hover p-5 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {f.title}
                    </h3>
                    <p className="text-xs text-text-tertiary">{f.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
