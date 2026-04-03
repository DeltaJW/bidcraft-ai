import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  FileStack,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Trophy,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, useStore } from '@/data/mockStore'
import type { Quote } from '@/types'

// ---- helpers ----

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function fmtFull(n: number): string {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`
}

const STATUS_COLORS: Record<Quote['status'], string> = {
  draft: 'bg-text-tertiary',
  sent: 'bg-blue-400',
  accepted: 'bg-emerald-400',
  rejected: 'bg-rose-400',
}

const STATUS_LABELS: Record<Quote['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

// ---- component ----

export default function Analytics() {
  const quotes = useStore(quotesStore)

  // --- Stats ---
  const totalCount = quotes.length
  const totalValue = quotes.reduce((s, q) => s + q.grandTotal, 0)
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length
  const rejectedCount = quotes.filter((q) => q.status === 'rejected').length
  const decidedCount = acceptedCount + rejectedCount
  const winRate = decidedCount > 0 ? ((acceptedCount / decidedCount) * 100).toFixed(0) : null
  const avgValue = totalCount > 0 ? totalValue / totalCount : 0

  // --- Status breakdown ---
  const statusCounts: Record<Quote['status'], number> = { draft: 0, sent: 0, accepted: 0, rejected: 0 }
  quotes.forEach((q) => { statusCounts[q.status]++ })

  // --- By type ---
  const taskOrders = quotes.filter((q) => q.quoteType === 'task_order' || q.quoteType === 'workload')
  const proposals = quotes.filter((q) => q.quoteType === 'proposal')
  const toCount = taskOrders.length
  const toValue = taskOrders.reduce((s, q) => s + q.grandTotal, 0)
  const propCount = proposals.length
  const propValue = proposals.reduce((s, q) => s + q.grandTotal, 0)

  // --- Monthly trend (last 6 months) ---
  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthlyCounts: Record<string, number> = {}
  months.forEach((m) => { monthlyCounts[m] = 0 })
  quotes.forEach((q) => {
    const k = monthKey(q.createdAt)
    if (k in monthlyCounts) monthlyCounts[k]++
  })
  const maxMonthly = Math.max(...Object.values(monthlyCounts), 1)

  // --- Recent activity (last 5) ---
  const recent = [...quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  // --- Top quotes (3 highest value) ---
  const topQuotes = [...quotes].sort((a, b) => b.grandTotal - a.grandTotal).slice(0, 3)

  // --- Empty state ---
  if (totalCount === 0) {
    return (
      <div className="max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-text-primary">Win/Loss Analytics</h1>
          </div>
          <p className="text-text-secondary text-lg">Pipeline analytics and performance metrics.</p>
        </motion.div>
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="w-12 h-12 text-text-disabled mb-4" />
          <p className="text-text-secondary text-lg font-medium mb-1">No quotes yet</p>
          <p className="text-text-tertiary text-sm mb-4">Create a quote to start tracking your pipeline.</p>
          <Link to="/quote" className="btn btn-primary no-underline">
            <FileText className="w-4 h-4" />
            Create Quote
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Win/Loss Analytics</h1>
        </div>
        <p className="text-text-secondary text-lg">Pipeline analytics and performance metrics.</p>
      </motion.div>

      {/* 1. Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4 mb-8">
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{totalCount}</div>
            <div className="text-xs text-text-tertiary">Total Quotes</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{fmt(totalValue)}</div>
            <div className="text-xs text-text-tertiary">Total Value</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {winRate !== null ? `${winRate}%` : '\u2014'}
            </div>
            <div className="text-xs text-text-tertiary">Win Rate</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{fmt(avgValue)}</div>
            <div className="text-xs text-text-tertiary">Avg Quote Value</div>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. Status breakdown + 3. By Type — side by side */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-4 mb-8">
        {/* Status Breakdown */}
        <GlassCard title="Status Breakdown">
          {/* Pill bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-4">
            {(['draft', 'sent', 'accepted', 'rejected'] as const).map((st) => {
              const pct = totalCount > 0 ? (statusCounts[st] / totalCount) * 100 : 0
              if (pct === 0) return null
              return (
                <div
                  key={st}
                  className={`${STATUS_COLORS[st]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${STATUS_LABELS[st]}: ${statusCounts[st]}`}
                />
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {(['draft', 'sent', 'accepted', 'rejected'] as const).map((st) => (
              <div key={st} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[st]}`} />
                <span className="text-sm text-text-secondary">
                  {STATUS_LABELS[st]} <span className="font-mono font-bold text-text-primary">{statusCounts[st]}</span>
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* By Type */}
        <GlassCard title="By Quote Type">
          <div className="flex flex-col gap-4">
            {/* Task Orders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-400/15 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Task Orders</p>
                  <p className="text-xs text-text-tertiary">{toCount} quote{toCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-text-primary">{fmtFull(toValue)}</span>
            </div>
            {/* Proposals */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-400/15 flex items-center justify-center">
                  <FileStack className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Proposals</p>
                  <p className="text-xs text-text-tertiary">{propCount} quote{propCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-text-primary">{fmtFull(propValue)}</span>
            </div>
            {/* Ratio bar */}
            {totalCount > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 transition-all"
                  style={{ width: `${(toCount / totalCount) * 100}%` }}
                  title={`Task Orders: ${toCount}`}
                />
                <div
                  className="bg-purple-400 transition-all"
                  style={{ width: `${(propCount / totalCount) * 100}%` }}
                  title={`Proposals: ${propCount}`}
                />
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* 4. Monthly trend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
        <GlassCard title="Monthly Trend" subtitle="Quotes created per month (last 6 months)">
          <div className="flex items-end gap-3 h-40">
            {months.map((m) => {
              const count = monthlyCounts[m]
              const heightPct = maxMonthly > 0 ? (count / maxMonthly) * 100 : 0
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-mono font-bold text-text-primary">{count}</span>
                  <div className="w-full flex items-end" style={{ height: '100px' }}>
                    <div
                      className="w-full rounded-t bg-accent/70 transition-all"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-tertiary">{monthLabel(m)}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* 5. Recent Activity + 6. Top Quotes — side by side */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="grid grid-cols-2 gap-4 mb-8">
        {/* Recent Activity */}
        <GlassCard
          title="Recent Activity"
          action={
            <Link to="/saved" className="text-xs text-accent hover:text-accent-hover transition-colors no-underline">
              View all
            </Link>
          }
        >
          <div className="flex flex-col gap-2">
            {recent.map((q) => (
              <Link key={q.id} to="/saved" className="no-underline">
                <div className="glass glass-hover p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[q.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{q.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(q.createdAt).toLocaleDateString()} &middot; {STATUS_LABELS[q.status]}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-accent text-sm flex-shrink-0 ml-3">
                    {fmtFull(q.grandTotal)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Top Quotes */}
        <GlassCard title="Top Quotes" subtitle="Highest value">
          <div className="flex flex-col gap-3">
            {topQuotes.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  {i === 0 ? (
                    <Trophy className="w-4 h-4 text-amber-400" />
                  ) : (
                    <span className="text-xs font-bold font-mono text-amber-400">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary font-medium truncate">{q.title}</p>
                  <p className="text-xs text-text-tertiary">
                    {q.quoteType === 'proposal' ? 'Proposal' : 'Task Order'} &middot; {STATUS_LABELS[q.status]}
                  </p>
                </div>
                <span className="font-mono font-bold text-accent text-sm flex-shrink-0">
                  {fmtFull(q.grandTotal)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
