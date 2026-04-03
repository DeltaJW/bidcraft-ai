import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import { contractsStore, useStore } from '@/data/mockStore'
import { toast } from '@/components/Toast'
import type { Contract } from '@/types'

// ---- helpers ----

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}


function formatDate(iso: string): string {
  const d = parseDate(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES: Record<Contract['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  expiring: 'bg-amber-500/15 text-amber-400',
  expired: 'bg-red-500/15 text-red-400',
  pending: 'bg-blue-500/15 text-blue-400',
}

const STATUS_LABELS: Record<Contract['status'], string> = {
  active: 'Active',
  expiring: 'Expiring',
  expired: 'Expired',
  pending: 'Pending',
}

interface CalendarEvent {
  date: string
  type: 'start' | 'end' | 'wd-expiration'
  contract: Contract
}

const EVENT_COLORS: Record<CalendarEvent['type'], string> = {
  start: 'bg-emerald-400',
  end: 'bg-red-400',
  'wd-expiration': 'bg-amber-400',
}

const EVENT_LABELS: Record<CalendarEvent['type'], string> = {
  start: 'Start',
  end: 'End',
  'wd-expiration': 'WD Exp',
}

// ---- Empty contract form ----
function emptyContract(): Omit<Contract, 'id' | 'createdAt'> {
  return {
    name: '',
    contractNumber: '',
    clientName: '',
    startDate: '',
    endDate: '',
    optionYears: 0,
    currentOptionYear: 0,
    wdNumber: '',
    wdExpirationDate: '',
    annualValue: 0,
    status: 'pending',
    notes: '',
  }
}

// ---- Component ----

export default function ContractCalendar() {
  const contracts = useStore(contractsStore)
  const today = new Date()
  const todayKey = toDateKey(today)

  // Calendar navigation
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyContract())
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Build event map for calendar
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    function addEvent(date: string, type: CalendarEvent['type'], contract: Contract) {
      if (!date) return
      if (!map[date]) map[date] = []
      map[date].push({ date, type, contract })
    }
    contracts.forEach((c) => {
      addEvent(c.startDate, 'start', c)
      addEvent(c.endDate, 'end', c)
      addEvent(c.wdExpirationDate, 'wd-expiration', c)
    })
    return map
  }, [contracts])

  // Upcoming events (next 90 days)
  const upcomingEvents = useMemo(() => {
    const events: CalendarEvent[] = []
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90)
    contracts.forEach((c) => {
      const pairs: [string, CalendarEvent['type']][] = [
        [c.startDate, 'start'],
        [c.endDate, 'end'],
        [c.wdExpirationDate, 'wd-expiration'],
      ]
      pairs.forEach(([dateStr, type]) => {
        if (!dateStr) return
        const d = parseDate(dateStr)
        if (d >= today && d <= cutoff) {
          events.push({ date: dateStr, type, contract: c })
        }
      })
    })
    events.sort((a, b) => a.date.localeCompare(b.date))
    return events
  }, [contracts, todayKey])

  // Stats
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'expiring')
  const expiringWithin30 = contracts.filter((c) => {
    if (!c.endDate) return false
    const d = daysBetween(today, parseDate(c.endDate))
    return d >= 0 && d <= 30
  })
  const expiringWithin60 = contracts.filter((c) => {
    if (!c.endDate) return false
    const d = daysBetween(today, parseDate(c.endDate))
    return d > 30 && d <= 60
  })
  const expiringWithin90 = contracts.filter((c) => {
    if (!c.endDate) return false
    const d = daysBetween(today, parseDate(c.endDate))
    return d > 60 && d <= 90
  })
  const totalAnnualValue = activeContracts.reduce((s, c) => s + c.annualValue, 0)

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const totalDays = daysInMonth(viewYear, viewMonth)
  const prevMonthDays = daysInMonth(viewYear, viewMonth - 1)
  const cells: { day: number; inMonth: boolean; dateKey: string }[] = []

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const d = new Date(viewYear, viewMonth - 1, day)
    cells.push({ day, inMonth: false, dateKey: toDateKey(d) })
  }
  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(viewYear, viewMonth, d)
    cells.push({ day: d, inMonth: true, dateKey: toDateKey(date) })
  }
  // Next month padding (fill to 42 cells = 6 rows)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(viewYear, viewMonth + 1, d)
    cells.push({ day: d, inMonth: false, dateKey: toDateKey(date) })
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // Form handlers
  function openAddForm() {
    setEditId(null)
    setForm(emptyContract())
    setShowForm(true)
  }

  function openEditForm(c: Contract) {
    setEditId(c.id)
    setForm({
      name: c.name,
      contractNumber: c.contractNumber,
      clientName: c.clientName,
      startDate: c.startDate,
      endDate: c.endDate,
      optionYears: c.optionYears,
      currentOptionYear: c.currentOptionYear,
      wdNumber: c.wdNumber,
      wdExpirationDate: c.wdExpirationDate,
      annualValue: c.annualValue,
      status: c.status,
      notes: c.notes,
    })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.name.trim() || !form.contractNumber.trim()) {
      toast('Name and contract number are required.', 'error')
      return
    }
    if (editId) {
      contractsStore.update((prev) =>
        prev.map((c) => c.id === editId ? { ...c, ...form } : c)
      )
      toast('Contract updated.', 'success')
    } else {
      const newContract: Contract = {
        ...form,
        id: `contract-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      contractsStore.update((prev) => [...prev, newContract])
      toast('Contract added.', 'success')
    }
    setShowForm(false)
    setEditId(null)
    setForm(emptyContract())
  }

  function handleDelete(id: string) {
    contractsStore.update((prev) => prev.filter((c) => c.id !== id))
    toast('Contract deleted.', 'success')
    setDeleteId(null)
  }

  function updateField<K extends keyof Omit<Contract, 'id' | 'createdAt'>>(key: K, value: Omit<Contract, 'id' | 'createdAt'>[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold text-text-primary">Contract Calendar</h1>
            </div>
            <p className="text-text-secondary text-lg">Track contract dates, expirations, and wage determinations.</p>
          </div>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus className="w-4 h-4" />
            Add Contract
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4 mb-8">
        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{activeContracts.length}</div>
            <div className="text-xs text-text-tertiary">Active Contracts</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{expiringWithin30.length}</div>
            <div className="text-xs text-text-tertiary">Expiring in 30 Days</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {expiringWithin60.length + expiringWithin90.length}
            </div>
            <div className="text-xs text-text-tertiary">Expiring 60-90 Days</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">{fmt(totalAnnualValue)}</div>
            <div className="text-xs text-text-tertiary">Total Annual Value</div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Alert Badges */}
      {(expiringWithin30.length > 0 || expiringWithin60.length > 0 || expiringWithin90.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="flex gap-3 mb-6 flex-wrap">
          {expiringWithin30.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">
                {expiringWithin30.length} contract{expiringWithin30.length !== 1 ? 's' : ''} expiring within 30 days
              </span>
            </div>
          )}
          {expiringWithin60.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                {expiringWithin60.length} expiring within 60 days
              </span>
            </div>
          )}
          {expiringWithin90.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">
                {expiringWithin90.length} expiring within 90 days
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Calendar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
        <GlassCard>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost p-2" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold text-text-primary min-w-[200px] text-center">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <button className="btn btn-ghost p-2" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button className="btn btn-ghost text-xs" onClick={goToday}>Today</button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-text-tertiary py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((cell, idx) => {
              const events = eventMap[cell.dateKey] || []
              const isToday = cell.dateKey === todayKey
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] p-1.5 rounded-lg border transition-colors ${
                    cell.inMonth
                      ? 'border-border-subtle bg-surface-1/50'
                      : 'border-transparent bg-transparent opacity-30'
                  } ${isToday ? 'ring-1 ring-accent/50 bg-accent/5' : ''}`}
                >
                  <div className={`text-xs font-mono mb-1 ${
                    isToday ? 'text-accent font-bold' : cell.inMonth ? 'text-text-secondary' : 'text-text-disabled'
                  }`}>
                    {cell.day}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {events.slice(0, 3).map((ev, i) => (
                      <div
                        key={i}
                        className={`w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate ${EVENT_COLORS[ev.type]}/20`}
                        title={`${EVENT_LABELS[ev.type]}: ${ev.contract.name}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${EVENT_COLORS[ev.type]}`} />
                        <span className="truncate text-text-primary">{ev.contract.name}</span>
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-text-tertiary px-1">+{events.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-text-tertiary">Contract Start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-text-tertiary">Contract End</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-text-tertiary">WD Expiration</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Upcoming Events (next 90 days) + Contracts List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4 mb-8">
        {/* Upcoming Events */}
        <GlassCard title="Upcoming Events" subtitle="Next 90 days">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 text-text-disabled mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">No upcoming events in the next 90 days.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {upcomingEvents.map((ev, i) => {
                const daysAway = daysBetween(today, parseDate(ev.date))
                return (
                  <div key={i} className="glass p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${EVENT_COLORS[ev.type]}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">{ev.contract.name}</p>
                        <p className="text-xs text-text-tertiary">
                          {EVENT_LABELS[ev.type]} &middot; {formatDate(ev.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold flex-shrink-0 ml-3 ${
                      daysAway <= 30 ? 'text-red-400' : daysAway <= 60 ? 'text-amber-400' : 'text-text-secondary'
                    }`}>
                      {daysAway}d
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* All Contracts */}
        <GlassCard title="All Contracts" subtitle={`${contracts.length} total`}>
          {contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-text-disabled mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">No contracts yet. Add your first contract above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {[...contracts].sort((a, b) => a.endDate.localeCompare(b.endDate)).map((c) => (
                <div key={c.id} className="glass glass-hover p-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{c.name}</p>
                      <p className="text-xs text-text-tertiary truncate">
                        {c.contractNumber} &middot; {c.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                    <span className="font-mono text-xs font-bold text-accent">{fmt(c.annualValue)}</span>
                    <button
                      className="btn btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEditForm(c)}
                      aria-label="Edit contract"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="btn btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                      onClick={() => setDeleteId(c.id)}
                      aria-label="Delete contract"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Add/Edit Contract Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="glass relative w-full max-w-2xl p-6 rounded-xl border border-accent/20 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editId ? 'Edit Contract' : 'Add Contract'}
                </h3>
                <button
                  className="btn btn-ghost p-1.5"
                  onClick={() => { setShowForm(false); setEditId(null); setForm(emptyContract()) }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Contract Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="e.g. GSA Custodial - Building 42"
                  />
                </div>

                {/* Contract Number */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Contract Number *</label>
                  <input
                    type="text"
                    value={form.contractNumber}
                    onChange={(e) => updateField('contractNumber', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="e.g. GS-07F-1234X"
                  />
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Client Name</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="e.g. General Services Administration"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Option Years */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Option Years</label>
                  <input
                    type="number"
                    min={0}
                    value={form.optionYears}
                    onChange={(e) => updateField('optionYears', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Current Option Year */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Current Option Year</label>
                  <input
                    type="number"
                    min={0}
                    value={form.currentOptionYear}
                    onChange={(e) => updateField('currentOptionYear', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* WD Number */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">WD Number</label>
                  <input
                    type="text"
                    value={form.wdNumber}
                    onChange={(e) => updateField('wdNumber', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="e.g. 2015-4281"
                  />
                </div>

                {/* WD Expiration Date */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">WD Expiration Date</label>
                  <input
                    type="date"
                    value={form.wdExpirationDate}
                    onChange={(e) => updateField('wdExpirationDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Annual Value */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Annual Value ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.annualValue || ''}
                    onChange={(e) => updateField('annualValue', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="0.00"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as Contract['status'])}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expiring">Expiring</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-default text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost"
                  onClick={() => { setShowForm(false); setEditId(null); setForm(emptyContract()) }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  <CheckCircle className="w-4 h-4" />
                  {editId ? 'Update Contract' : 'Add Contract'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Contract"
        message="This contract and all its data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
