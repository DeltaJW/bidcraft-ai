import { motion } from 'framer-motion'
import { FolderOpen, FileText, FileStack, Trash2, Clock, DollarSign, Copy, Filter, Download, GitBranch, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { quotesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'
import type { Quote } from '@/types'

const LOSS_REASONS = [
  'Price too high',
  'Incumbent advantage',
  'Technical score too low',
  'Late submission',
  'Set-aside requirement',
  'Scope mismatch',
  'No-bid (withdrew)',
  'Other',
] as const

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
  const [lossReasonModal, setLossReasonModal] = useState<{ quoteId: string } | null>(null)
  const [selectedLossReason, setSelectedLossReason] = useState<string>('')

  const filtered = quotes.filter((q) => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false
    if (filterType !== 'all' && q.quoteType !== filterType) return false
    return true
  })

  function deleteQuote(id: string) {
    const deletedQuote = quotes.find((q) => q.id === id)
    quotesStore.update((prev) => prev.filter((q) => q.id !== id))
    if (deletedQuote) {
      toast('Quote deleted', 'info', {
        label: 'Undo',
        onClick: () => {
          quotesStore.update((prev) => [...prev, deletedQuote])
          toast('Quote restored', 'success')
        },
      })
    }
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

  function createNewVersion(q: Quote) {
    const currentVersion = q.version ?? 1
    const newVersion: Quote = {
      ...q,
      id: `quote-${Date.now()}`,
      version: currentVersion + 1,
      parentQuoteId: q.parentQuoteId ?? q.id,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    // Mark the old one as superseded by keeping it as-is
    quotesStore.update((prev) => [...prev, newVersion])
    toast(`Created v${currentVersion + 1} of "${q.title}"`)
  }

  function updateStatus(id: string, status: Quote['status']) {
    if (status === 'rejected') {
      setLossReasonModal({ quoteId: id })
      setSelectedLossReason('')
      return
    }
    quotesStore.update((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status, lossReason: undefined } : q))
    )
  }

  function confirmLossReason() {
    if (!lossReasonModal || !selectedLossReason) return
    quotesStore.update((prev) =>
      prev.map((q) =>
        q.id === lossReasonModal.quoteId
          ? { ...q, status: 'rejected' as const, lossReason: selectedLossReason }
          : q
      )
    )
    toast(`Quote marked as rejected: ${selectedLossReason}`, 'info')
    setLossReasonModal(null)
    setSelectedLossReason('')
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
        <div>
          <p className="section-label">Pipeline</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Saved Quotes</h1>
            <span className="text-[11px] font-mono text-text-disabled">{quotes.length} total</span>
          </div>
        </div>
        {quotes.length > 0 && (
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary hover:border-border-strong transition-all" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {quotes.length > 0 && (
        <>
          {/* Stats row — stat-card style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="stat-card p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-4 h-4 text-accent" />
                <span className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled">Showing</span>
              </div>
              <div className="font-mono text-2xl font-bold text-text-primary tracking-tight">{filtered.length}</div>
            </div>
            <div className="stat-card p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled">Total Value</span>
              </div>
              <div className="font-mono text-2xl font-bold text-text-primary tracking-tight">
                ${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}K` : totalValue.toFixed(0)}
              </div>
            </div>
            <div className="stat-card p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled">Won Value</span>
              </div>
              <div className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">
                ${acceptedValue >= 1000 ? `${(acceptedValue / 1000).toFixed(0)}K` : acceptedValue.toFixed(0)}
              </div>
            </div>
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
                      {q.version && q.version > 1 && (
                        <span className="badge badge-purple">v{q.version}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status]}`}>
                        {q.status}
                      </span>
                      {q.status === 'rejected' && q.lossReason && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">
                          {q.lossReason}
                        </span>
                      )}
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
                      onClick={() => createNewVersion(q)}
                      title="New Version"
                    >
                      <GitBranch className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-text-tertiary hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => {
                        const subject = encodeURIComponent(q.title)
                        const body = encodeURIComponent(`Please find attached our ${q.quoteType === 'proposal' ? 'proposal' : 'quote'}: ${q.title}\n\nTotal: $${q.grandTotal.toLocaleString()}\nHours: ${q.totalHours.toFixed(1)}\n\nGenerated by BidCraft AI`)
                        window.open(`mailto:?subject=${subject}&body=${body}`)
                      }}
                      title="Email Quote"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-text-tertiary hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => duplicateQuote(q)}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => deleteQuote(q.id)}
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

      {/* Loss Reason Modal */}
      {lossReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 p-1 text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer"
              onClick={() => setLossReasonModal(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Loss Reason</h3>
            <p className="text-sm text-text-tertiary mb-4">Why was this quote rejected?</p>
            <div className="flex flex-col gap-2 mb-4">
              {LOSS_REASONS.map((reason) => (
                <button
                  key={reason}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border cursor-pointer ${
                    selectedLossReason === reason
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-transparent border-surface-3 text-text-secondary hover:border-text-tertiary'
                  }`}
                  onClick={() => setSelectedLossReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setLossReasonModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedLossReason}
                onClick={confirmLossReason}
              >
                Mark Rejected
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </motion.div>
  )
}
