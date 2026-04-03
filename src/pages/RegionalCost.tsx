import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ArrowUpDown, ChevronUp, ChevronDown, Info } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { METRO_BENCHMARKS, NATIONAL_MEDIAN, type MetroBenchmark } from '@/data/regionalBenchmarks'

// ---- Helpers ----

function fmtWage(n: number): string {
  return '$' + n.toFixed(2)
}

function fmtPct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
}

/** Estimate which percentile a wage falls at within a metro's distribution */
function estimatePercentile(wage: number, b: MetroBenchmark): number {
  if (wage <= b.percentile25) {
    // Linear interpolation 0-25
    const min = b.percentile25 * 0.7 // rough estimate of 10th percentile
    if (wage <= min) return 0
    return 25 * ((wage - min) / (b.percentile25 - min))
  }
  if (wage <= b.medianWage) {
    // 25-50
    return 25 + 25 * ((wage - b.percentile25) / (b.medianWage - b.percentile25))
  }
  if (wage <= b.percentile75) {
    // 50-75
    return 50 + 25 * ((wage - b.medianWage) / (b.percentile75 - b.medianWage))
  }
  if (wage <= b.percentile90) {
    // 75-90
    return 75 + 15 * ((wage - b.percentile75) / (b.percentile90 - b.percentile75))
  }
  // Above 90th
  const excess = wage - b.percentile90
  const range = b.percentile90 - b.percentile75
  return Math.min(99, 90 + 10 * (excess / range))
}

/** Color class based on whether the wage is competitive */
function wageColor(wage: number, median: number): string {
  const pct = ((wage - median) / median) * 100
  if (pct < -15) return 'text-error-light'
  if (pct < -5) return 'text-warning'
  if (pct <= 10) return 'text-success'
  if (pct <= 20) return 'text-accent'
  return 'text-purple-400'
}

function wageBgColor(wage: number, median: number): string {
  const pct = ((wage - median) / median) * 100
  if (pct < -15) return 'bg-error/15'
  if (pct < -5) return 'bg-warning/15'
  if (pct <= 10) return 'bg-success/15'
  if (pct <= 20) return 'bg-accent/15'
  return 'bg-purple-500/15'
}

function wageLabel(wage: number, median: number): string {
  const pct = ((wage - median) / median) * 100
  if (pct < -15) return 'Well Below Market'
  if (pct < -5) return 'Below Market'
  if (pct <= 5) return 'At Market'
  if (pct <= 15) return 'Above Market'
  return 'Well Above Market'
}

// ---- Sort types ----

type SortField = 'metro' | 'state' | 'medianWage' | 'costOfLivingIndex' | 'gap'
type SortDir = 'asc' | 'desc'

// ---- Component ----

export default function RegionalCost() {
  const [selectedMetro, setSelectedMetro] = useState('')
  const [proposedWage, setProposedWage] = useState<number | ''>('')
  const [compareMetro, setCompareMetro] = useState('')
  const [sortField, setSortField] = useState<SortField>('medianWage')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showTips, setShowTips] = useState(false)

  const selected = METRO_BENCHMARKS.find((b) => b.metro === selectedMetro)
  const wage = typeof proposedWage === 'number' ? proposedWage : 0
  const hasInput = !!selected && wage > 0

  // COL comparison
  const compareTarget = METRO_BENCHMARKS.find((b) => b.metro === compareMetro)

  const colInsight = useMemo(() => {
    if (!selected || !compareTarget || wage <= 0) return null
    const colRatio = compareTarget.costOfLivingIndex / selected.costOfLivingIndex
    const adjustedWage = wage * colRatio
    const overUnder = ((wage - adjustedWage) / adjustedWage) * 100
    return {
      colRatio,
      adjustedWage,
      overUnder,
    }
  }, [selected, compareTarget, wage])

  // Percentile for selected metro
  const percentile = useMemo(() => {
    if (!selected || wage <= 0) return null
    return estimatePercentile(wage, selected)
  }, [selected, wage])

  // Sorted benchmark table
  const sortedBenchmarks = useMemo(() => {
    const data = METRO_BENCHMARKS.map((b) => ({
      ...b,
      gap: wage > 0 ? ((wage - b.medianWage) / b.medianWage) * 100 : 0,
    }))

    data.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortField) {
        case 'metro': aVal = a.metro; bVal = b.metro; break
        case 'state': aVal = a.state; bVal = b.state; break
        case 'medianWage': aVal = a.medianWage; bVal = b.medianWage; break
        case 'costOfLivingIndex': aVal = a.costOfLivingIndex; bVal = b.costOfLivingIndex; break
        case 'gap': aVal = a.gap; bVal = b.gap; break
        default: aVal = a.medianWage; bVal = b.medianWage
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return data
  }, [sortField, sortDir, wage])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'metro' || field === 'state' ? 'asc' : 'desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-text-disabled" />
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent" />
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Regional Cost Adjuster</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Benchmark your labor rates against BLS market data across 20 metro areas.
        </p>
      </motion.div>

      {/* Inputs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Left: Metro + Wage */}
        <GlassCard title="Your Rate">
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Metro Area
            </label>
            <select
              className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={selectedMetro}
              onChange={(e) => setSelectedMetro(e.target.value)}
            >
              <option value="">-- Select metro area --</option>
              {METRO_BENCHMARKS.map((b) => (
                <option key={b.metro} value={b.metro}>
                  {b.metro}, {b.state}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Proposed Base Wage ($/hr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
              <input
                type="number"
                min={0}
                step={0.25}
                className="w-full bg-surface-2 border border-border-default rounded-lg pl-7 pr-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={proposedWage}
                onChange={(e) => {
                  const v = e.target.value
                  setProposedWage(v === '' ? '' : Number(v))
                }}
                placeholder="15.00"
              />
            </div>
          </div>

          {/* Actions */}
          <button
            className="btn btn-ghost text-xs"
            onClick={() => setShowTips(!showTips)}
          >
            <Info className="w-3.5 h-3.5" />
            Pricing Tips
          </button>

          {showTips && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-text-secondary leading-relaxed"
            >
              <p className="font-semibold text-accent mb-1">Regional Pricing Strategy</p>
              <ul className="list-disc list-inside space-y-1">
                <li>SCA contracts require paying at least the prevailing wage for the locality.</li>
                <li>Pricing below the 25th percentile risks high turnover and quality issues.</li>
                <li>The 50th-75th percentile range balances competitiveness with retention.</li>
                <li>High-COL metros require higher wages but also support higher bill rates.</li>
                <li>When bidding in a new market, adjust your home-market rate by the COL ratio.</li>
              </ul>
            </motion.div>
          )}
        </GlassCard>

        {/* Right: COL Comparison */}
        <GlassCard title="Cost of Living Comparison">
          <p className="text-xs text-text-tertiary mb-4">
            Compare your rate against a different metro to see if you are priced appropriately for the target market.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Compare Against Metro
            </label>
            <select
              className="w-full bg-surface-2 border border-border-default rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={compareMetro}
              onChange={(e) => setCompareMetro(e.target.value)}
            >
              <option value="">-- Select metro to compare --</option>
              {METRO_BENCHMARKS.filter((b) => b.metro !== selectedMetro).map((b) => (
                <option key={b.metro} value={b.metro}>
                  {b.metro}, {b.state} (COL: {b.costOfLivingIndex})
                </option>
              ))}
            </select>
          </div>

          {colInsight && selected && compareTarget ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-2">
                  <p className="text-xs text-text-tertiary mb-0.5">Your metro COL</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {selected.costOfLivingIndex}
                  </p>
                  <p className="text-xs text-text-disabled truncate">{selected.metro}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-2">
                  <p className="text-xs text-text-tertiary mb-0.5">Target metro COL</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {compareTarget.costOfLivingIndex}
                  </p>
                  <p className="text-xs text-text-disabled truncate">{compareTarget.metro}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${colInsight.overUnder > 10 ? 'bg-error/10 border border-error/20' : colInsight.overUnder < -10 ? 'bg-warning/10 border border-warning/20' : 'bg-success/10 border border-success/20'}`}>
                <p className="text-sm text-text-secondary mb-1">
                  COL-adjusted rate for <span className="font-medium text-text-primary">{compareTarget.metro}</span>:
                </p>
                <p className="text-2xl font-bold font-mono text-text-primary mb-1">
                  {fmtWage(colInsight.adjustedWage)}
                  <span className="text-sm font-normal text-text-tertiary">/hr</span>
                </p>
                <p className="text-sm">
                  {colInsight.overUnder > 5 ? (
                    <span className="text-error-light font-medium">
                      Your {fmtWage(wage)}/hr is {Math.abs(colInsight.overUnder).toFixed(0)}% over the COL-adjusted rate.
                      You may be pricing yourself out of this market.
                    </span>
                  ) : colInsight.overUnder < -5 ? (
                    <span className="text-warning font-medium">
                      Your {fmtWage(wage)}/hr is {Math.abs(colInsight.overUnder).toFixed(0)}% under the COL-adjusted rate.
                      You may be leaving margin on the table.
                    </span>
                  ) : (
                    <span className="text-success font-medium">
                      Your {fmtWage(wage)}/hr is within range of the COL-adjusted rate. Well-calibrated for this market.
                    </span>
                  )}
                </p>
              </div>

              <p className="text-xs text-text-disabled">
                Ratio: {selected.metro} ({selected.costOfLivingIndex}) vs {compareTarget.metro} ({compareTarget.costOfLivingIndex}) = {colInsight.colRatio.toFixed(2)}x
              </p>
            </motion.div>
          ) : (
            <div className="p-6 text-center text-text-disabled text-sm">
              {!selected ? 'Select your metro area first' : !wage ? 'Enter a proposed wage' : 'Select a metro to compare'}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Percentile Position + Distribution Chart */}
      {hasInput && selected && percentile !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <GlassCard title="Your Position in This Market" subtitle={`${selected.metro}, ${selected.state}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary stats */}
              <div className="flex flex-col gap-3">
                <div className={`p-4 rounded-lg text-center ${wageBgColor(wage, selected.medianWage)}`}>
                  <p className="text-xs text-text-tertiary mb-1">Market Position</p>
                  <p className={`text-xl font-bold ${wageColor(wage, selected.medianWage)}`}>
                    {wageLabel(wage, selected.medianWage)}
                  </p>
                  <p className="text-sm font-mono text-text-secondary mt-1">
                    {fmtPct(((wage - selected.medianWage) / selected.medianWage) * 100)} vs median
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2">
                  <p className="text-xs text-text-tertiary mb-0.5">Estimated Percentile</p>
                  <p className="text-2xl font-bold font-mono text-text-primary">
                    {Math.round(percentile)}
                    <span className="text-sm font-normal text-text-tertiary">th</span>
                  </p>
                  <p className="text-xs text-text-disabled">
                    Higher than {Math.round(percentile)}% of janitors in this metro
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-2">
                  <p className="text-xs text-text-tertiary mb-0.5">vs National Median</p>
                  <p className="text-lg font-bold font-mono text-text-primary">
                    {fmtPct(((wage - NATIONAL_MEDIAN) / NATIONAL_MEDIAN) * 100)}
                  </p>
                  <p className="text-xs text-text-disabled">
                    National median: {fmtWage(NATIONAL_MEDIAN)}/hr
                  </p>
                </div>
              </div>

              {/* Horizontal bar chart: percentile distribution */}
              <div className="lg:col-span-2">
                <p className="text-xs text-text-tertiary mb-3 font-medium uppercase tracking-wider">
                  Wage Distribution for {selected.metro}
                </p>
                <div className="space-y-4">
                  {/* The bar */}
                  <div className="relative">
                    {/* Background track */}
                    <div className="h-10 rounded-lg bg-surface-2 relative overflow-hidden">
                      {/* 25th percentile zone */}
                      <div
                        className="absolute top-0 bottom-0 bg-rose-500/20"
                        style={{
                          left: '0%',
                          width: `${(selected.percentile25 / selected.percentile90 / 1.15) * 100}%`,
                        }}
                      />
                      {/* 25-50 zone */}
                      <div
                        className="absolute top-0 bottom-0 bg-amber-500/15"
                        style={{
                          left: `${(selected.percentile25 / selected.percentile90 / 1.15) * 100}%`,
                          width: `${((selected.medianWage - selected.percentile25) / selected.percentile90 / 1.15) * 100}%`,
                        }}
                      />
                      {/* 50-75 zone */}
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/15"
                        style={{
                          left: `${(selected.medianWage / selected.percentile90 / 1.15) * 100}%`,
                          width: `${((selected.percentile75 - selected.medianWage) / selected.percentile90 / 1.15) * 100}%`,
                        }}
                      />
                      {/* 75-90 zone */}
                      <div
                        className="absolute top-0 bottom-0 bg-blue-500/15"
                        style={{
                          left: `${(selected.percentile75 / selected.percentile90 / 1.15) * 100}%`,
                          width: `${((selected.percentile90 - selected.percentile75) / selected.percentile90 / 1.15) * 100}%`,
                        }}
                      />

                      {/* User's wage marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                        style={{
                          left: `${Math.min((wage / selected.percentile90 / 1.15) * 100, 98)}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-accent">
                          You: {fmtWage(wage)}
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white" />
                      </div>
                    </div>

                    {/* Percentile labels below bar */}
                    <div className="relative h-8 mt-1">
                      {[
                        { label: 'P25', value: selected.percentile25 },
                        { label: 'Median', value: selected.medianWage },
                        { label: 'P75', value: selected.percentile75 },
                        { label: 'P90', value: selected.percentile90 },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="absolute text-center -translate-x-1/2"
                          style={{
                            left: `${(value / selected.percentile90 / 1.15) * 100}%`,
                          }}
                        >
                          <div className="w-px h-2 bg-border-default mx-auto" />
                          <p className="text-[10px] text-text-disabled">{label}</p>
                          <p className="text-[10px] font-mono text-text-tertiary">{fmtWage(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/30" /> Below P25</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/25" /> P25-Median</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/25" /> Median-P75</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/25" /> P75-P90</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /> Your Rate</span>
                  </div>

                  {/* Percentile detail table */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { label: '25th %ile', value: selected.percentile25 },
                      { label: 'Median', value: selected.medianWage },
                      { label: '75th %ile', value: selected.percentile75 },
                      { label: '90th %ile', value: selected.percentile90 },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-2 rounded bg-surface-2 text-center">
                        <p className="text-[10px] text-text-disabled uppercase tracking-wider">{label}</p>
                        <p className={`text-sm font-mono font-bold ${wage >= value ? 'text-accent' : 'text-text-primary'}`}>
                          {fmtWage(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Benchmark Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <GlassCard
          title="All Metro Benchmarks"
          subtitle="BLS SOC 37-2011 Janitors and Cleaners wage data, sorted by click"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-tertiary text-xs uppercase tracking-wider">
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('metro')}
                  >
                    <span className="inline-flex items-center gap-1">Metro <SortIcon field="metro" /></span>
                  </th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('state')}
                  >
                    <span className="inline-flex items-center gap-1">State <SortIcon field="state" /></span>
                  </th>
                  <th className="text-right py-3 px-3 font-medium">P25</th>
                  <th
                    className="text-right py-3 px-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('medianWage')}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">Median <SortIcon field="medianWage" /></span>
                  </th>
                  <th className="text-right py-3 px-3 font-medium">P75</th>
                  <th className="text-right py-3 px-3 font-medium">P90</th>
                  <th
                    className="text-right py-3 px-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('costOfLivingIndex')}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">COL <SortIcon field="costOfLivingIndex" /></span>
                  </th>
                  {wage > 0 && (
                    <th
                      className="text-right py-3 px-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
                      onClick={() => toggleSort('gap')}
                    >
                      <span className="inline-flex items-center gap-1 justify-end">vs You <SortIcon field="gap" /></span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedBenchmarks.map((b) => {
                  const isSelected = b.metro === selectedMetro
                  return (
                    <tr
                      key={b.metro}
                      className={`border-t border-border-subtle transition-colors cursor-pointer hover:bg-surface-3/50 ${
                        isSelected ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => setSelectedMetro(b.metro)}
                    >
                      <td className="py-2.5 px-3 text-text-primary font-medium">
                        {isSelected && <MapPin className="w-3 h-3 inline mr-1 text-accent" />}
                        {b.metro}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary text-xs">{b.state}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-tertiary">{fmtWage(b.percentile25)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-primary font-bold">{fmtWage(b.medianWage)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-tertiary">{fmtWage(b.percentile75)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-tertiary">{fmtWage(b.percentile90)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{b.costOfLivingIndex}</td>
                      {wage > 0 && (
                        <td className={`py-2.5 px-3 text-right font-mono font-medium ${wageColor(wage, b.medianWage)}`}>
                          {fmtPct(b.gap)}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-text-disabled">
            Data source: BLS Occupational Employment and Wage Statistics (OEWS), SOC 37-2011, NAICS 561720.
            Cost of Living based on BEA Regional Price Parities. Click any row to select that metro.
          </div>
        </GlassCard>
      </motion.div>

      {/* Empty state */}
      {!hasInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <MapPin className="w-12 h-12 text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Select a metro and enter your wage to begin</h3>
            <p className="text-text-tertiary text-sm mb-2 max-w-md mx-auto text-center">
              Choose your metro area and enter your proposed base hourly wage. The tool will show where you sit
              in the local wage distribution and how your rate compares across markets.
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
