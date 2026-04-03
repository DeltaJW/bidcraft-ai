import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { quotesStore, burdenProfilesStore, useStore } from '@/data/mockStore'

interface Scenario {
  label: string
  annualHours: number
  burdenRate: number
  materialsCost: number
  totalCost: number
  ftes: number
}

export default function ScenarioCompare() {
  const quotes = useStore(quotesStore)
  const burdenProfiles = useStore(burdenProfilesStore)

  const [quoteIdA, setQuoteIdA] = useState('')
  const [quoteIdB, setQuoteIdB] = useState('')

  // Manual overrides for scenario B
  const [overrideHours, setOverrideHours] = useState<number | null>(null)
  const [overrideBurdenId, setOverrideBurdenId] = useState('')
  const [overrideMaterials, setOverrideMaterials] = useState<number | null>(null)

  function buildScenario(quoteId: string, overrides?: { hours?: number; burdenId?: string; materials?: number }): Scenario | null {
    const q = quotes.find((x) => x.id === quoteId)
    if (!q) return null

    const hours = overrides?.hours ?? q.totalHours
    const bp = burdenProfiles.find((b) => b.id === (overrides?.burdenId || q.burdenProfileId))
    const rate = bp?.computedRate ?? 0
    const materials = overrides?.materials ?? q.totalMaterials
    const laborCost = hours * rate
    const totalCost = laborCost + materials

    return {
      label: q.title,
      annualHours: hours,
      burdenRate: rate,
      materialsCost: materials,
      totalCost,
      ftes: hours / (6.5 * 260),
    }
  }

  const scenarioA = quoteIdA ? buildScenario(quoteIdA) : null
  const scenarioB = quoteIdB
    ? buildScenario(quoteIdB, {
        hours: overrideHours ?? undefined,
        burdenId: overrideBurdenId || undefined,
        materials: overrideMaterials ?? undefined,
      })
    : null

  function delta(a: number, b: number): { value: number; pct: number; dir: 'up' | 'down' | 'same' } {
    const value = b - a
    const pct = a > 0 ? (value / a) * 100 : 0
    return { value, pct, dir: value > 0 ? 'up' : value < 0 ? 'down' : 'same' }
  }

  function DeltaCell({ a, b, format = 'dollar', invert = false }: { a: number; b: number; format?: 'dollar' | 'number' | 'percent'; invert?: boolean }) {
    const d = delta(a, b)
    const isGood = invert ? d.dir === 'down' : d.dir === 'up'
    const color = d.dir === 'same' ? 'text-text-tertiary' : isGood ? 'text-success' : 'text-error-light'
    const Icon = d.dir === 'up' ? TrendingUp : d.dir === 'down' ? TrendingDown : Minus

    let formatted = ''
    if (format === 'dollar') formatted = `${d.value >= 0 ? '+' : ''}$${Math.abs(d.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    else if (format === 'number') formatted = `${d.value >= 0 ? '+' : ''}${d.value.toFixed(1)}`
    else formatted = `${d.value >= 0 ? '+' : ''}${d.value.toFixed(1)}%`

    return (
      <div className={`flex items-center gap-1 text-xs font-mono ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{formatted}</span>
        <span className="text-text-disabled">({d.pct >= 0 ? '+' : ''}{d.pct.toFixed(1)}%)</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center gap-3 mb-2">
        <GitCompare className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">What-If Scenarios</h1>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Compare two quotes side by side, or take a quote and adjust variables to see how changes affect the bottom line.
      </p>

      {/* Quote selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <GlassCard title="Scenario A (Baseline)">
          <select value={quoteIdA} onChange={(e) => setQuoteIdA(e.target.value)}>
            <option value="">— Select a quote —</option>
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} — ${q.grandTotal.toLocaleString()}
              </option>
            ))}
          </select>
        </GlassCard>

        <GlassCard title="Scenario B (Comparison)">
          <select value={quoteIdB} onChange={(e) => { setQuoteIdB(e.target.value); setOverrideHours(null); setOverrideBurdenId(''); setOverrideMaterials(null) }}>
            <option value="">— Select a quote —</option>
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} — ${q.grandTotal.toLocaleString()}
              </option>
            ))}
          </select>
          {quoteIdB && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <h4 className="text-xs font-semibold text-text-secondary mb-3">Override Variables (optional)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Hours</label>
                  <input
                    type="number"
                    placeholder="Keep original"
                    value={overrideHours ?? ''}
                    onChange={(e) => setOverrideHours(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div>
                  <label className="label">Burden Profile</label>
                  <select
                    value={overrideBurdenId}
                    onChange={(e) => setOverrideBurdenId(e.target.value)}
                    className="!text-xs"
                  >
                    <option value="">Keep original</option>
                    {burdenProfiles.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.name} (${(bp.computedRate ?? 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Materials ($)</label>
                  <input
                    type="number"
                    placeholder="Keep original"
                    value={overrideMaterials ?? ''}
                    onChange={(e) => setOverrideMaterials(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Comparison table */}
      {scenarioA && scenarioB && (
        <GlassCard title="Side-by-Side Comparison">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="numeric">Scenario A</th>
                <th className="numeric">Scenario B</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Annual Hours</td>
                <td className="numeric">{scenarioA.annualHours.toFixed(1)}</td>
                <td className="numeric">{scenarioB.annualHours.toFixed(1)}</td>
                <td><DeltaCell a={scenarioA.annualHours} b={scenarioB.annualHours} format="number" invert /></td>
              </tr>
              <tr>
                <td className="font-medium">Burden Rate</td>
                <td className="numeric">${scenarioA.burdenRate.toFixed(2)}/hr</td>
                <td className="numeric">${scenarioB.burdenRate.toFixed(2)}/hr</td>
                <td><DeltaCell a={scenarioA.burdenRate} b={scenarioB.burdenRate} format="dollar" invert /></td>
              </tr>
              <tr>
                <td className="font-medium">FTEs</td>
                <td className="numeric">{scenarioA.ftes.toFixed(2)}</td>
                <td className="numeric">{scenarioB.ftes.toFixed(2)}</td>
                <td><DeltaCell a={scenarioA.ftes} b={scenarioB.ftes} format="number" invert /></td>
              </tr>
              <tr>
                <td className="font-medium">Materials</td>
                <td className="numeric">${scenarioA.materialsCost.toLocaleString()}</td>
                <td className="numeric">${scenarioB.materialsCost.toLocaleString()}</td>
                <td><DeltaCell a={scenarioA.materialsCost} b={scenarioB.materialsCost} format="dollar" invert /></td>
              </tr>
              <tr className="row-subtotal">
                <td className="font-bold">Total Annual Cost</td>
                <td className="numeric font-bold">${scenarioA.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="numeric font-bold">${scenarioB.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td><DeltaCell a={scenarioA.totalCost} b={scenarioB.totalCost} format="dollar" invert /></td>
              </tr>
            </tbody>
          </table>

          {/* Visual comparison bar */}
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <h4 className="text-xs font-semibold text-text-secondary mb-3">Visual Comparison</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Scenario A', value: scenarioA.totalCost, color: 'bg-accent' },
                { label: 'Scenario B', value: scenarioB.totalCost, color: 'bg-success' },
              ].map((bar) => {
                const maxVal = Math.max(scenarioA.totalCost, scenarioB.totalCost)
                const widthPct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0
                return (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary w-24">{bar.label}</span>
                    <div className="flex-1 h-6 bg-surface-0 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-text-primary w-24 text-right">
                      ${bar.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-text-tertiary mt-3">
              {scenarioB.totalCost < scenarioA.totalCost
                ? `Scenario B saves $${(scenarioA.totalCost - scenarioB.totalCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr (${((1 - scenarioB.totalCost / scenarioA.totalCost) * 100).toFixed(1)}% reduction)`
                : scenarioB.totalCost > scenarioA.totalCost
                  ? `Scenario B costs $${(scenarioB.totalCost - scenarioA.totalCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr more (${(((scenarioB.totalCost / scenarioA.totalCost) - 1) * 100).toFixed(1)}% increase)`
                  : 'Both scenarios have the same cost'}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Empty state */}
      {(!scenarioA || !scenarioB) && (
        <GlassCard className="text-center py-12">
          <GitCompare className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-text-secondary font-medium mb-2">Select two quotes to compare</h3>
          <p className="text-sm text-text-tertiary max-w-md mx-auto">
            Pick a baseline quote and a comparison quote. Then adjust hours, burden rate, or materials
            on the comparison to model "what if" scenarios — like cutting frequency, changing staff mix, or negotiating materials.
          </p>
        </GlassCard>
      )}
    </motion.div>
  )
}
