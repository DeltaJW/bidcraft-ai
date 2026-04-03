import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Receipt,
  Plus,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Trash2,
  X,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { contractPLStore, quotesStore, useStore } from '@/data/mockStore'
import type { ContractPL as ContractPLType, PLMonth } from '@/types'

// ---- helpers ----

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function fmt(n: number): string {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function pct(n: number): string {
  return n.toFixed(1) + '%'
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10) - 1]} ${y}`
}

type Health = 'green' | 'red' | 'blue' | 'none'

function getContractHealth(contract: ContractPLType): { health: Health; label: string; variance: number } {
  if (contract.months.length === 0) return { health: 'none', label: 'No Data', variance: 0 }

  const monthCount = contract.months.length
  const budgetPerMonth = contract.bidTotal / 12

  const ytdActual = contract.months.reduce((s, m) => s + m.actualLabor + m.actualMaterials + m.actualOverhead, 0)
  const ytdBudget = budgetPerMonth * monthCount
  const variance = ytdBudget > 0 ? ((ytdActual - ytdBudget) / ytdBudget) * 100 : 0

  if (Math.abs(variance) <= 5) return { health: 'green', label: 'On Budget', variance }
  if (variance > 5) return { health: 'red', label: 'Over Budget', variance }
  return { health: 'blue', label: 'Under Budget', variance }
}

const HEALTH_COLORS: Record<Health, string> = {
  green: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
  red: 'bg-rose-400/20 text-rose-400 border-rose-400/30',
  blue: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  none: 'bg-text-disabled/20 text-text-tertiary border-border-subtle',
}


// ---- component ----

export default function ContractPL() {
  const contracts = useStore(contractPLStore)
  const quotes = useStore(quotesStore)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newQuoteId, setNewQuoteId] = useState('')
  const [newBidLabor, setNewBidLabor] = useState(0)
  const [newBidMaterials, setNewBidMaterials] = useState(0)

  // Month entry state
  const [addMonth, setAddMonth] = useState('')
  const [addLabor, setAddLabor] = useState(0)
  const [addMaterials, setAddMaterials] = useState(0)
  const [addOverhead, setAddOverhead] = useState(0)
  const [addNotes, setAddNotes] = useState('')

  const selected = contracts.find((c) => c.id === selectedId) ?? null

  // Auto-fill from quote
  function onQuoteSelect(quoteId: string) {
    setNewQuoteId(quoteId)
    const q = quotes.find((x) => x.id === quoteId)
    if (q) {
      setNewBidLabor(q.totalLabor)
      setNewBidMaterials(q.totalMaterials)
    }
  }

  function handleCreate() {
    if (!newName.trim()) return
    const bidTotal = newBidLabor + newBidMaterials
    const entry: ContractPLType = {
      id: uid(),
      name: newName.trim(),
      quoteId: newQuoteId || null,
      bidLaborAnnual: newBidLabor,
      bidMaterialsAnnual: newBidMaterials,
      bidTotal,
      months: [],
      createdAt: new Date().toISOString(),
    }
    contractPLStore.update((prev) => [...prev, entry])
    setSelectedId(entry.id)
    setShowCreate(false)
    setNewName('')
    setNewQuoteId('')
    setNewBidLabor(0)
    setNewBidMaterials(0)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this P&L tracker? This cannot be undone.')) return
    contractPLStore.update((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleAddMonth() {
    if (!selected || !addMonth) return
    // Prevent duplicate months
    if (selected.months.some((m) => m.month === addMonth)) {
      alert('That month already has an entry. Edit the existing one instead.')
      return
    }
    const newM: PLMonth = {
      id: uid(),
      month: addMonth,
      actualLabor: addLabor,
      actualMaterials: addMaterials,
      actualOverhead: addOverhead,
      notes: addNotes,
    }
    contractPLStore.update((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, months: [...c.months, newM].sort((a, b) => a.month.localeCompare(b.month)) }
          : c
      )
    )
    setAddMonth('')
    setAddLabor(0)
    setAddMaterials(0)
    setAddOverhead(0)
    setAddNotes('')
  }

  function handleDeleteMonth(monthId: string) {
    if (!selected) return
    contractPLStore.update((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, months: c.months.filter((m) => m.id !== monthId) } : c
      )
    )
  }

  // ---- Calculations for selected contract ----
  const monthCount = selected?.months.length ?? 0
  const budgetPerMonth = selected ? selected.bidTotal / 12 : 0
  const budgetLaborPerMonth = selected ? selected.bidLaborAnnual / 12 : 0
  const budgetMaterialsPerMonth = selected ? selected.bidMaterialsAnnual / 12 : 0

  const ytdActualLabor = selected?.months.reduce((s, m) => s + m.actualLabor, 0) ?? 0
  const ytdActualMaterials = selected?.months.reduce((s, m) => s + m.actualMaterials, 0) ?? 0
  const ytdActualOverhead = selected?.months.reduce((s, m) => s + m.actualOverhead, 0) ?? 0
  const ytdActualTotal = ytdActualLabor + ytdActualMaterials + ytdActualOverhead

  const ytdBudgetLabor = budgetLaborPerMonth * monthCount
  const ytdBudgetMaterials = budgetMaterialsPerMonth * monthCount
  const ytdBudgetTotal = budgetPerMonth * monthCount

  const projectedAnnual = monthCount > 0 ? (ytdActualTotal / monthCount) * 12 : 0

  const actualMargin = projectedAnnual > 0 && selected
    ? ((selected.bidTotal - projectedAnnual) / selected.bidTotal) * 100
    : 0

  const totalVariance = ytdActualTotal - ytdBudgetTotal
  const laborVariance = ytdActualLabor - ytdBudgetLabor
  const materialsVariance = ytdActualMaterials - ytdBudgetMaterials

  // Chart: max value for scaling bars
  const chartMax = selected
    ? Math.max(
        budgetPerMonth,
        ...selected.months.map((m) => m.actualLabor + m.actualMaterials + m.actualOverhead)
      ) * 1.1 || 1
    : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      <div className="mb-2">
        <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Operations</p>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Contract P&L Tracker</h1>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Track actual costs against bid estimates. See where you're making money and where you're bleeding.
      </p>

      {/* ============ Contract Cards ============ */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Tracked Contracts</h2>
        <button className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {contracts.length === 0 && !showCreate ? (
        <GlassCard className="text-center py-12 mb-6">
          <Receipt className="w-10 h-10 text-text-disabled mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">No contracts tracked yet. Create your first P&L entry to start monitoring actual costs vs bid.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create P&L Tracker
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {contracts.map((c) => {
            const { health, label, variance } = getContractHealth(c)
            const isSelected = c.id === selectedId
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`glass p-4 text-left transition-all cursor-pointer border-2 ${
                  isSelected ? 'border-accent' : 'border-transparent hover:border-border-subtle'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-primary truncate pr-2">{c.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${HEALTH_COLORS[health]}`}>
                    {label}
                  </span>
                </div>
                <div className="text-xs text-text-tertiary space-y-0.5">
                  <div>Bid: <span className="font-mono text-text-secondary">{fmt(c.bidTotal)}</span></div>
                  <div>Months tracked: <span className="font-mono text-text-secondary">{c.months.length}</span></div>
                  {health !== 'none' && (
                    <div>
                      Variance:{' '}
                      <span className={`font-mono font-semibold ${variance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {variance > 0 ? '+' : ''}{pct(variance)}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ============ Create Modal ============ */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New P&L Tracker</h2>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Contract Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. GSA Building 44 — Year 2"
                />
              </div>

              {quotes.length > 0 && (
                <div>
                  <label className="label">Link to Saved Quote (optional)</label>
                  <select value={newQuoteId} onChange={(e) => onQuoteSelect(e.target.value)}>
                    <option value="">-- None (enter manually) --</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} -- {fmt(q.grandTotal)}
                      </option>
                    ))}
                  </select>
                  <p className="helper-text">Auto-fills bid numbers from the quote</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Bid Labor (Annual $)</label>
                  <input
                    type="number"
                    value={newBidLabor || ''}
                    onChange={(e) => setNewBidLabor(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Bid Materials (Annual $)</label>
                  <input
                    type="number"
                    value={newBidMaterials || ''}
                    onChange={(e) => setNewBidMaterials(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-3">
                <span className="text-xs text-text-tertiary">Bid Total: </span>
                <span className="font-mono font-semibold text-accent">{fmt(newBidLabor + newBidMaterials)}</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
                  Create Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ Selected Contract Detail ============ */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Header */}
            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="btn btn-ghost p-1"
                    title="Back to list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{selected.name}</h2>
                    {selected.quoteId && (
                      <p className="text-xs text-text-tertiary">
                        Linked to quote: {quotes.find((q) => q.id === selected.quoteId)?.title ?? selected.quoteId}
                      </p>
                    )}
                  </div>
                </div>
                <button className="btn btn-danger text-xs py-1 px-3" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </button>
              </div>
            </GlassCard>

            {/* Bid vs Actual Comparison */}
            <GlassCard title="Bid vs Actual (YTD)" subtitle={`${monthCount} month${monthCount !== 1 ? 's' : ''} of data`}>
              {monthCount === 0 ? (
                <p className="text-text-tertiary text-sm py-4 text-center">Add monthly data below to see comparisons.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="numeric">YTD Budget</th>
                      <th className="numeric">YTD Actual</th>
                      <th className="numeric">Variance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">Labor</td>
                      <td className="numeric font-mono">{fmt(ytdBudgetLabor)}</td>
                      <td className="numeric font-mono">{fmt(ytdActualLabor)}</td>
                      <td className={`numeric font-mono font-semibold ${laborVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {laborVariance > 0 ? '+' : ''}{fmt(laborVariance)}
                      </td>
                      <td>
                        <VarianceBadge variance={laborVariance} budget={ytdBudgetLabor} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Materials</td>
                      <td className="numeric font-mono">{fmt(ytdBudgetMaterials)}</td>
                      <td className="numeric font-mono">{fmt(ytdActualMaterials)}</td>
                      <td className={`numeric font-mono font-semibold ${materialsVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {materialsVariance > 0 ? '+' : ''}{fmt(materialsVariance)}
                      </td>
                      <td>
                        <VarianceBadge variance={materialsVariance} budget={ytdBudgetMaterials} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Overhead</td>
                      <td className="numeric font-mono text-text-tertiary">--</td>
                      <td className="numeric font-mono">{fmt(ytdActualOverhead)}</td>
                      <td className={`numeric font-mono font-semibold ${ytdActualOverhead > 0 ? 'text-rose-400' : 'text-text-tertiary'}`}>
                        {ytdActualOverhead > 0 ? `+${fmt(ytdActualOverhead)}` : '--'}
                      </td>
                      <td>
                        {ytdActualOverhead > 0 ? (
                          <span className="badge badge-red">Unbudgeted</span>
                        ) : (
                          <span className="badge">--</span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-border-subtle font-bold">
                      <td>Total</td>
                      <td className="numeric font-mono">{fmt(ytdBudgetTotal)}</td>
                      <td className="numeric font-mono">{fmt(ytdActualTotal)}</td>
                      <td className={`numeric font-mono ${totalVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {totalVariance > 0 ? '+' : ''}{fmt(totalVariance)}
                      </td>
                      <td>
                        <VarianceBadge variance={totalVariance} budget={ytdBudgetTotal} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </GlassCard>

            {/* Monthly Bar Chart */}
            {monthCount > 0 && (
              <GlassCard title="Monthly Actuals vs Budget" subtitle="Bar height = actual cost, dashed line = monthly budget">
                <div className="flex items-end gap-2 h-48">
                  {selected.months.map((m) => {
                    const actual = m.actualLabor + m.actualMaterials + m.actualOverhead
                    const barHeight = chartMax > 0 ? (actual / chartMax) * 100 : 0
                    const budgetHeight = chartMax > 0 ? (budgetPerMonth / chartMax) * 100 : 0
                    const isOver = actual > budgetPerMonth * 1.05
                    const isUnder = actual < budgetPerMonth * 0.95
                    const barColor = isOver ? 'bg-rose-400/70' : isUnder ? 'bg-blue-400/70' : 'bg-emerald-400/70'

                    return (
                      <div key={m.id} className="flex-1 flex flex-col items-center relative group">
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-1 border border-border-subtle rounded px-2 py-1 text-[10px] font-mono text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {fmt(actual)}
                        </div>
                        {/* Budget line */}
                        <div
                          className="absolute left-0 right-0 border-t-2 border-dashed border-accent/50"
                          style={{ bottom: `${budgetHeight}%` }}
                        />
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t ${barColor} transition-all`}
                          style={{ height: `${barHeight}%`, minHeight: actual > 0 ? '4px' : '0' }}
                        />
                        {/* Label */}
                        <span className="text-[10px] text-text-tertiary mt-1 truncate w-full text-center">
                          {monthLabel(m.month).split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-text-tertiary">
                  <span className="flex items-center gap-1"><span className="w-3 h-1 bg-emerald-400/70 rounded" /> On budget</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1 bg-rose-400/70 rounded" /> Over budget</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-400/70 rounded" /> Under budget</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-accent/50" style={{ width: 12 }} /> Budget line</span>
                </div>
              </GlassCard>
            )}

            {/* Monthly Data Entry */}
            <GlassCard
              title="Monthly Data Entry"
              subtitle="Enter actual costs for each month"
            >
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <div>
                  <label className="label">Month</label>
                  <input
                    type="month"
                    value={addMonth}
                    onChange={(e) => setAddMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Labor ($)</label>
                  <input
                    type="number"
                    value={addLabor || ''}
                    onChange={(e) => setAddLabor(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Materials ($)</label>
                  <input
                    type="number"
                    value={addMaterials || ''}
                    onChange={(e) => setAddMaterials(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Overhead ($)</label>
                  <input
                    type="number"
                    value={addOverhead || ''}
                    onChange={(e) => setAddOverhead(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleAddMonth}
                    disabled={!addMonth}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="e.g. overtime due to special event cleanup"
                />
              </div>

              {/* Existing month entries */}
              {selected.months.length > 0 && (
                <div className="mt-5">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="numeric">Labor</th>
                        <th className="numeric">Materials</th>
                        <th className="numeric">Overhead</th>
                        <th className="numeric">Total</th>
                        <th>Notes</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.months.map((m) => {
                        const total = m.actualLabor + m.actualMaterials + m.actualOverhead
                        const isOver = total > budgetPerMonth * 1.05
                        const isUnder = total < budgetPerMonth * 0.95
                        return (
                          <tr key={m.id}>
                            <td className="font-semibold">{monthLabel(m.month)}</td>
                            <td className="numeric font-mono">{fmt(m.actualLabor)}</td>
                            <td className="numeric font-mono">{fmt(m.actualMaterials)}</td>
                            <td className="numeric font-mono">{fmt(m.actualOverhead)}</td>
                            <td className={`numeric font-mono font-semibold ${isOver ? 'text-rose-400' : isUnder ? 'text-blue-400' : 'text-emerald-400'}`}>
                              {fmt(total)}
                            </td>
                            <td className="text-xs text-text-tertiary max-w-[150px] truncate">{m.notes || '--'}</td>
                            <td>
                              <button
                                className="btn btn-ghost p-1 text-text-tertiary hover:text-error-light"
                                onClick={() => handleDeleteMonth(m.id)}
                                title="Remove month"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            {/* Variance Analysis */}
            {monthCount > 0 && (
              <GlassCard title="Variance Analysis" subtitle="Where are you over or under?">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <VarianceCard
                    label="Labor"
                    variance={laborVariance}
                    budget={ytdBudgetLabor}
                    actual={ytdActualLabor}
                  />
                  <VarianceCard
                    label="Materials"
                    variance={materialsVariance}
                    budget={ytdBudgetMaterials}
                    actual={ytdActualMaterials}
                  />
                  <VarianceCard
                    label="Total (incl. overhead)"
                    variance={totalVariance}
                    budget={ytdBudgetTotal}
                    actual={ytdActualTotal}
                  />
                </div>
              </GlassCard>
            )}
          </div>

          {/* ============ Summary Sidebar ============ */}
          <div className="flex flex-col gap-5">
            <GlassCard title="Key Metrics" className="sticky top-8">
              <div className="flex flex-col gap-4">
                {/* Overall health */}
                {(() => {
                  const { health, label } = getContractHealth(selected)
                  return (
                    <div className={`p-4 rounded-lg text-center border ${HEALTH_COLORS[health]}`}>
                      {health === 'green' && <CheckCircle className="w-8 h-8 mx-auto mb-2" />}
                      {health === 'red' && <AlertTriangle className="w-8 h-8 mx-auto mb-2" />}
                      {health === 'blue' && <TrendingDown className="w-8 h-8 mx-auto mb-2" />}
                      {health === 'none' && <Receipt className="w-8 h-8 mx-auto mb-2 text-text-disabled" />}
                      <h3 className="text-lg font-bold">{label}</h3>
                    </div>
                  )
                })()}

                {/* Metrics */}
                <div className="flex flex-col gap-2 text-sm">
                  <MetricRow label="Bid Total (Annual)" value={fmt(selected.bidTotal)} />
                  <MetricRow label="Bid Labor" value={fmt(selected.bidLaborAnnual)} />
                  <MetricRow label="Bid Materials" value={fmt(selected.bidMaterialsAnnual)} />
                  <div className="border-t border-border-subtle my-1" />
                  <MetricRow label="YTD Actual" value={fmt(ytdActualTotal)} highlight={totalVariance > 0 ? 'red' : 'green'} />
                  <MetricRow label="YTD Budget" value={fmt(ytdBudgetTotal)} />
                  <MetricRow
                    label="YTD Variance"
                    value={`${totalVariance > 0 ? '+' : ''}${fmt(totalVariance)}`}
                    highlight={totalVariance > 0 ? 'red' : totalVariance < 0 ? 'green' : undefined}
                  />
                  <div className="border-t border-border-subtle my-1" />
                  <MetricRow
                    label="Projected Annual"
                    value={monthCount > 0 ? fmt(projectedAnnual) : '--'}
                    highlight={projectedAnnual > selected.bidTotal ? 'red' : 'green'}
                  />
                  <MetricRow
                    label="Projected vs Bid"
                    value={monthCount > 0 ? `${projectedAnnual > selected.bidTotal ? '+' : ''}${fmt(projectedAnnual - selected.bidTotal)}` : '--'}
                    highlight={projectedAnnual > selected.bidTotal ? 'red' : 'green'}
                  />
                  <div className="border-t border-border-subtle my-1" />
                  <MetricRow
                    label="Actual Margin"
                    value={monthCount > 0 ? pct(actualMargin) : '--'}
                    highlight={actualMargin < 0 ? 'red' : actualMargin > 0 ? 'green' : undefined}
                  />
                </div>

                {/* Projected warning */}
                {monthCount > 0 && projectedAnnual > selected.bidTotal && (
                  <div className="p-3 rounded-lg bg-rose-400/10 border border-rose-400/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-semibold text-rose-400">Projected Loss</span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      At the current run rate, you'll exceed the bid by{' '}
                      <strong className="text-rose-400 font-mono">{fmt(projectedAnnual - selected.bidTotal)}</strong> over 12 months.
                    </p>
                  </div>
                )}

                {monthCount > 0 && projectedAnnual <= selected.bidTotal && (
                  <div className="p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">On Track</span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      Projected to come in{' '}
                      <strong className="text-emerald-400 font-mono">{fmt(selected.bidTotal - projectedAnnual)}</strong> under bid.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ---- Sub-components ----

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'green' }) {
  const colorClass = highlight === 'red' ? 'text-rose-400' : highlight === 'green' ? 'text-emerald-400' : 'text-text-primary'
  return (
    <div className="flex justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className={`font-mono font-semibold ${colorClass}`}>{value}</span>
    </div>
  )
}

function VarianceBadge({ variance, budget }: { variance: number; budget: number }) {
  const pctVar = budget > 0 ? Math.abs(variance / budget) * 100 : 0
  if (budget === 0 && variance === 0) return <span className="badge">--</span>
  if (pctVar <= 5) return <span className="badge badge-green">On Track</span>
  if (variance > 0) return <span className="badge badge-red">+{pctVar.toFixed(0)}% Over</span>
  return <span className="badge badge-blue">{pctVar.toFixed(0)}% Under</span>
}

function VarianceCard({ label, variance, budget, actual }: { label: string; variance: number; budget: number; actual: number }) {
  const pctVar = budget > 0 ? (variance / budget) * 100 : 0
  const isOver = variance > 0 && Math.abs(pctVar) > 5
  const isUnder = variance < 0 && Math.abs(pctVar) > 5

  return (
    <div className={`p-4 rounded-lg border ${
      isOver ? 'bg-rose-400/5 border-rose-400/20' : isUnder ? 'bg-blue-400/5 border-blue-400/20' : 'bg-emerald-400/5 border-emerald-400/20'
    }`}>
      <h4 className="text-xs font-semibold text-text-secondary mb-2">{label}</h4>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Budget</span>
          <span className="font-mono text-text-secondary">{fmt(budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Actual</span>
          <span className="font-mono text-text-secondary">{fmt(actual)}</span>
        </div>
        <div className="border-t border-border-subtle my-1" />
        <div className="flex justify-between items-center">
          <span className="text-text-secondary font-medium">Variance</span>
          <span className={`font-mono font-bold ${isOver ? 'text-rose-400' : isUnder ? 'text-blue-400' : 'text-emerald-400'}`}>
            {variance > 0 ? '+' : ''}{fmt(variance)} ({pctVar > 0 ? '+' : ''}{pctVar.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
