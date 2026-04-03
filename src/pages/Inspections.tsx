import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  Printer,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { quotesStore, inspectionsStore, companyStore, useStore } from '@/data/mockStore'
import type { InspectionItem, InspectionRecord, Quote } from '@/types'

// ---- Rating helpers ----

const RATING_LABELS: Record<number, string> = {
  1: 'Unacceptable',
  2: 'Poor',
  3: 'Acceptable',
  4: 'Good',
  5: 'Excellent',
}

const RATING_COLORS: Record<number, string> = {
  0: 'bg-surface-3 text-text-disabled',
  1: 'bg-red-500/80 text-white',
  2: 'bg-orange-500/80 text-white',
  3: 'bg-amber-500/80 text-white',
  4: 'bg-emerald-500/80 text-white',
  5: 'bg-green-500/80 text-white',
}

const RATING_BORDER_COLORS: Record<number, string> = {
  0: 'border-transparent',
  1: 'border-red-500/40',
  2: 'border-orange-500/40',
  3: 'border-amber-500/40',
  4: 'border-emerald-500/40',
  5: 'border-green-500/40',
}

function scoreColor(score: number): string {
  if (score >= 4.5) return 'text-green-400'
  if (score >= 3.5) return 'text-emerald-400'
  if (score >= 2.5) return 'text-amber-400'
  if (score >= 1.5) return 'text-orange-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 4.5) return 'bg-green-500/15'
  if (score >= 3.5) return 'bg-emerald-500/15'
  if (score >= 2.5) return 'bg-amber-500/15'
  if (score >= 1.5) return 'bg-orange-500/15'
  return 'bg-red-500/15'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---- Build inspection items from a quote's tasks ----

function buildItemsFromQuote(quote: Quote): InspectionItem[] {
  // Quotes store tasks flat — group them by detecting zone-like patterns
  // or use a single "General" zone. We look for zone prefixes in taskName like "Zone: ..."
  return quote.tasks.map((t, idx) => {
    // Try to extract zone from task name patterns like "Lobby - Vacuum" or just use General
    const dashIdx = t.taskName.indexOf(' - ')
    let zone = 'General'
    let task = t.taskName
    if (dashIdx > 0 && dashIdx < 30) {
      zone = t.taskName.slice(0, dashIdx).trim()
      task = t.taskName.slice(dashIdx + 3).trim()
    }

    return {
      id: `insp-item-${Date.now()}-${idx}`,
      zone,
      task,
      frequency: '', // Quotes don't store frequency directly on QuoteTask
      rating: 0,
      pass: true,
      notes: '',
    }
  })
}

// ---- Component ----

export default function Inspections() {
  const quotes = useStore(quotesStore)
  const inspections = useStore(inspectionsStore)
  const company = useStore(companyStore)

  // Form state
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [items, setItems] = useState<InspectionItem[]>([])
  const [overallNotes, setOverallNotes] = useState('')
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)

  // Derive zones from items
  const zones = Array.from(new Set(items.map((i) => i.zone)))

  // Stats
  const ratedItems = items.filter((i) => i.rating > 0)
  const overallScore =
    ratedItems.length > 0
      ? ratedItems.reduce((s, i) => s + i.rating, 0) / ratedItems.length
      : 0
  const passCount = items.filter((i) => i.pass).length
  const failCount = items.filter((i) => !i.pass).length

  // When user selects a quote, build items
  function handleQuoteSelect(quoteId: string) {
    setSelectedQuoteId(quoteId)
    if (!quoteId) {
      setItems([])
      return
    }
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote) return
    setItems(buildItemsFromQuote(quote))
    setCollapsedZones(new Set())
  }

  // Update a single item
  function updateItem(id: string, patch: Partial<InspectionItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    )
  }

  // Toggle zone collapse
  function toggleZone(zone: string) {
    setCollapsedZones((prev) => {
      const next = new Set(prev)
      if (next.has(zone)) next.delete(zone)
      else next.add(zone)
      return next
    })
  }

  // Save inspection
  function handleSave() {
    if (!selectedQuoteId) {
      toast('Select a quote first', 'error')
      return
    }
    if (!inspectorName.trim()) {
      toast('Enter inspector name', 'error')
      return
    }
    const quote = quotes.find((q) => q.id === selectedQuoteId)
    if (!quote) return

    const record: InspectionRecord = {
      id: `insp-${Date.now()}`,
      quoteId: selectedQuoteId,
      quoteTitle: quote.title,
      inspectorName: inspectorName.trim(),
      inspectionDate,
      items: [...items],
      overallScore: Math.round(overallScore * 100) / 100,
      notes: overallNotes,
      createdAt: new Date().toISOString(),
    }

    inspectionsStore.update((prev) => [...prev, record])
    toast('Inspection saved')
  }

  // Delete a saved inspection
  function handleDeleteInspection(id: string) {
    inspectionsStore.update((prev) => prev.filter((r) => r.id !== id))
    toast('Inspection deleted')
  }

  // Load a saved inspection back into the form
  function handleLoadInspection(record: InspectionRecord) {
    setSelectedQuoteId(record.quoteId)
    setInspectorName(record.inspectorName)
    setInspectionDate(record.inspectionDate)
    setItems(record.items.map((i) => ({ ...i })))
    setOverallNotes(record.notes)
    setCollapsedZones(new Set())
    setShowHistory(false)
    toast('Inspection loaded', 'info')
  }

  // Print
  function handlePrint() {
    window.print()
  }

  // Quotes with tasks
  const quotesWithTasks = quotes.filter((q) => q.tasks.length > 0)

  // ---- Empty state ----
  if (quotesWithTasks.length === 0 && inspections.length === 0) {
    return (
      <div className="max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-2">
            <p className="section-label">Operations</p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              QC Inspections
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            Generate inspection checklists from your saved quotes.
          </p>
        </motion.div>
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <ClipboardCheck className="w-12 h-12 text-text-disabled mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No quotes with tasks available
          </h3>
          <p className="text-text-tertiary text-sm mb-5 max-w-md mx-auto text-center">
            Create and save a quote with line-item tasks first, then come back
            here to generate an inspection checklist.
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <>
      {/* Screen view */}
      <div className="max-w-6xl no-print">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-2">
            <p className="section-label">Operations</p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              QC Inspections
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            Generate inspection checklists from your saved quotes.
          </p>
        </motion.div>

        {/* Top bar: quote select, inspector, date */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Select Quote
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => handleQuoteSelect(e.target.value)}
                >
                  <option value="">-- Choose a quote --</option>
                  {quotesWithTasks.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.tasks.length} tasks)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Inspection Date
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main content + sidebar layout */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Checklist — 3 cols */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {zones.map((zone) => {
                const zoneItems = items.filter((i) => i.zone === zone)
                const collapsed = collapsedZones.has(zone)
                const zoneRated = zoneItems.filter((i) => i.rating > 0)
                const zoneAvg =
                  zoneRated.length > 0
                    ? zoneRated.reduce((s, i) => s + i.rating, 0) /
                      zoneRated.length
                    : 0
                const zonePasses = zoneItems.filter((i) => i.pass).length
                const zoneFails = zoneItems.filter((i) => !i.pass).length

                return (
                  <GlassCard key={zone} className="!p-0">
                    {/* Zone header */}
                    <button
                      className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer text-left"
                      onClick={() => toggleZone(zone)}
                    >
                      <div className="flex items-center gap-3">
                        {collapsed ? (
                          <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-tertiary" />
                        )}
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                          {zone}
                        </h3>
                        <span className="text-xs text-text-tertiary">
                          {zoneItems.length} item
                          {zoneItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {zoneRated.length > 0 && (
                          <span
                            className={`text-xs font-mono font-bold ${scoreColor(zoneAvg)}`}
                          >
                            {zoneAvg.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {zonePasses}
                        </span>
                        {zoneFails > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <XCircle className="w-3 h-3" />
                            {zoneFails}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Zone items */}
                    {!collapsed && (
                      <div className="border-t border-border-subtle">
                        {zoneItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`p-4 ${idx < zoneItems.length - 1 ? 'border-b border-border-subtle' : ''}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                              {/* Task name + frequency */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary">
                                  {item.task}
                                </div>
                                {item.frequency && (
                                  <div className="text-xs text-text-tertiary mt-0.5">
                                    {item.frequency}
                                  </div>
                                )}
                              </div>

                              {/* Rating buttons */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <button
                                    key={r}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      item.rating === r
                                        ? `${RATING_COLORS[r]} ${RATING_BORDER_COLORS[r]} scale-110`
                                        : 'bg-surface-3 text-text-secondary border-transparent hover:bg-surface-2'
                                    }`}
                                    onClick={() =>
                                      updateItem(item.id, { rating: r })
                                    }
                                    title={RATING_LABELS[r]}
                                  >
                                    {r}
                                  </button>
                                ))}
                                {item.rating > 0 && (
                                  <span
                                    className={`ml-2 text-xs font-medium ${scoreColor(item.rating)}`}
                                  >
                                    {RATING_LABELS[item.rating]}
                                  </span>
                                )}
                              </div>

                              {/* Pass/Fail toggle */}
                              <button
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                  item.pass
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                                }`}
                                onClick={() =>
                                  updateItem(item.id, { pass: !item.pass })
                                }
                              >
                                {item.pass ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {item.pass ? 'Pass' : 'Fail'}
                              </button>
                            </div>

                            {/* Notes */}
                            <input
                              type="text"
                              className="!text-xs !py-1.5"
                              placeholder="Notes for this item..."
                              value={item.notes}
                              onChange={(e) =>
                                updateItem(item.id, { notes: e.target.value })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                )
              })}

              {/* Overall notes */}
              <GlassCard title="Overall Notes">
                <textarea
                  rows={3}
                  placeholder="General observations, follow-up actions, or comments..."
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                />
              </GlassCard>
            </div>

            {/* Right sidebar — 1 col */}
            <div className="flex flex-col gap-4">
              {/* Overall Score */}
              <GlassCard className="text-center">
                <div
                  className={`w-20 h-20 rounded-full ${scoreBg(overallScore)} flex items-center justify-center mx-auto mb-3`}
                >
                  <span
                    className={`text-2xl font-bold font-mono ${scoreColor(overallScore)}`}
                  >
                    {ratedItems.length > 0 ? overallScore.toFixed(1) : '--'}
                  </span>
                </div>
                <div className="text-sm font-medium text-text-primary mb-1">
                  Overall Score
                </div>
                <div className="text-xs text-text-tertiary">
                  {ratedItems.length} of {items.length} rated
                </div>
              </GlassCard>

              {/* Pass/Fail counts */}
              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-text-secondary">Pass</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {passCount}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-text-secondary">Fail</span>
                  </div>
                  <span className="font-mono font-bold text-red-400">
                    {failCount}
                  </span>
                </div>
                {/* Progress bar */}
                {items.length > 0 && (
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 transition-all"
                      style={{
                        width: `${(passCount / items.length) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-400 transition-all"
                      style={{
                        width: `${(failCount / items.length) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </GlassCard>

              {/* Rating distribution */}
              <GlassCard title="Rating Distribution">
                {[5, 4, 3, 2, 1].map((r) => {
                  const count = items.filter((i) => i.rating === r).length
                  const pct = items.length > 0 ? (count / items.length) * 100 : 0
                  return (
                    <div key={r} className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${RATING_COLORS[r]}`}
                      >
                        {r}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${RATING_COLORS[r]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-text-tertiary w-6 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </GlassCard>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button className="btn btn-primary w-full" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Save Inspection
                </button>
                <button className="btn btn-ghost w-full" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Saved Inspection History */}
        {inspections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard
              title="Inspection History"
              subtitle={`${inspections.length} saved inspection${inspections.length !== 1 ? 's' : ''}`}
              action={
                <button
                  className="text-xs text-accent hover:text-accent-hover transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Collapse' : 'Expand'}
                </button>
              }
            >
              {showHistory && (
                <div className="flex flex-col gap-2">
                  {[...inspections]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((record) => (
                      <div
                        key={record.id}
                        className="glass glass-hover p-4 flex flex-wrap items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-text-primary truncate">
                            {record.quoteTitle}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(record.inspectionDate)}
                            </span>
                            <span>Inspector: {record.inspectorName}</span>
                            <span>{record.items.length} items</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`text-lg font-bold font-mono ${scoreColor(record.overallScore)}`}
                          >
                            {record.overallScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            score
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="btn btn-ghost !py-1 !px-2 !text-xs"
                            onClick={() => handleLoadInspection(record)}
                          >
                            Load
                          </button>
                          <button
                            className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                            onClick={() => handleDeleteInspection(record.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Print view — hidden on screen, visible in print */}
      <div className="hidden print:block" ref={printRef}>
        <PrintableInspection
          company={company}
          quoteTitle={
            quotes.find((q) => q.id === selectedQuoteId)?.title ?? ''
          }
          inspectorName={inspectorName}
          inspectionDate={inspectionDate}
          items={items}
          zones={zones}
          overallScore={overallScore}
          passCount={passCount}
          failCount={failCount}
          overallNotes={overallNotes}
        />
      </div>
    </>
  )
}

// ---- Printable inspection form ----

function PrintableInspection({
  company,
  quoteTitle,
  inspectorName,
  inspectionDate,
  items,
  zones,
  overallScore,
  passCount,
  failCount,
  overallNotes,
}: {
  company: { name: string; logoUrl: string | null; address: string; contactPhone: string; contactEmail: string }
  quoteTitle: string
  inspectorName: string
  inspectionDate: string
  items: InspectionItem[]
  zones: string[]
  overallScore: number
  passCount: number
  failCount: number
  overallNotes: string
}) {
  const ratedItems = items.filter((i) => i.rating > 0)
  const today = new Date(inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="print-quote max-w-3xl mx-auto bg-white p-10">
      {/* Letterhead Header */}
      <div className="quote-header">
        <div className="flex items-center gap-4">
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt=""
              style={{ height: '44pt', objectFit: 'contain' }}
            />
          )}
          <div>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '18pt',
                fontWeight: 700,
                color: '#17355E',
                margin: 0,
              }}
            >
              {company.name || 'Your Company Name'}
            </h1>
          </div>
        </div>
        <div className="company-info">
          {company.address && <div>{company.address}</div>}
          {company.contactPhone && <div>{company.contactPhone}</div>}
          {company.contactEmail && <div>{company.contactEmail}</div>}
        </div>
      </div>

      {/* Document Title */}
      <h2>QC INSPECTION CHECKLIST</h2>

      {/* Info Grid */}
      <div className="info-grid">
        <span className="info-label">Date:</span>
        <span className="info-value">{today}</span>
        <span className="info-label">Inspector:</span>
        <span className="info-value">{inspectorName || '--'}</span>
        <span className="info-label">Quote/Contract:</span>
        <span className="info-value">{quoteTitle || '--'}</span>
        <span className="info-label">Overall Score:</span>
        <span className="info-value" style={{ fontWeight: 700 }}>
          {ratedItems.length > 0 ? `${overallScore.toFixed(1)} / 5.0` : 'N/A'}
        </span>
        <span className="info-label">Pass / Fail:</span>
        <span className="info-value">
          {passCount} Pass / {failCount} Fail
        </span>
      </div>

      {/* Rating Legend */}
      <div
        style={{
          display: 'flex',
          gap: '12pt',
          marginBottom: '10pt',
          fontSize: '8.5pt',
          color: '#666',
        }}
      >
        <span>
          <strong>1</strong> = Unacceptable
        </span>
        <span>
          <strong>2</strong> = Poor
        </span>
        <span>
          <strong>3</strong> = Acceptable
        </span>
        <span>
          <strong>4</strong> = Good
        </span>
        <span>
          <strong>5</strong> = Excellent
        </span>
      </div>

      {/* Zones & Items */}
      {zones.map((zone) => {
        const zoneItems = items.filter((i) => i.zone === zone)
        return (
          <div key={zone} style={{ marginBottom: '14pt' }}>
            <h3>{zone}</h3>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Task</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Rating</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>
                    Pass/Fail
                  </th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {zoneItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.task}
                      {item.frequency && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '8pt',
                            color: '#888',
                          }}
                        >
                          {item.frequency}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {item.rating > 0
                        ? `${item.rating} - ${RATING_LABELS[item.rating]}`
                        : '--'}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        color: item.pass ? '#059669' : '#DC2626',
                      }}
                    >
                      {item.pass ? 'PASS' : 'FAIL'}
                    </td>
                    <td>{item.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Overall Notes */}
      {overallNotes && (
        <div style={{ marginTop: '10pt' }}>
          <h3>General Notes</h3>
          <p>{overallNotes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="signatures">
        <div>
          <div className="sig-line" />
          <div className="sig-name">Inspector Signature / Date</div>
        </div>
        <div>
          <div className="sig-line" />
          <div className="sig-name">Site Manager Signature / Date</div>
        </div>
      </div>

      {/* Footer */}
      <div className="doc-footer">
        <div className="footnote">
          Generated by BidCraft AI &mdash; QC Inspection Checklist
        </div>
      </div>
    </div>
  )
}
