import { motion } from 'framer-motion'
import { FolderOpen, FileText, FileStack, Trash2, Clock, DollarSign, Copy, Filter, Download } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/GlassCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import { quotesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'
import type { Quote } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-surface-3 text-text-secondary',
  sent: 'bg-blue-500/15 text-blue-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  task_order: FileText,
  proposal: FileStack,
  workload: FileText,
}

export default function SavedQuotes() {
  const quotes = useStore(quotesStore)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null)

  const filtered = quotes.filter((q) => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false
    if (filterType !== 'all' && q.quoteType !== filterType) return false
    return true
  })

  function deleteQuote(id: string) {
    quotesStore.update((prev) => prev.filter((q) => q.id !== id))
  }

  function duplicateQuote(q: Quote) {
    const dup: Quote = {
      ...q,
      id: `quote-${Date.now()}`,
      title: `${q.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    quotesStore.update((prev) => [...prev, dup])
  }

  function updateStatus(id: string, status: Quote['status']) {
    quotesStore.update((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    )
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function handleExportCSV() {
    const headers = ['Title', 'Type', 'Status', 'Date', 'Contract Ref', 'Location', 'Hours', 'Amount']
    const rows = filtered.map((q) => [
      q.title,
      q.quoteType === 'proposal' ? 'Full Proposal' : q.quoteType === 'task_order' ? 'Task Order' : 'Workload',
      q.status,
      formatDate(q.createdAt),
      q.contractRef || '',
      q.location || '',
      Number(q.totalHours.toFixed(1)),
      Number(q.grandTotal.toFixed(2)),
    ])
    downloadCSV(`bidcraft-quotes-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  const totalValue = filtered.reduce((s, q) => s + q.grandTotal, 0)
  const acceptedValue = filtered
    .filter((q) => q.status === 'accepted')
    .reduce((s, q) => s + q.grandTotal, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Saved Quotes</h1>
          <span className="text-sm text-text-tertiary">{quotes.length} total</span>
        </div>
        {quotes.length > 0 && (
          <button className="btn btn-ghost" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {quotes.length > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <GlassCard className="!p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">{filtered.length}</div>
                <div className="text-xs text-text-tertiary">Showing</div>
              </div>
            </GlassCard>
            <GlassCard className="!p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  ${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}K` : totalValue.toFixed(0)}
                </div>
                <div className="text-xs text-text-tertiary">Total Value</div>
              </div>
            </GlassCard>
            <GlassCard className="!p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  ${acceptedValue >= 1000 ? `${(acceptedValue / 1000).toFixed(0)}K` : acceptedValue.toFixed(0)}
                </div>
                <div className="text-xs text-text-tertiary">Won Value</div>
              </div>
            </GlassCard>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <select
              className="!w-32 !text-xs !py-1.5"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              className="!w-36 !text-xs !py-1.5"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="task_order">Task Orders</option>
              <option value="proposal">Proposals</option>
            </select>
          </div>
        </>
      )}

      {quotes.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No saved quotes yet</h3>
          <p className="text-text-tertiary text-sm mb-5 max-w-md mx-auto">
            Create a Task Order Quote for one-off jobs or build a Full Proposal from your workloading data, then click "Save" to track it here.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/quote" className="btn btn-primary no-underline">
              <FileText className="w-4 h-4" />
              New Task Order
            </Link>
            <Link to="/proposal" className="btn btn-ghost no-underline">
              <FileStack className="w-4 h-4" />
              New Proposal
            </Link>
          </div>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-text-tertiary">No quotes match your filters</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {[...filtered].reverse().map((q) => {
            const Icon = TYPE_ICONS[q.quoteType] ?? FileText
            return (
              <GlassCard key={q.id} className="!p-0 glass-hover">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{q.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status]}`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(q.createdAt)}
                      </span>
                      <span>{q.quoteType === 'proposal' ? 'Full Proposal' : 'Task Order'}</span>
                      {q.contractRef && <span>Ref: {q.contractRef}</span>}
                      {q.location && <span>{q.location}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-accent font-mono font-bold">
                      <DollarSign className="w-4 h-4" />
                      {q.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {q.totalHours.toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      className="!w-24 !text-xs !py-1"
                      value={q.status}
                      onChange={(e) => updateStatus(q.id, e.target.value as Quote['status'])}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      className="p-1.5 text-text-tertiary hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => duplicateQuote(q)}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => setDeleteQuoteId(q.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteQuoteId !== null}
        title="Delete Quote"
        message="This will permanently remove this saved quote. This cannot be undone."
        confirmLabel="Delete Quote"
        onConfirm={() => {
          if (deleteQuoteId) deleteQuote(deleteQuoteId)
          setDeleteQuoteId(null)
        }}
        onCancel={() => setDeleteQuoteId(null)}
      />
    </motion.div>
  )
}
