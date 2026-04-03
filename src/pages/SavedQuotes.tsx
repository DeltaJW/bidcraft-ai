import { motion } from 'framer-motion'
import { FolderOpen, FileText, FileStack, Trash2, Clock, DollarSign } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, useStore } from '@/data/mockStore'
import type { Quote } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-navy-700/30 text-navy-300',
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

  function deleteQuote(id: string) {
    quotesStore.update((prev) => prev.filter((q) => q.id !== id))
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-white">Saved Quotes</h1>
        <span className="text-sm text-navy-500 ml-2">{quotes.length} total</span>
      </div>

      {quotes.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-navy-600 mx-auto mb-4" />
          <p className="text-navy-400 text-lg mb-2">No saved quotes yet</p>
          <p className="text-navy-500 text-sm">
            Create a Task Order Quote or Full Proposal and click "Save" to see it here
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {[...quotes].reverse().map((q) => {
            const Icon = TYPE_ICONS[q.quoteType] ?? FileText
            return (
              <GlassCard key={q.id} className="!p-0 glass-hover">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate">{q.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status]}`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-navy-500">
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
                    <div className="text-xs text-navy-500">
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
                      className="p-1.5 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => deleteQuote(q.id)}
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
    </motion.div>
  )
}
