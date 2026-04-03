import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, TrendingDown, DollarSign } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { burdenProfilesStore, quotesStore, useStore } from '@/data/mockStore'

export default function ProfitOptimizer() {
  const burdenProfiles = useStore(burdenProfilesStore)
  const quotes = useStore(quotesStore)

  const [targetPrice, setTargetPrice] = useState(0)
  const [annualHours, setAnnualHours] = useState(0)
  const [materialsCost, setMaterialsCost] = useState(0)
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [selectedQuoteId, setSelectedQuoteId] = useState('')

  // Load from existing quote
  function loadFromQuote(quoteId: string) {
    const q = quotes.find((x) => x.id === quoteId)
    if (!q) return
    setSelectedQuoteId(quoteId)
    setAnnualHours(q.totalHours)
    setMaterialsCost(q.totalMaterials)
    setTargetPrice(q.grandTotal * 1.05) // suggest 5% above current
    if (q.burdenProfileId) setSelectedBurdenId(q.burdenProfileId)
  }

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0

  // Forward calc: what would we charge at current rates?
  const currentLaborCost = annualHours * burdenRate
  const currentTotalCost = currentLaborCost + materialsCost
  const currentProfit = targetPrice - currentTotalCost
  const currentMarginPct = targetPrice > 0 ? (currentProfit / targetPrice) * 100 : 0

  // Reverse calc: what burden rate do we need to hit X margin?
  const targetMargins = [5, 8, 10, 12, 15]

  function calcMaxBurdenRate(marginPct: number): number {
    if (annualHours <= 0) return 0
    const allowableLaborCost = targetPrice * (1 - marginPct / 100) - materialsCost
    return allowableLaborCost / annualHours
  }

  function calcFTEsNeeded(): number {
    return annualHours / (6.5 * 260)
  }

  function calcMaxBaseWage(maxBurdenRate: number): number | null {
    if (!selectedBurden || maxBurdenRate <= 0) return null
    // Approximate: what base wage produces this burdened rate?
    // Reverse the burden buildup using the profile's percentages
    const bp = selectedBurden
    const feeMult = 1 + bp.feePct / 100
    const gaMult = 1 + bp.gaPct / 100
    const totalPaidDays = bp.vacationDays + bp.holidayDays + bp.sickDays
    const effectiveDays = 260 - totalPaidDays
    const leaveMult = effectiveDays > 0 ? 1 + totalPaidDays / effectiveDays : 1
    const taxPct = (bp.ficaPct + bp.suiPct + bp.wcPct + bp.futaPct) / 100

    // burdened = (baseWage + hw + baseWage*taxPct) * leaveMult * gaMult * feeMult (simplified)
    // Solve for baseWage:
    const denominator = (1 + taxPct) * leaveMult * gaMult * feeMult
    const hwContrib = bp.hwRate * leaveMult * gaMult * feeMult
    const maxBase = (maxBurdenRate - hwContrib) / denominator
    return maxBase > 0 ? maxBase : null
  }

  const isProfit = currentProfit > 0
  const isViable = currentMarginPct >= 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="mb-2">
        <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Analysis</p>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Profit Optimizer</h1>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Enter a target price and see if you can make money. Works backwards from what the government will pay to find your maximum costs.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Load from quote */}
          {quotes.length > 0 && (
            <GlassCard title="Start from Existing Quote" subtitle="Optional — pull numbers from a saved quote">
              <select
                value={selectedQuoteId}
                onChange={(e) => loadFromQuote(e.target.value)}
              >
                <option value="">— Select a quote —</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} — ${q.grandTotal.toLocaleString()} ({q.totalHours.toFixed(0)} hrs)
                  </option>
                ))}
              </select>
            </GlassCard>
          )}

          {/* Core inputs */}
          <GlassCard title="Contract Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Target Annual Price ($)</label>
                <input
                  type="number"
                  value={targetPrice || ''}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  placeholder="What the government will pay"
                />
                <p className="helper-text">From the solicitation, competitor intel, or your best guess</p>
              </div>
              <div>
                <label className="label">Annual Hours Required</label>
                <input
                  type="number"
                  value={annualHours || ''}
                  onChange={(e) => setAnnualHours(Number(e.target.value))}
                  placeholder="From your workloading"
                />
                <p className="helper-text">{calcFTEsNeeded().toFixed(1)} FTEs at 6.5 productive hrs/day</p>
              </div>
              <div>
                <label className="label">Annual Materials Cost ($)</label>
                <input
                  type="number"
                  value={materialsCost || ''}
                  onChange={(e) => setMaterialsCost(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Burden Profile</label>
                <select
                  value={selectedBurdenId}
                  onChange={(e) => setSelectedBurdenId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {burdenProfiles.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name} (${(bp.computedRate ?? 0).toFixed(2)}/hr)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Margin analysis table */}
          {targetPrice > 0 && annualHours > 0 && (
            <GlassCard title="Margin Analysis" subtitle="What burden rate you need at each profit margin">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Target Margin</th>
                    <th className="numeric">Max Labor Budget</th>
                    <th className="numeric">Max Burden Rate</th>
                    <th className="numeric">Max Base Wage</th>
                    <th>Feasible?</th>
                  </tr>
                </thead>
                <tbody>
                  {targetMargins.map((margin) => {
                    const maxRate = calcMaxBurdenRate(margin)
                    const maxBase = calcMaxBaseWage(maxRate)
                    const laborBudget = targetPrice * (1 - margin / 100) - materialsCost
                    const feasible = maxRate > 0 && (!burdenRate || maxRate >= burdenRate)
                    return (
                      <tr key={margin} className={!feasible ? 'opacity-50' : ''}>
                        <td className="font-semibold">{margin}%</td>
                        <td className="numeric">${laborBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="numeric value-accent">${maxRate.toFixed(2)}/hr</td>
                        <td className="numeric">
                          {maxBase !== null ? `$${maxBase.toFixed(2)}/hr` : '—'}
                        </td>
                        <td>
                          {feasible ? (
                            <span className="badge badge-green">Yes</span>
                          ) : (
                            <span className="badge badge-red">No</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {burdenRate > 0 && (
                <p className="text-xs text-text-tertiary mt-3">
                  Your current burden rate is <strong className="text-accent font-mono">${burdenRate.toFixed(2)}/hr</strong> ({selectedBurden?.name}).
                  Rows marked "No" require a lower rate than you currently have.
                </p>
              )}
            </GlassCard>
          )}
        </div>

        {/* Right: Live results */}
        <div>
          <GlassCard
            title="Verdict"
            className={`sticky top-8 ${isViable ? 'border-success/30' : targetPrice > 0 ? 'border-error/30' : ''}`}
          >
            {targetPrice > 0 && annualHours > 0 && burdenRate > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Status */}
                <div className={`p-4 rounded-lg text-center ${isViable ? 'bg-success/10' : 'bg-error/10'}`}>
                  {isViable ? (
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-error-light mx-auto mb-2" />
                  )}
                  <h3 className={`text-lg font-bold ${isViable ? 'text-success' : 'text-error-light'}`}>
                    {isViable ? 'Viable' : 'Not Viable'}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1">
                    {isViable ? 'You can make money on this contract' : 'Your costs exceed the target price or margin is too thin'}
                  </p>
                </div>

                {/* Numbers */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Target Price</span>
                    <span className="font-mono text-text-primary">${targetPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Your Cost</span>
                    <span className="font-mono text-text-primary">${currentTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="border-t border-border-subtle my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">
                      {isProfit ? 'Profit' : 'Loss'}
                    </span>
                    <span className={`text-xl font-bold font-mono ${isProfit ? 'text-success' : 'text-error-light'}`}>
                      {isProfit ? '' : '-'}${Math.abs(currentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Margin</span>
                    <span className={`font-mono font-semibold ${currentMarginPct >= 10 ? 'text-success' : currentMarginPct >= 5 ? 'text-warning' : 'text-error-light'}`}>
                      {currentMarginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="border-t border-border-subtle pt-3">
                  <h4 className="text-xs font-semibold text-text-secondary mb-2">Cost Breakdown</h4>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Labor ({annualHours.toFixed(0)} hrs x ${burdenRate.toFixed(2)})</span>
                      <span className="font-mono text-text-secondary">${currentLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Materials</span>
                      <span className="font-mono text-text-secondary">${materialsCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">FTEs needed</span>
                      <span className="font-mono text-text-secondary">{calcFTEsNeeded().toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {!isViable && (
                  <div className="border-t border-border-subtle pt-3">
                    <h4 className="text-xs font-semibold text-warning mb-2 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      To make this work
                    </h4>
                    <ul className="text-xs text-text-tertiary space-y-1">
                      {currentMarginPct < 5 && burdenRate > calcMaxBurdenRate(5) && (
                        <li>Reduce burden rate to ${calcMaxBurdenRate(5).toFixed(2)}/hr or less (currently ${burdenRate.toFixed(2)})</li>
                      )}
                      {currentMarginPct < 5 && (
                        <li>Reduce hours by {((currentTotalCost - targetPrice * 0.95) / burdenRate).toFixed(0)} hrs/yr to hit 5% margin</li>
                      )}
                      <li>Negotiate a higher target price: ${(currentTotalCost / 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })} for 10% margin</li>
                      <li>Reduce G&A rate or profit fee in Burden Builder</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 text-text-disabled mx-auto mb-3" />
                <p className="text-text-tertiary text-sm">
                  Enter a target price, hours, and select a burden profile to see your margin analysis
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
