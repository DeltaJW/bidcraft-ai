import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  UserCog,
  RotateCcw,
  Download,
  Clock,
  Users,
  AlertTriangle,
  DollarSign,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, burdenProfilesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'

// ---- Types ----

interface ShiftConfig {
  label: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  enabled: boolean
}

// ---- Helpers ----

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtNum(n: number, decimals = 1): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtTime(hour: number, minute: number): string {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'AM' : 'PM'
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`
}

function timeToInputValue(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function parseTimeInput(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  return { hour: h, minute: m }
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SHIFT_COLORS = [
  'bg-accent/60',
  'bg-emerald-500/60',
  'bg-amber-500/60',
]

const DEFAULT_SHIFTS: ShiftConfig[] = [
  { label: 'Day', startHour: 6, startMinute: 0, endHour: 14, endMinute: 0, enabled: true },
  { label: 'Swing', startHour: 14, startMinute: 0, endHour: 22, endMinute: 0, enabled: false },
  { label: 'Night', startHour: 22, startMinute: 0, endHour: 6, endMinute: 0, enabled: false },
]

// ---- Component ----

export default function CrewScheduler() {
  const quotes = useStore(quotesStore)
  const burdenProfiles = useStore(burdenProfilesStore)

  // Inputs
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [totalAnnualHours, setTotalAnnualHours] = useState<number>(0)
  const [workDaysPerYear, setWorkDaysPerYear] = useState<number>(260)
  const [productiveHoursPerDay, setProductiveHoursPerDay] = useState<number>(6.5)
  const [shiftCount, setShiftCount] = useState<number>(1)
  const [shifts, setShifts] = useState<ShiftConfig[]>(() => DEFAULT_SHIFTS.map((s) => ({ ...s })))
  const [maxHoursBeforeOT, setMaxHoursBeforeOT] = useState<number>(40)
  const [otMultiplier, setOtMultiplier] = useState<number>(1.5)
  const [absenteeRate, setAbsenteeRate] = useState<number>(10)
  const [selectedBurdenId, setSelectedBurdenId] = useState<string>('')

  // Derived shift list based on count
  const activeShifts = useMemo(() => shifts.slice(0, shiftCount), [shifts, shiftCount])

  // Update shift count and toggle enabled flags
  const handleShiftCountChange = useCallback(
    (count: number) => {
      setShiftCount(count)
      setShifts((prev) =>
        prev.map((s, i) => ({ ...s, enabled: i < count })),
      )
    },
    [],
  )

  // Update a shift property
  const updateShift = useCallback((index: number, field: keyof ShiftConfig, value: string | number | boolean) => {
    setShifts((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const handleShiftTimeChange = useCallback((index: number, which: 'start' | 'end', value: string) => {
    const { hour, minute } = parseTimeInput(value)
    setShifts((prev) => {
      const next = [...prev]
      if (which === 'start') {
        next[index] = { ...next[index], startHour: hour, startMinute: minute }
      } else {
        next[index] = { ...next[index], endHour: hour, endMinute: minute }
      }
      return next
    })
  }, [])

  // Pull from saved quote
  const handleQuoteSelect = useCallback(
    (quoteId: string) => {
      setSelectedQuoteId(quoteId)
      if (!quoteId) return
      const q = quotes.find((q) => q.id === quoteId)
      if (q) {
        setTotalAnnualHours(q.totalHours)
      }
    },
    [quotes],
  )

  // Reset
  const handleReset = useCallback(() => {
    setSelectedQuoteId('')
    setTotalAnnualHours(0)
    setWorkDaysPerYear(260)
    setProductiveHoursPerDay(6.5)
    setShiftCount(1)
    setShifts(DEFAULT_SHIFTS.map((s) => ({ ...s })))
    setMaxHoursBeforeOT(40)
    setOtMultiplier(1.5)
    setAbsenteeRate(10)
    setSelectedBurdenId('')
  }, [])

  // ---- Calculations ----

  const calc = useMemo(() => {
    if (totalAnnualHours <= 0 || workDaysPerYear <= 0 || productiveHoursPerDay <= 0) {
      return null
    }

    // Daily hours needed
    const dailyHoursNeeded = totalAnnualHours / workDaysPerYear

    // Hours per shift per day
    const hoursPerShift = dailyHoursNeeded / shiftCount

    // Workers per shift (raw)
    const workersPerShiftRaw = hoursPerShift / productiveHoursPerDay
    const workersPerShift = Math.ceil(workersPerShiftRaw)

    // Total workers before absentee
    const totalWorkersBase = workersPerShift * shiftCount

    // Absentee buffer
    const absenteeWorkers = Math.ceil(totalWorkersBase * (absenteeRate / 100))
    const totalHeadcount = totalWorkersBase + absenteeWorkers

    // Weekly hours per worker
    const weeksPerYear = workDaysPerYear / 5 // assuming 5-day work weeks
    const weeklyHoursPerWorker = (totalAnnualHours / totalWorkersBase) / weeksPerYear

    // Overtime calculation
    const otHoursPerWorkerPerWeek = Math.max(0, weeklyHoursPerWorker - maxHoursBeforeOT)
    const regularHoursPerWorkerPerWeek = weeklyHoursPerWorker - otHoursPerWorkerPerWeek
    const totalOTHoursPerWeek = otHoursPerWorkerPerWeek * totalWorkersBase

    // Cost calculations
    const selectedProfile = burdenProfiles.find((p) => p.id === selectedBurdenId)
    const burdenedRate = selectedProfile?.computedRate ?? 0
    const baseWage = selectedProfile?.baseWage ?? 0

    // Annual hours
    const annualOTHoursPerWorker = otHoursPerWorkerPerWeek * weeksPerYear

    // OT cost premium (extra cost beyond regular rate for OT hours)
    const otPremiumPerHour = baseWage * (otMultiplier - 1)
    const annualOTPremium = annualOTHoursPerWorker * otPremiumPerHour * totalWorkersBase

    // Annual labor cost
    const annualLaborCost = burdenedRate > 0
      ? (totalAnnualHours * burdenedRate) + annualOTPremium
      : 0

    return {
      dailyHoursNeeded,
      hoursPerShift,
      workersPerShiftRaw,
      workersPerShift,
      totalWorkersBase,
      absenteeWorkers,
      totalHeadcount,
      weeklyHoursPerWorker,
      weeksPerYear,
      regularHoursPerWorkerPerWeek,
      otHoursPerWorkerPerWeek,
      totalOTHoursPerWeek,
      annualOTPremium,
      annualLaborCost,
      burdenedRate,
      baseWage,
      selectedProfile,
    }
  }, [
    totalAnnualHours,
    workDaysPerYear,
    productiveHoursPerDay,
    shiftCount,
    absenteeRate,
    maxHoursBeforeOT,
    otMultiplier,
    selectedBurdenId,
    burdenProfiles,
  ])

  const hasInput = totalAnnualHours > 0

  // ---- CSV Export ----

  const handleExport = useCallback(() => {
    if (!calc) return
    const headers = ['Metric', 'Value']
    const rows: (string | number)[][] = [
      ['Total Annual Hours', totalAnnualHours],
      ['Work Days per Year', workDaysPerYear],
      ['Productive Hours/Worker/Day', productiveHoursPerDay],
      ['Number of Shifts', shiftCount],
      ['Workers per Shift', calc.workersPerShift],
      ['Total Workers (before buffer)', calc.totalWorkersBase],
      ['Absentee Buffer (' + absenteeRate + '%)', calc.absenteeWorkers],
      ['Total Headcount', calc.totalHeadcount],
      ['Weekly Hours per Worker', calc.weeklyHoursPerWorker.toFixed(1)],
      ['OT Hours per Worker/Week', calc.otHoursPerWorkerPerWeek.toFixed(1)],
      ['Total OT Hours/Week', calc.totalOTHoursPerWeek.toFixed(1)],
      ['OT Cost Premium (Annual)', calc.annualOTPremium.toFixed(2)],
      ['Annual Labor Cost', calc.annualLaborCost.toFixed(2)],
    ]
    downloadCSV('crew-schedule', headers, rows)
  }, [calc, totalAnnualHours, workDaysPerYear, productiveHoursPerDay, shiftCount, absenteeRate])

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="mb-2">
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Planning</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Crew Scheduling Calculator</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Calculate shift staffing requirements from workload hours. Determine headcount, overtime, and labor costs per shift.
        </p>
      </motion.div>

      {/* Main Layout: inputs left 2/3 + summary right 1/3 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8"
      >
        {/* Left Column: Inputs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Workload Inputs */}
          <GlassCard title="Workload Hours" subtitle="Total annual hours to staff">
            {/* Pull from saved quote */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Auto-fill from Saved Quote
              </label>
              <select
                className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={selectedQuoteId}
                onChange={(e) => handleQuoteSelect(e.target.value)}
              >
                <option value="">-- Enter manually --</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({fmtNum(q.totalHours, 0)} hrs)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Total Annual Hours
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={totalAnnualHours || ''}
                  onChange={(e) => setTotalAnnualHours(Number(e.target.value))}
                  placeholder="e.g. 12000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Work Days / Year
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={workDaysPerYear}
                  onChange={(e) => setWorkDaysPerYear(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Productive Hrs / Worker / Day
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={productiveHoursPerDay}
                  onChange={(e) => setProductiveHoursPerDay(Number(e.target.value))}
                />
              </div>
            </div>
          </GlassCard>

          {/* Shift Configuration */}
          <GlassCard title="Shift Structure" subtitle="Configure shifts per day and timing">
            {/* Shift count selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Shifts per Day
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      shiftCount === n
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-default'
                    }`}
                    onClick={() => handleShiftCountChange(n)}
                  >
                    {n} Shift{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Shift time cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {shifts.map((shift, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    idx < shiftCount
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border-subtle bg-surface-2/30 opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full ${SHIFT_COLORS[idx]}`} />
                    <input
                      className="bg-transparent text-sm font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-accent/40 w-full"
                      value={shift.label}
                      onChange={(e) => updateShift(idx, 'label', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Start Time</label>
                      <input
                        type="time"
                        className="w-full bg-surface-2 border border-border-default rounded px-2 py-1.5 text-text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                        value={timeToInputValue(shift.startHour, shift.startMinute)}
                        onChange={(e) => handleShiftTimeChange(idx, 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">End Time</label>
                      <input
                        type="time"
                        className="w-full bg-surface-2 border border-border-default rounded px-2 py-1.5 text-text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                        value={timeToInputValue(shift.endHour, shift.endMinute)}
                        onChange={(e) => handleShiftTimeChange(idx, 'end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Overtime & Absentee Rules */}
          <GlassCard title="Overtime & Absentee Rules">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Max Hrs/Week before OT
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  step={1}
                  className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={maxHoursBeforeOT}
                  onChange={(e) => setMaxHoursBeforeOT(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  OT Multiplier
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={3}
                    step={0.1}
                    className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                    value={otMultiplier}
                    onChange={(e) => setOtMultiplier(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">x</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Absentee Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                    value={absenteeRate}
                    onChange={(e) => setAbsenteeRate(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">%</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Burden Profile Selection */}
          <GlassCard title="Labor Cost Basis" subtitle="Select a burden profile to calculate annual labor cost">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Burden Profile
                </label>
                <select
                  className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={selectedBurdenId}
                  onChange={(e) => setSelectedBurdenId(e.target.value)}
                >
                  <option value="">-- None (skip cost calc) --</option>
                  {burdenProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.computedRate ? `(${fmtMoney(p.computedRate)}/hr)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {calc?.selectedProfile && (
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>Base Wage: <span className="font-mono text-text-primary">{fmtMoney(calc.baseWage)}/hr</span></span>
                  <span>Burdened: <span className="font-mono text-text-primary">{fmtMoney(calc.burdenedRate)}/hr</span></span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Actions row */}
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost text-sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            {calc && (
              <button className="btn btn-primary text-sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Summary (sticky) */}
        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-6">
            {calc ? (
              <GlassCard variant="brand" title="Staffing Summary">
                <div className="space-y-4">
                  {/* Workers per shift */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-tertiary">Workers per Shift</p>
                      <p className="text-2xl font-bold font-mono text-text-primary">
                        {calc.workersPerShift}
                      </p>
                      <p className="text-xs text-text-disabled">
                        {fmtNum(calc.workersPerShiftRaw, 2)} raw, rounded up
                      </p>
                    </div>
                  </div>

                  {/* Total headcount */}
                  <div className="flex items-start gap-3">
                    <UserCog className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-tertiary">Total Headcount (incl. buffer)</p>
                      <p className="text-2xl font-bold font-mono text-text-primary">
                        {calc.totalHeadcount}
                      </p>
                      <p className="text-xs text-text-disabled">
                        {calc.totalWorkersBase} base + {calc.absenteeWorkers} absentee ({absenteeRate}%)
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border-subtle pt-3" />

                  {/* Weekly hours */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-tertiary">Weekly Hours per Worker</p>
                      <p className="text-xl font-bold font-mono text-text-primary">
                        {fmtNum(calc.weeklyHoursPerWorker)} hrs
                      </p>
                    </div>
                  </div>

                  {/* Overtime */}
                  {calc.otHoursPerWorkerPerWeek > 0 ? (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Overtime per Worker / Week</p>
                        <p className="text-xl font-bold font-mono text-rose-400">
                          {fmtNum(calc.otHoursPerWorkerPerWeek)} hrs
                        </p>
                        <p className="text-xs text-text-disabled">
                          {fmtNum(calc.totalOTHoursPerWeek)} total OT hrs/week ({otMultiplier}x)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Overtime</p>
                        <p className="text-sm font-semibold text-emerald-400">No overtime needed</p>
                      </div>
                    </div>
                  )}

                  {/* OT Cost Premium */}
                  {calc.annualOTPremium > 0 && calc.burdenedRate > 0 && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Annual OT Cost Premium</p>
                        <p className="text-lg font-bold font-mono text-rose-400">
                          {fmtMoney(calc.annualOTPremium)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Annual Labor Cost */}
                  {calc.burdenedRate > 0 && (
                    <>
                      <div className="border-t border-border-subtle pt-3" />
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-text-tertiary">Annual Labor Cost</p>
                          <p className="text-2xl font-bold font-mono text-accent">
                            {fmtMoney(calc.annualLaborCost)}
                          </p>
                          <p className="text-xs text-text-disabled">
                            Using {calc.selectedProfile?.name} profile
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {!calc.burdenedRate && (
                    <>
                      <div className="border-t border-border-subtle pt-3" />
                      <p className="text-xs text-text-disabled italic">
                        Select a burden profile to calculate labor costs.
                      </p>
                    </>
                  )}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="flex flex-col items-center justify-center py-12">
                <UserCog className="w-10 h-10 text-text-disabled mb-3" />
                <p className="text-sm text-text-tertiary text-center">
                  Enter workload hours to see staffing calculations.
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </motion.div>

      {/* Visual Week Grid */}
      {calc && hasInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard title="Weekly Shift Grid" subtitle="7-day view of shift coverage">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-tertiary text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-3 font-medium w-32">Shift</th>
                    {DAY_NAMES.map((day) => (
                      <th key={day} className="text-center py-3 px-3 font-medium">
                        {day}
                      </th>
                    ))}
                    <th className="text-center py-3 px-3 font-medium">Workers</th>
                  </tr>
                </thead>
                <tbody>
                  {activeShifts.map((shift, idx) => {
                    // Determine which days this shift is staffed
                    // Assume work days fill Mon-Fri first, then Sat/Sun for 6-7 day operations
                    const daysPerWeek = Math.min(7, Math.ceil(workDaysPerYear / 52))
                    const staffedDays = DAY_NAMES.map((_, dayIdx) => dayIdx < daysPerWeek)

                    return (
                      <tr key={idx} className="border-t border-border-subtle">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${SHIFT_COLORS[idx]}`} />
                            <div>
                              <span className="font-medium text-text-primary text-sm">{shift.label}</span>
                              <p className="text-xs text-text-disabled">
                                {fmtTime(shift.startHour, shift.startMinute)} - {fmtTime(shift.endHour, shift.endMinute)}
                              </p>
                            </div>
                          </div>
                        </td>
                        {staffedDays.map((staffed, dayIdx) => (
                          <td key={dayIdx} className="py-3 px-3 text-center">
                            {staffed ? (
                              <div
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${SHIFT_COLORS[idx]} text-white font-bold text-sm`}
                              >
                                {calc.workersPerShift}
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-2/50 text-text-disabled text-sm">
                                --
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                          {calc.workersPerShift}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Total row */}
                  <tr className="border-t-2 border-accent/30 bg-accent/5">
                    <td className="py-3 px-3 font-bold text-accent">Total</td>
                    {DAY_NAMES.map((_, dayIdx) => {
                      const daysPerWeek = Math.min(7, Math.ceil(workDaysPerYear / 52))
                      const staffed = dayIdx < daysPerWeek
                      return (
                        <td key={dayIdx} className="py-3 px-3 text-center font-mono font-bold text-accent">
                          {staffed ? calc.totalWorkersBase : '--'}
                        </td>
                      )
                    })}
                    <td className="py-3 px-3 text-center font-mono font-bold text-accent">
                      {calc.totalWorkersBase}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grid legend */}
            <div className="flex items-center flex-wrap gap-4 mt-4 pt-3 border-t border-border-subtle">
              {activeShifts.map((shift, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${SHIFT_COLORS[idx]}`} />
                  <span className="text-xs text-text-secondary">
                    {shift.label} ({fmtTime(shift.startHour, shift.startMinute)} - {fmtTime(shift.endHour, shift.endMinute)})
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-disabled">
                  + {calc.absenteeWorkers} absentee buffer = {calc.totalHeadcount} total headcount
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Empty state */}
      {!hasInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <UserCog className="w-12 h-12 text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Enter workload hours to begin</h3>
            <p className="text-text-tertiary text-sm mb-2 max-w-md mx-auto text-center">
              Enter total annual hours manually or select a saved quote to auto-fill.
              The calculator will determine shift staffing, headcount, and labor costs.
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
