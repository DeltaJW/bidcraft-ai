import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileOutput,
  Download,
  Info,
  RotateCcw,
  Table2,
  Grid3x3,
  FileSpreadsheet,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, burdenProfilesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'
import type { Quote, BurdenProfile } from '@/types'

// ---- Types ----

type ExportFormat = 'clin' | 'section_b' | 'cost_matrix'

interface YearData {
  label: string
  labor: number
  materials: number
  total: number
}

interface BurdenBreakdown {
  baseWage: number
  fringe: number
  payrollTaxes: number
  leave: number
  overhead: number
  profit: number
  totalBurdened: number
}

// ---- Constants ----

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string; icon: typeof FileSpreadsheet }[] = [
  {
    value: 'clin',
    label: 'CLIN-Structured Excel',
    desc: 'Contract Line Item Number format with labor categories, rates, hours, and extended costs per CLIN',
    icon: FileSpreadsheet,
  },
  {
    value: 'section_b',
    label: 'Section B Pricing Table',
    desc: 'Standard government pricing table: CLIN, Description, Quantity, Unit, Unit Price, Extended Price',
    icon: Table2,
  },
  {
    value: 'cost_matrix',
    label: 'Cost Summary Matrix',
    desc: 'Pricing matrix with cost elements as rows and performance periods as columns',
    icon: Grid3x3,
  },
]

const YEAR_LABELS = ['Base Year', 'Option Year 1', 'Option Year 2', 'Option Year 3', 'Option Year 4']
const CLIN_NUMBERS = ['0001', '0002', '0003', '0004', '0005']

// ---- Helpers ----

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function computeBurdenBreakdown(profile: BurdenProfile): BurdenBreakdown {
  const basePlusHW = profile.baseWage + profile.hwRate
  const ficaDollar = profile.baseWage * (profile.ficaPct / 100)
  const suiDollar = profile.baseWage * (profile.suiPct / 100)
  const wcDollar = profile.baseWage * (profile.wcPct / 100)
  const futaDollar = profile.baseWage * (profile.futaPct / 100)
  const payrollTaxes = ficaDollar + suiDollar + wcDollar + futaDollar

  const totalPaidDays = profile.vacationDays + profile.holidayDays + profile.sickDays
  const workDaysPerYear = 260
  const effectiveWorkDays = workDaysPerYear - totalPaidDays
  const leavePct = effectiveWorkDays > 0 ? (totalPaidDays / effectiveWorkDays) * 100 : 0
  const leaveDollar = (basePlusHW + payrollTaxes) * (leavePct / 100)

  const subtotal = basePlusHW + payrollTaxes + leaveDollar
  const gaDollar = subtotal * (profile.gaPct / 100)
  const preProfit = subtotal + gaDollar
  const feeDollar = preProfit * (profile.feePct / 100)
  const totalBurdened = preProfit + feeDollar

  return {
    baseWage: profile.baseWage,
    fringe: profile.hwRate,
    payrollTaxes,
    leave: leaveDollar,
    overhead: gaDollar,
    profit: feeDollar,
    totalBurdened,
  }
}

function buildYearData(
  quote: Quote,
  optionYears: number,
  escalationRate: number,
): YearData[] {
  const years: YearData[] = []
  let labor = quote.totalLabor
  let materials = quote.totalMaterials

  for (let i = 0; i <= optionYears; i++) {
    if (i > 0) {
      labor = labor * (1 + escalationRate / 100)
      materials = materials * (1 + escalationRate / 100)
    }
    years.push({
      label: YEAR_LABELS[i] || `Option Year ${i}`,
      labor,
      materials,
      total: labor + materials,
    })
  }
  return years
}

// ---- Export generators ----

function exportCLIN(quote: Quote, yearData: YearData[], profile: BurdenProfile | undefined) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const burdenedRate = burden ? burden.totalBurdened : 0
  const totalHours = quote.totalHours

  const headers = [
    'CLIN', 'Description', 'Labor Category', 'Hourly Rate',
    'Annual Hours', 'Extended Labor Cost', 'Materials', 'CLIN Total',
  ]

  const rows: (string | number)[][] = []

  yearData.forEach((year, idx) => {
    const clinNum = CLIN_NUMBERS[idx] || `${String(idx + 1).padStart(4, '0')}`

    // Individual task rows
    quote.tasks.forEach((task) => {
      const taskProportion = totalHours > 0 ? task.hours / totalHours : 0
      const taskLaborCost = year.labor * taskProportion
      const effectiveRate = task.hours > 0 ? taskLaborCost / task.hours : burdenedRate
      rows.push([
        clinNum,
        year.label,
        task.taskName,
        effectiveRate.toFixed(2),
        task.hours.toFixed(1),
        taskLaborCost.toFixed(2),
        '',
        '',
      ])
    })

    // Materials row
    if (year.materials > 0) {
      rows.push([
        clinNum,
        year.label,
        'Materials & Supplies',
        '',
        '',
        '',
        year.materials.toFixed(2),
        '',
      ])
    }

    // CLIN subtotal
    rows.push([
      clinNum,
      `${year.label} - SUBTOTAL`,
      '',
      '',
      totalHours > 0 ? totalHours.toFixed(1) : '',
      year.labor.toFixed(2),
      year.materials.toFixed(2),
      year.total.toFixed(2),
    ])

    // Blank separator
    rows.push(['', '', '', '', '', '', '', ''])
  })

  // Grand total row
  const grandTotal = yearData.reduce((s, y) => s + y.total, 0)
  const grandLabor = yearData.reduce((s, y) => s + y.labor, 0)
  const grandMaterials = yearData.reduce((s, y) => s + y.materials, 0)
  rows.push([
    '',
    'GRAND TOTAL',
    '',
    '',
    '',
    grandLabor.toFixed(2),
    grandMaterials.toFixed(2),
    grandTotal.toFixed(2),
  ])

  downloadCSV(`${quote.title}-CLIN-Pricing`, headers, rows)
}

function exportSectionB(quote: Quote, yearData: YearData[], profile: BurdenProfile | undefined) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const burdenedRate = burden ? burden.totalBurdened : 0
  const totalHours = quote.totalHours

  const headers = [
    'CLIN', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Extended Price',
  ]

  const rows: (string | number)[][] = []

  yearData.forEach((year, idx) => {
    const clinNum = CLIN_NUMBERS[idx] || `${String(idx + 1).padStart(4, '0')}`

    // Header row for the period
    rows.push([clinNum, `${year.label} Services`, '', '', '', ''])

    // Labor category rows
    quote.tasks.forEach((task) => {
      const taskProportion = totalHours > 0 ? task.hours / totalHours : 0
      const taskLaborCost = year.labor * taskProportion
      const effectiveRate = task.hours > 0 ? taskLaborCost / task.hours : burdenedRate
      rows.push([
        '',
        task.taskName,
        task.hours.toFixed(1),
        'Hours',
        effectiveRate.toFixed(2),
        taskLaborCost.toFixed(2),
      ])
    })

    // Materials
    if (quote.materials.length > 0) {
      quote.materials.forEach((mat) => {
        const escalatedUnitCost = idx === 0
          ? mat.unitCost
          : mat.unitCost * Math.pow(1 + (yearData.length > 1 ? ((yearData[1].total / yearData[0].total) - 1) : 0), idx)
        rows.push([
          '',
          mat.name,
          mat.quantity.toString(),
          mat.unit,
          escalatedUnitCost.toFixed(2),
          (mat.quantity * escalatedUnitCost).toFixed(2),
        ])
      })
    } else if (year.materials > 0) {
      rows.push([
        '',
        'Materials & Supplies',
        '1',
        'Lot',
        year.materials.toFixed(2),
        year.materials.toFixed(2),
      ])
    }

    // Period subtotal
    rows.push([
      clinNum,
      `${year.label} SUBTOTAL`,
      '',
      '',
      '',
      year.total.toFixed(2),
    ])

    rows.push(['', '', '', '', '', ''])
  })

  // Grand total
  const grandTotal = yearData.reduce((s, y) => s + y.total, 0)
  rows.push(['', 'GRAND TOTAL', '', '', '', grandTotal.toFixed(2)])

  downloadCSV(`${quote.title}-Section-B-Pricing`, headers, rows)
}

function exportCostMatrix(quote: Quote, yearData: YearData[], profile: BurdenProfile | undefined) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const totalHours = quote.totalHours

  // Columns: Cost Element, then each year
  const headers = ['Cost Element', ...yearData.map((y) => y.label)]

  const rows: (string | number)[][] = []

  if (burden && totalHours > 0) {
    // Direct labor by task
    quote.tasks.forEach((task) => {
      const taskProportion = totalHours > 0 ? task.hours / totalHours : 0
      const row: (string | number)[] = [`Direct Labor - ${task.taskName}`]
      yearData.forEach((year) => {
        // Base wage portion of labor cost
        const baseWagePortion = burden.baseWage / burden.totalBurdened
        row.push((year.labor * taskProportion * baseWagePortion).toFixed(2))
      })
      rows.push(row)
    })

    // Fringe
    const fringePct = burden.fringe / burden.totalBurdened
    rows.push([
      'Fringe Benefits (H&W)',
      ...yearData.map((y) => (y.labor * fringePct).toFixed(2)),
    ])

    // Payroll taxes
    const taxPct = burden.payrollTaxes / burden.totalBurdened
    rows.push([
      'Payroll Taxes (FICA/SUI/WC/FUTA)',
      ...yearData.map((y) => (y.labor * taxPct).toFixed(2)),
    ])

    // Leave
    const leavePct = burden.leave / burden.totalBurdened
    rows.push([
      'Paid Leave (Vacation/Holiday/Sick)',
      ...yearData.map((y) => (y.labor * leavePct).toFixed(2)),
    ])

    // Overhead / G&A
    const overheadPct = burden.overhead / burden.totalBurdened
    rows.push([
      'Overhead / G&A',
      ...yearData.map((y) => (y.labor * overheadPct).toFixed(2)),
    ])

    // Profit / Fee
    const profitPct = burden.profit / burden.totalBurdened
    rows.push([
      'Profit / Fee',
      ...yearData.map((y) => (y.labor * profitPct).toFixed(2)),
    ])
  } else {
    // No burden profile — just show total labor
    rows.push([
      'Direct Labor (total)',
      ...yearData.map((y) => y.labor.toFixed(2)),
    ])
  }

  // Materials
  rows.push([
    'Materials & Supplies',
    ...yearData.map((y) => y.materials.toFixed(2)),
  ])

  // Blank separator
  rows.push(['', ...yearData.map(() => '')])

  // Total
  rows.push([
    'TOTAL',
    ...yearData.map((y) => y.total.toFixed(2)),
  ])

  // Cumulative
  let cumulative = 0
  rows.push([
    'CUMULATIVE TOTAL',
    ...yearData.map((y) => {
      cumulative += y.total
      return cumulative.toFixed(2)
    }),
  ])

  downloadCSV(`${quote.title}-Cost-Summary-Matrix`, headers, rows)
}

// ---- Component ----

export default function GovExport() {
  const quotes = useStore(quotesStore)
  const burdenProfiles = useStore(burdenProfilesStore)

  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [optionYears, setOptionYears] = useState(2)
  const [escalationRate, setEscalationRate] = useState(3)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('clin')
  const [showTips, setShowTips] = useState(false)

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  )

  const linkedProfile = useMemo(() => {
    if (!selectedQuote) return null
    return burdenProfiles.find((bp) => bp.id === selectedQuote.burdenProfileId) ?? null
  }, [selectedQuote, burdenProfiles])

  const yearData = useMemo(() => {
    if (!selectedQuote) return []
    return buildYearData(selectedQuote, optionYears, escalationRate)
  }, [selectedQuote, optionYears, escalationRate])

  const grandTotal = useMemo(
    () => yearData.reduce((s, y) => s + y.total, 0),
    [yearData],
  )

  const handleExport = useCallback(() => {
    if (!selectedQuote) return
    switch (exportFormat) {
      case 'clin':
        exportCLIN(selectedQuote, yearData, linkedProfile ?? undefined)
        break
      case 'section_b':
        exportSectionB(selectedQuote, yearData, linkedProfile ?? undefined)
        break
      case 'cost_matrix':
        exportCostMatrix(selectedQuote, yearData, linkedProfile ?? undefined)
        break
    }
  }, [selectedQuote, yearData, linkedProfile, exportFormat])

  const handleReset = useCallback(() => {
    setSelectedQuoteId('')
    setOptionYears(2)
    setEscalationRate(3)
    setExportFormat('clin')
    setShowTips(false)
  }, [])

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="mb-2">
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Output</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Government Format Export</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Export proposals in CLIN-structured, Section B, or Cost Summary Matrix formats for government submissions.
        </p>
      </motion.div>

      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Left: Quote + Options */}
        <GlassCard title="Select Quote">
          {/* Quote picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Saved Quote
            </label>
            <select
              className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
            >
              <option value="">-- Select a quote --</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({fmtMoney(q.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          {/* Quote summary */}
          {selectedQuote && (
            <div className="p-3 bg-surface-2/50 border border-border-subtle rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-tertiary">Labor:</span>
                  <span className="ml-2 font-mono text-text-primary">{fmtMoney(selectedQuote.totalLabor)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Materials:</span>
                  <span className="ml-2 font-mono text-text-primary">{fmtMoney(selectedQuote.totalMaterials)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Hours:</span>
                  <span className="ml-2 font-mono text-text-primary">{selectedQuote.totalHours.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Tasks:</span>
                  <span className="ml-2 font-mono text-text-primary">{selectedQuote.tasks.length}</span>
                </div>
              </div>
              {linkedProfile && (
                <div className="mt-2 pt-2 border-t border-border-subtle text-xs text-text-tertiary">
                  Burden Profile: <span className="text-accent font-medium">{linkedProfile.name}</span>
                  {linkedProfile.computedRate && (
                    <span className="ml-2">({fmtMoney(linkedProfile.computedRate)}/hr)</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Option years */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Option Years
            </label>
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    optionYears === n
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-default'
                  }`}
                  onClick={() => setOptionYears(n)}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-text-tertiary ml-2">
                = {1 + optionYears} total year{optionYears > 0 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Escalation rate */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Annual Escalation Rate (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={15}
                step={0.5}
                className="w-24 bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={escalationRate}
                onChange={(e) => setEscalationRate(Number(e.target.value))}
              />
              <span className="text-sm text-text-tertiary">applied to both labor and materials</span>
            </div>
          </div>
        </GlassCard>

        {/* Right: Export Format */}
        <GlassCard title="Export Format">
          <div className="space-y-3 mb-4">
            {FORMAT_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setExportFormat(value)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  exportFormat === value
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border-subtle bg-surface-2/50 hover:bg-surface-3/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    exportFormat === value ? 'text-accent' : 'text-text-tertiary'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      exportFormat === value ? 'text-accent' : 'text-text-primary'
                    }`}>
                      {label}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost text-xs" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={() => setShowTips(!showTips)}
            >
              <Info className="w-3.5 h-3.5" />
              Gov Format Tips
            </button>
          </div>

          {/* Tips */}
          {showTips && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-text-secondary leading-relaxed"
            >
              <p className="font-semibold text-accent mb-1">Government Format Guide</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>CLIN-Structured</strong> is the standard for IDIQ and GSA task orders.
                  Each performance period gets its own CLIN (0001 = Base, 0002 = Option 1, etc.).
                </li>
                <li>
                  <strong>Section B Pricing Table</strong> maps directly to the solicitation's
                  Section B schedule. Include all labor categories and material line items.
                </li>
                <li>
                  <strong>Cost Summary Matrix</strong> is commonly required for cost-realism
                  evaluations. Shows your cost build-up: direct labor, fringe, overhead, G&A, and profit.
                </li>
                <li>
                  Escalation rates of 2-3% for labor are standard. Going above 4% requires
                  justification. Materials can run 3-5% due to supply chain factors.
                </li>
                <li>
                  All exports open directly in Excel for final formatting before submission.
                </li>
              </ul>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>

      {/* Preview + Download */}
      {selectedQuote && yearData.length > 0 && (
        <>
          {/* Summary bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <GlassCard variant="brand" className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Contract Value</p>
                <p className="text-3xl font-bold font-mono text-text-primary">{fmtMoney(grandTotal)}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {yearData.length} year{yearData.length > 1 ? 's' : ''} &middot;{' '}
                  {escalationRate}% annual escalation &middot;{' '}
                  {FORMAT_OPTIONS.find((f) => f.value === exportFormat)?.label}
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </GlassCard>
          </motion.div>

          {/* Preview table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <GlassCard title="Export Preview" subtitle={`${FORMAT_OPTIONS.find((f) => f.value === exportFormat)?.label} format`}>
              {exportFormat === 'clin' && (
                <CLINPreview quote={selectedQuote} yearData={yearData} profile={linkedProfile} />
              )}
              {exportFormat === 'section_b' && (
                <SectionBPreview quote={selectedQuote} yearData={yearData} profile={linkedProfile} />
              )}
              {exportFormat === 'cost_matrix' && (
                <CostMatrixPreview quote={selectedQuote} yearData={yearData} profile={linkedProfile} />
              )}
            </GlassCard>
          </motion.div>
        </>
      )}

      {/* Empty state */}
      {!selectedQuote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <FileOutput className="w-12 h-12 text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Select a quote to export</h3>
            <p className="text-text-tertiary text-sm mb-2 max-w-md mx-auto text-center">
              Choose a saved quote above, configure your option years and escalation rate,
              then pick your government export format to generate a properly structured CSV.
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}

// ---- Preview sub-components ----

function CLINPreview({ quote, yearData, profile }: { quote: Quote; yearData: YearData[]; profile: BurdenProfile | null }) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const burdenedRate = burden ? burden.totalBurdened : 0
  const totalHours = quote.totalHours

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-tertiary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium">CLIN</th>
            <th className="text-left py-3 px-3 font-medium">Description</th>
            <th className="text-left py-3 px-3 font-medium">Labor Category</th>
            <th className="text-right py-3 px-3 font-medium">Rate</th>
            <th className="text-right py-3 px-3 font-medium">Hours</th>
            <th className="text-right py-3 px-3 font-medium">Extended</th>
          </tr>
        </thead>
        <tbody>
          {yearData.map((year, idx) => {
            const clinNum = CLIN_NUMBERS[idx] || `${String(idx + 1).padStart(4, '0')}`
            return (
              <Fragment key={idx}>
                {quote.tasks.map((task, tIdx) => {
                  const prop = totalHours > 0 ? task.hours / totalHours : 0
                  const taskLabor = year.labor * prop
                  const rate = task.hours > 0 ? taskLabor / task.hours : burdenedRate
                  return (
                    <tr key={`${idx}-${tIdx}`} className="border-t border-border-subtle">
                      <td className="py-2 px-3 font-mono text-text-secondary text-xs">
                        {tIdx === 0 ? clinNum : ''}
                      </td>
                      <td className="py-2 px-3 text-text-secondary text-xs">
                        {tIdx === 0 ? year.label : ''}
                      </td>
                      <td className="py-2 px-3 text-text-primary">{task.taskName}</td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {fmtMoney(rate)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {task.hours.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {fmtMoney(taskLabor)}
                      </td>
                    </tr>
                  )
                })}
                {/* CLIN subtotal */}
                <tr className="border-t border-accent/20 bg-accent/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs font-bold">{clinNum}</td>
                  <td colSpan={4} className="py-2 px-3 text-accent font-semibold text-xs">
                    {year.label} Subtotal
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-accent">
                    {fmtMoney(year.total)}
                  </td>
                </tr>
              </Fragment>
            )
          })}
          {/* Grand total */}
          <tr className="border-t-2 border-accent/30 bg-accent/10">
            <td className="py-3 px-3 font-bold text-accent" colSpan={5}>GRAND TOTAL</td>
            <td className="py-3 px-3 text-right font-mono font-bold text-accent">
              {fmtMoney(yearData.reduce((s, y) => s + y.total, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function SectionBPreview({ quote, yearData, profile }: { quote: Quote; yearData: YearData[]; profile: BurdenProfile | null }) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const burdenedRate = burden ? burden.totalBurdened : 0
  const totalHours = quote.totalHours

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-tertiary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium">CLIN</th>
            <th className="text-left py-3 px-3 font-medium">Description</th>
            <th className="text-right py-3 px-3 font-medium">Qty</th>
            <th className="text-left py-3 px-3 font-medium">Unit</th>
            <th className="text-right py-3 px-3 font-medium">Unit Price</th>
            <th className="text-right py-3 px-3 font-medium">Extended</th>
          </tr>
        </thead>
        <tbody>
          {yearData.map((year, idx) => {
            const clinNum = CLIN_NUMBERS[idx] || `${String(idx + 1).padStart(4, '0')}`
            return (
              <Fragment key={idx}>
                {/* Period header */}
                <tr className="border-t border-border-subtle bg-surface-2/50">
                  <td className="py-2 px-3 font-mono text-accent text-xs font-bold">{clinNum}</td>
                  <td colSpan={5} className="py-2 px-3 font-semibold text-text-primary text-xs">
                    {year.label} Services
                  </td>
                </tr>
                {/* Labor rows */}
                {quote.tasks.map((task, tIdx) => {
                  const prop = totalHours > 0 ? task.hours / totalHours : 0
                  const taskLabor = year.labor * prop
                  const rate = task.hours > 0 ? taskLabor / task.hours : burdenedRate
                  return (
                    <tr key={`${idx}-l-${tIdx}`} className="border-t border-border-subtle">
                      <td className="py-2 px-3" />
                      <td className="py-2 px-3 text-text-primary">{task.taskName}</td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {task.hours.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">Hours</td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {fmtMoney(rate)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {fmtMoney(taskLabor)}
                      </td>
                    </tr>
                  )
                })}
                {/* Materials */}
                {year.materials > 0 && (
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 text-text-primary">Materials & Supplies</td>
                    <td className="py-2 px-3 text-right font-mono text-text-primary">1</td>
                    <td className="py-2 px-3 text-text-secondary">Lot</td>
                    <td className="py-2 px-3 text-right font-mono text-text-primary">
                      {fmtMoney(year.materials)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-text-primary">
                      {fmtMoney(year.materials)}
                    </td>
                  </tr>
                )}
                {/* Subtotal */}
                <tr className="border-t border-accent/20 bg-accent/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs font-bold">{clinNum}</td>
                  <td colSpan={4} className="py-2 px-3 text-accent font-semibold text-xs">
                    {year.label} Subtotal
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-accent">
                    {fmtMoney(year.total)}
                  </td>
                </tr>
              </Fragment>
            )
          })}
          {/* Grand total */}
          <tr className="border-t-2 border-accent/30 bg-accent/10">
            <td className="py-3 px-3 font-bold text-accent" colSpan={5}>GRAND TOTAL</td>
            <td className="py-3 px-3 text-right font-mono font-bold text-accent">
              {fmtMoney(yearData.reduce((s, y) => s + y.total, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function CostMatrixPreview({ quote, yearData, profile }: { quote: Quote; yearData: YearData[]; profile: BurdenProfile | null }) {
  const burden = profile ? computeBurdenBreakdown(profile) : null
  const totalHours = quote.totalHours

  type MatrixRow = { label: string; values: number[]; isBold?: boolean; isAccent?: boolean }
  const matrixRows: MatrixRow[] = []

  if (burden && totalHours > 0) {
    // Direct labor by task
    quote.tasks.forEach((task) => {
      const prop = totalHours > 0 ? task.hours / totalHours : 0
      const baseWagePortion = burden.baseWage / burden.totalBurdened
      matrixRows.push({
        label: `Direct Labor - ${task.taskName}`,
        values: yearData.map((y) => y.labor * prop * baseWagePortion),
      })
    })

    const fringePct = burden.fringe / burden.totalBurdened
    matrixRows.push({
      label: 'Fringe Benefits (H&W)',
      values: yearData.map((y) => y.labor * fringePct),
    })

    const taxPct = burden.payrollTaxes / burden.totalBurdened
    matrixRows.push({
      label: 'Payroll Taxes',
      values: yearData.map((y) => y.labor * taxPct),
    })

    const leavePct = burden.leave / burden.totalBurdened
    matrixRows.push({
      label: 'Paid Leave',
      values: yearData.map((y) => y.labor * leavePct),
    })

    const overheadPortion = burden.overhead / burden.totalBurdened
    matrixRows.push({
      label: 'Overhead / G&A',
      values: yearData.map((y) => y.labor * overheadPortion),
    })

    const profitPortion = burden.profit / burden.totalBurdened
    matrixRows.push({
      label: 'Profit / Fee',
      values: yearData.map((y) => y.labor * profitPortion),
    })
  } else {
    matrixRows.push({
      label: 'Direct Labor (total)',
      values: yearData.map((y) => y.labor),
    })
  }

  matrixRows.push({
    label: 'Materials & Supplies',
    values: yearData.map((y) => y.materials),
  })

  matrixRows.push({
    label: 'TOTAL',
    values: yearData.map((y) => y.total),
    isBold: true,
    isAccent: true,
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-tertiary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium">Cost Element</th>
            {yearData.map((y, i) => (
              <th key={i} className="text-right py-3 px-3 font-medium">{y.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrixRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={`border-t ${
                row.isAccent
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-border-subtle'
              }`}
            >
              <td className={`py-2 px-3 ${
                row.isBold ? 'font-bold' : ''
              } ${row.isAccent ? 'text-accent' : 'text-text-primary'}`}>
                {row.label}
              </td>
              {row.values.map((val, vIdx) => (
                <td
                  key={vIdx}
                  className={`py-2 px-3 text-right font-mono ${
                    row.isBold ? 'font-bold' : ''
                  } ${row.isAccent ? 'text-accent' : 'text-text-primary'}`}
                >
                  {fmtMoney(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Fragment import for JSX
import { Fragment } from 'react'
