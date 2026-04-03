import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Download,
  Info,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'

// ---- Types ----

type EscalationMethod = 'wd' | 'cpi' | 'fixed_pct' | 'custom'

interface YearEscalation {
  laborMethod: EscalationMethod
  laborRate: number // percentage for wd/cpi/fixed_pct, dollar amount for custom
  materialsRate: number // percentage for materials escalation
}

interface EscalationProfile {
  name: string
  laborRate: number
  materialsRate: number
}

// ---- Constants ----

const ESCALATION_PROFILES: EscalationProfile[] = [
  { name: 'Conservative', laborRate: 2, materialsRate: 1.5 },
  { name: 'Moderate', laborRate: 3, materialsRate: 2.5 },
  { name: 'Aggressive', laborRate: 4, materialsRate: 3 },
]

const METHOD_LABELS: Record<EscalationMethod, string> = {
  wd: 'WD Adjustment %',
  cpi: 'CPI Escalation %',
  fixed_pct: 'Fixed % Increase',
  custom: 'Custom Amount ($)',
}

const YEAR_LABELS = ['Base Year', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5']

// ---- Helpers ----

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%'
}

// ---- Component ----

export default function PriceEscalation() {
  const quotes = useStore(quotesStore)

  // Inputs
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [baseLabor, setBaseLabor] = useState<number>(0)
  const [baseMaterials, setBaseMaterials] = useState<number>(0)
  const [optionYears, setOptionYears] = useState<number>(3)
  const [defaultMethod, setDefaultMethod] = useState<EscalationMethod>('fixed_pct')
  const [defaultLaborRate, setDefaultLaborRate] = useState<number>(3)
  const [defaultMaterialsRate, setDefaultMaterialsRate] = useState<number>(2.5)
  const [showHint, setShowHint] = useState(false)
  const [showOverrides, setShowOverrides] = useState(false)

  // Per-year overrides: keyed by year index (1-based, 0 = base year which has no escalation)
  const [yearOverrides, setYearOverrides] = useState<Record<number, Partial<YearEscalation>>>({})

  // Load from saved quote
  const handleQuoteSelect = useCallback(
    (quoteId: string) => {
      setSelectedQuoteId(quoteId)
      if (!quoteId) return
      const q = quotes.find((q) => q.id === quoteId)
      if (q) {
        setBaseLabor(q.totalLabor)
        setBaseMaterials(q.totalMaterials)
      }
    },
    [quotes],
  )

  // Apply preset profile
  const applyProfile = useCallback((profile: EscalationProfile) => {
    setDefaultLaborRate(profile.laborRate)
    setDefaultMaterialsRate(profile.materialsRate)
    setDefaultMethod('fixed_pct')
    setYearOverrides({})
  }, [])

  // Reset all
  const handleReset = useCallback(() => {
    setSelectedQuoteId('')
    setBaseLabor(0)
    setBaseMaterials(0)
    setOptionYears(3)
    setDefaultMethod('fixed_pct')
    setDefaultLaborRate(3)
    setDefaultMaterialsRate(2.5)
    setYearOverrides({})
    setShowOverrides(false)
  }, [])

  // Update a year override
  const setYearOverride = useCallback((yearIdx: number, field: keyof YearEscalation, value: number | EscalationMethod) => {
    setYearOverrides((prev) => ({
      ...prev,
      [yearIdx]: { ...prev[yearIdx], [field]: value },
    }))
  }, [])

  // Clear a year override
  const clearYearOverride = useCallback((yearIdx: number) => {
    setYearOverrides((prev) => {
      const next = { ...prev }
      delete next[yearIdx]
      return next
    })
  }, [])

  // ---- Computed table ----

  const tableData = useMemo(() => {
    const totalYears = 1 + optionYears // base + option years
    const rows: Array<{
      label: string
      yearIdx: number
      labor: number
      materials: number
      total: number
      cumulative: number
      pctFromBase: number
      laborMethod: EscalationMethod
      laborRate: number
      materialsRate: number
    }> = []

    let prevLabor = baseLabor
    let prevMaterials = baseMaterials
    let cumulative = 0

    for (let i = 0; i < totalYears; i++) {
      let labor: number
      let materials: number
      let laborMethod = defaultMethod
      let laborRate = defaultLaborRate
      let materialsRate = defaultMaterialsRate

      if (i === 0) {
        // Base year
        labor = baseLabor
        materials = baseMaterials
      } else {
        // Apply overrides if present
        const override = yearOverrides[i]
        if (override?.laborMethod !== undefined) laborMethod = override.laborMethod
        if (override?.laborRate !== undefined) laborRate = override.laborRate
        if (override?.materialsRate !== undefined) materialsRate = override.materialsRate

        // Calculate labor
        if (laborMethod === 'custom') {
          labor = prevLabor + laborRate
        } else {
          labor = prevLabor * (1 + laborRate / 100)
        }

        // Materials always percentage-based
        materials = prevMaterials * (1 + materialsRate / 100)
      }

      const total = labor + materials
      cumulative += total
      const pctFromBase = baseLabor + baseMaterials > 0
        ? ((total - (baseLabor + baseMaterials)) / (baseLabor + baseMaterials)) * 100
        : 0

      rows.push({
        label: YEAR_LABELS[i] || `Option ${i}`,
        yearIdx: i,
        labor,
        materials,
        total,
        cumulative,
        pctFromBase: i === 0 ? 0 : pctFromBase,
        laborMethod,
        laborRate,
        materialsRate,
      })

      prevLabor = labor
      prevMaterials = materials
    }

    return rows
  }, [baseLabor, baseMaterials, optionYears, defaultMethod, defaultLaborRate, defaultMaterialsRate, yearOverrides])

  const grandTotal = tableData.length > 0 ? tableData[tableData.length - 1].cumulative : 0
  const maxYearTotal = Math.max(...tableData.map((r) => r.total), 1)

  // ---- CSV Export ----

  const handleExport = useCallback(() => {
    const headers = ['Year', 'Labor', 'Materials', 'Annual Total', 'Cumulative Total', '% Increase from Base']
    const rows = tableData.map((r) => [
      r.label,
      r.labor.toFixed(2),
      r.materials.toFixed(2),
      r.total.toFixed(2),
      r.cumulative.toFixed(2),
      r.pctFromBase.toFixed(1) + '%',
    ])
    rows.push(['', '', '', '', '', ''])
    rows.push(['Grand Total (Contract Value)', '', '', '', grandTotal.toFixed(2), ''])
    downloadCSV('price-escalation-model', headers, rows)
  }, [tableData, grandTotal])

  const hasBaseInput = baseLabor > 0 || baseMaterials > 0

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Price Escalation Modeling</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Model multi-year contract pricing with labor and materials escalation.
        </p>
      </motion.div>

      {/* Inputs Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Base Year Inputs */}
        <GlassCard title="Base Year Costs">
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
                  {q.title} ({fmtMoney(q.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Base Year Labor Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className="w-full bg-surface-2 border border-border-default rounded-lg pl-7 pr-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={baseLabor || ''}
                  onChange={(e) => setBaseLabor(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Base Year Materials Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className="w-full bg-surface-2 border border-border-default rounded-lg pl-7 pr-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                  value={baseMaterials || ''}
                  onChange={(e) => setBaseMaterials(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Contract Duration */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Option Years (plus base year)
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
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
        </GlassCard>

        {/* Right: Escalation Settings */}
        <GlassCard title="Escalation Settings">
          {/* Preset profiles */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Preset Profiles
            </label>
            <div className="flex gap-2">
              {ESCALATION_PROFILES.map((p) => (
                <button
                  key={p.name}
                  className="btn btn-ghost text-xs"
                  onClick={() => applyProfile(p)}
                >
                  {p.name}
                  <span className="text-text-disabled ml-1">
                    ({p.laborRate}% / {p.materialsRate}%)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Default method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Default Labor Escalation Method
            </label>
            <select
              className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={defaultMethod}
              onChange={(e) => setDefaultMethod(e.target.value as EscalationMethod)}
            >
              {Object.entries(METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Default rates */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {defaultMethod === 'custom' ? 'Labor Increase ($)' : 'Labor Escalation (%)'}
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={defaultLaborRate}
                onChange={(e) => setDefaultLaborRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Materials Escalation (%)
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={defaultMaterialsRate}
                onChange={(e) => setDefaultMaterialsRate(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost text-xs" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={() => setShowHint(!showHint)}
            >
              <Info className="w-3.5 h-3.5" />
              Gov Escalation Tips
            </button>
          </div>

          {/* Hint text */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-text-secondary leading-relaxed"
            >
              <p className="font-semibold text-accent mb-1">What Government Expects</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Wage Determination (WD) adjustments</strong> reflect DOL updates to SCA prevailing wages.
                  Typically 2-4% per year. The government expects you to price based on current WD and escalate using
                  historical WD increase trends.
                </li>
                <li>
                  <strong>CPI escalation</strong> is used for non-labor items. BLS CPI-U averages 1-3% annually.
                  Some contracts specify a CPI cap.
                </li>
                <li>
                  <strong>Materials</strong> often escalate faster than labor (3-5%) due to supply chain volatility.
                  Price these separately from labor escalation.
                </li>
                <li>
                  <strong>Fixed percentage</strong> is the simplest approach. Many evaluators prefer seeing consistent,
                  defensible escalation rates across option years.
                </li>
                <li>
                  Government contracting officers often expect to see escalation in the 2-3% range for labor.
                  Going above 4% needs strong justification.
                </li>
              </ul>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>

      {/* Per-Year Overrides */}
      {optionYears > 0 && hasBaseInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
          <GlassCard>
            <button
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
              onClick={() => setShowOverrides(!showOverrides)}
            >
              {showOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Per-Year Escalation Overrides
              <span className="text-xs text-text-disabled ml-1">
                (edit rates for individual option years)
              </span>
            </button>

            {showOverrides && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-3"
              >
                {Array.from({ length: optionYears }, (_, i) => i + 1).map((yearIdx) => {
                  const override = yearOverrides[yearIdx]
                  const hasOverride = override !== undefined
                  return (
                    <div
                      key={yearIdx}
                      className={`p-3 rounded-lg border ${
                        hasOverride
                          ? 'border-accent/30 bg-accent/5'
                          : 'border-border-subtle bg-surface-2/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">
                          {YEAR_LABELS[yearIdx]}
                        </span>
                        {hasOverride && (
                          <button
                            className="text-xs text-text-tertiary hover:text-rose-400 transition-colors"
                            onClick={() => clearYearOverride(yearIdx)}
                          >
                            Clear override
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-text-tertiary mb-1">Method</label>
                          <select
                            className="w-full bg-surface-2 border border-border-default rounded px-2 py-1.5 text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
                            value={override?.laborMethod ?? defaultMethod}
                            onChange={(e) =>
                              setYearOverride(yearIdx, 'laborMethod', e.target.value as EscalationMethod)
                            }
                          >
                            {Object.entries(METHOD_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-text-tertiary mb-1">
                            Labor {(override?.laborMethod ?? defaultMethod) === 'custom' ? '($)' : '(%)'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            className="w-full bg-surface-2 border border-border-default rounded px-2 py-1.5 text-text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                            value={override?.laborRate ?? defaultLaborRate}
                            onChange={(e) =>
                              setYearOverride(yearIdx, 'laborRate', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-tertiary mb-1">Materials (%)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            className="w-full bg-surface-2 border border-border-default rounded px-2 py-1.5 text-text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                            value={override?.materialsRate ?? defaultMaterialsRate}
                            onChange={(e) =>
                              setYearOverride(yearIdx, 'materialsRate', Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Results Section */}
      {hasBaseInput && (
        <>
          {/* Grand Total + Export */}
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
                  {1 + optionYears} year{optionYears > 0 ? 's' : ''} &middot;{' '}
                  {defaultMethod === 'custom' ? 'Custom' : METHOD_LABELS[defaultMethod]} escalation
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </GlassCard>
          </motion.div>

          {/* Year-by-Year Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <GlassCard title="Year-by-Year Breakdown">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-tertiary text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3 font-medium">Year</th>
                      <th className="text-right py-3 px-3 font-medium">Labor</th>
                      <th className="text-right py-3 px-3 font-medium">Materials</th>
                      <th className="text-right py-3 px-3 font-medium">Annual Total</th>
                      <th className="text-right py-3 px-3 font-medium">Cumulative</th>
                      <th className="text-right py-3 px-3 font-medium">% from Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr
                        key={row.yearIdx}
                        className={`border-t border-border-subtle ${
                          idx === 0 ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-medium text-text-primary">
                          {row.label}
                          {yearOverrides[row.yearIdx] && idx > 0 && (
                            <span className="ml-1.5 text-[10px] text-accent font-normal">override</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-primary">
                          {fmtMoney(row.labor)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-primary">
                          {fmtMoney(row.materials)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                          {fmtMoney(row.total)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-secondary">
                          {fmtMoney(row.cumulative)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-tertiary">
                          {idx === 0 ? '--' : '+' + fmtPct(row.pctFromBase)}
                        </td>
                      </tr>
                    ))}
                    {/* Grand total row */}
                    <tr className="border-t-2 border-accent/30 bg-accent/5">
                      <td className="py-3 px-3 font-bold text-accent">Grand Total</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-accent">
                        {fmtMoney(tableData.reduce((s, r) => s + r.labor, 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-accent">
                        {fmtMoney(tableData.reduce((s, r) => s + r.materials, 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-accent">
                        {fmtMoney(grandTotal)}
                      </td>
                      <td className="py-3 px-3" />
                      <td className="py-3 px-3" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <GlassCard title="Cost by Year" subtitle="Annual cost comparison across contract period">
              <div className="flex items-end gap-4 h-52">
                {tableData.map((row) => {
                  const heightPct = maxYearTotal > 0 ? (row.total / maxYearTotal) * 100 : 0
                  const laborPct = row.total > 0 ? (row.labor / row.total) * 100 : 0
                  return (
                    <div key={row.yearIdx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {fmtMoney(row.total)}
                      </span>
                      <div className="w-full flex items-end" style={{ height: '160px' }}>
                        <div
                          className="w-full rounded-t overflow-hidden transition-all"
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                        >
                          {/* Labor portion */}
                          <div
                            className="w-full bg-accent/70"
                            style={{ height: `${laborPct}%` }}
                            title={`Labor: ${fmtMoney(row.labor)}`}
                          />
                          {/* Materials portion */}
                          <div
                            className="w-full bg-emerald-500/60"
                            style={{ height: `${100 - laborPct}%` }}
                            title={`Materials: ${fmtMoney(row.materials)}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-text-tertiary text-center">{row.label}</span>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-accent/70" />
                  <span className="text-xs text-text-secondary">Labor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500/60" />
                  <span className="text-xs text-text-secondary">Materials</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}

      {/* Empty state */}
      {!hasBaseInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="w-12 h-12 text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Enter base year costs to begin</h3>
            <p className="text-text-tertiary text-sm mb-2 max-w-md mx-auto text-center">
              Enter your base year labor and materials costs above, or select a saved quote to auto-fill.
              The model will calculate escalated pricing across all option years.
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
