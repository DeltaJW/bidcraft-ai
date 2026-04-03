import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserMinus, AlertTriangle, DollarSign } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { burdenProfilesStore, useStore } from '@/data/mockStore'

export default function TurnoverCalc() {
  const burdenProfiles = useStore(burdenProfilesStore)

  const [headcount, setHeadcount] = useState(10)
  const [turnoverPct, setTurnoverPct] = useState(200)
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [recruitCost, setRecruitCost] = useState(500)
  const [trainingHours, setTrainingHours] = useState(40)
  const [trainingWage, setTrainingWage] = useState(15)
  const [productivityLossDays, setProductivityLossDays] = useState(14)
  const [otBackfillHours, setOtBackfillHours] = useState(20)

  const selectedBurden = burdenProfiles.find(b => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0
  const baseWage = selectedBurden?.baseWage ?? 15

  // Calculations
  const annualSeparations = Math.round(headcount * (turnoverPct / 100))
  const recruitTotal = annualSeparations * recruitCost
  const trainingTotal = annualSeparations * trainingHours * trainingWage
  const productivityLossTotal = annualSeparations * productivityLossDays * 6.5 * baseWage * 0.5 // 50% productivity during ramp
  const otBackfillTotal = annualSeparations * otBackfillHours * burdenRate * 1.5 // OT rate
  const totalTurnoverCost = recruitTotal + trainingTotal + productivityLossTotal + otBackfillTotal
  const costPerSeparation = annualSeparations > 0 ? totalTurnoverCost / annualSeparations : 0
  const costPerHeadPerYear = headcount > 0 ? totalTurnoverCost / headcount : 0
  const pctOfPayroll = headcount > 0 && burdenRate > 0
    ? (totalTurnoverCost / (headcount * burdenRate * 2080)) * 100
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center gap-3 mb-2">
        <UserMinus className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Turnover Cost Calculator</h1>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        The janitorial industry averages 200% annual turnover. See what it actually costs your business — and how it impacts contract profitability.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <GlassCard title="Workforce">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Total Headcount</label>
                <input type="number" value={headcount} onChange={(e) => setHeadcount(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Annual Turnover Rate (%)</label>
                <input type="number" value={turnoverPct} onChange={(e) => setTurnoverPct(Number(e.target.value))} />
                <p className="helper-text">Industry avg: 200%. Top performers: 75-100%.</p>
              </div>
              <div>
                <label className="label">Burden Profile</label>
                <select value={selectedBurdenId} onChange={(e) => setSelectedBurdenId(e.target.value)}>
                  <option value="">— Select —</option>
                  {burdenProfiles.map((bp) => (
                    <option key={bp.id} value={bp.id}>{bp.name} (${bp.computedRate?.toFixed(2)}/hr)</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Cost Assumptions" subtitle="Adjust to match your actual costs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Recruiting Cost per Hire ($)</label>
                <input type="number" value={recruitCost} onChange={(e) => setRecruitCost(Number(e.target.value))} />
                <p className="helper-text">Job posting, screening, background check, drug test, onboarding paperwork</p>
              </div>
              <div>
                <label className="label">Training Hours per New Hire</label>
                <input type="number" value={trainingHours} onChange={(e) => setTrainingHours(Number(e.target.value))} />
                <p className="helper-text">Orientation, site training, equipment training, shadow shifts</p>
              </div>
              <div>
                <label className="label">Training Wage ($/hr)</label>
                <input type="number" step="0.01" value={trainingWage} onChange={(e) => setTrainingWage(Number(e.target.value))} />
                <p className="helper-text">What you pay during training (often base wage)</p>
              </div>
              <div>
                <label className="label">Productivity Loss Period (days)</label>
                <input type="number" value={productivityLossDays} onChange={(e) => setProductivityLossDays(Number(e.target.value))} />
                <p className="helper-text">Days until new hire reaches full productivity (assumed 50% during ramp)</p>
              </div>
              <div>
                <label className="label">OT Backfill Hours per Vacancy</label>
                <input type="number" value={otBackfillHours} onChange={(e) => setOtBackfillHours(Number(e.target.value))} />
                <p className="helper-text">Overtime hours to cover the gap while position is vacant</p>
              </div>
            </div>
          </GlassCard>

          {/* Cost breakdown table */}
          <GlassCard title="Annual Turnover Cost Breakdown">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cost Component</th>
                  <th className="numeric">Per Separation</th>
                  <th className="numeric">x {annualSeparations} separations</th>
                  <th className="numeric">Annual Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Recruiting & Onboarding</td>
                  <td className="numeric">${recruitCost.toLocaleString()}</td>
                  <td className="numeric">{annualSeparations}</td>
                  <td className="numeric">${recruitTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Training ({trainingHours} hrs x ${trainingWage}/hr)</td>
                  <td className="numeric">${(trainingHours * trainingWage).toLocaleString()}</td>
                  <td className="numeric">{annualSeparations}</td>
                  <td className="numeric">${trainingTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Productivity Loss ({productivityLossDays} days at 50%)</td>
                  <td className="numeric">${(productivityLossTotal / Math.max(annualSeparations, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="numeric">{annualSeparations}</td>
                  <td className="numeric">${productivityLossTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
                <tr>
                  <td>Overtime Backfill ({otBackfillHours} hrs at 1.5x)</td>
                  <td className="numeric">${(otBackfillTotal / Math.max(annualSeparations, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="numeric">{annualSeparations}</td>
                  <td className="numeric">${otBackfillTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="row-total">
                  <td colSpan={3}>Total Annual Turnover Cost</td>
                  <td className="numeric">${totalTurnoverCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              </tfoot>
            </table>
          </GlassCard>
        </div>

        {/* Right sidebar */}
        <div>
          <GlassCard title="Impact Summary" className="sticky top-8">
            <div className="flex flex-col gap-4">
              <div className={`p-4 rounded-lg text-center ${turnoverPct >= 150 ? 'bg-error/10' : turnoverPct >= 100 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${turnoverPct >= 150 ? 'text-error-light' : turnoverPct >= 100 ? 'text-warning' : 'text-success'}`} />
                <div className="text-2xl font-bold font-mono text-text-primary">{turnoverPct}%</div>
                <p className="text-xs text-text-tertiary">Annual Turnover Rate</p>
                <p className="text-xs mt-1 font-medium text-text-secondary">
                  {turnoverPct >= 200 ? 'Critical — industry worst' : turnoverPct >= 150 ? 'High — above average' : turnoverPct >= 100 ? 'Moderate' : 'Good — below average'}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Separations/Year</span>
                  <span className="font-mono text-text-primary font-bold">{annualSeparations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Cost per Separation</span>
                  <span className="font-mono text-text-primary">${costPerSeparation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Cost per Employee/Year</span>
                  <span className="font-mono text-text-primary">${costPerHeadPerYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="border-t border-border-subtle my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Annual Cost
                  </span>
                  <span className="text-xl font-bold font-mono text-error-light">
                    ${totalTurnoverCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {pctOfPayroll > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">% of Payroll</span>
                    <span className="font-mono text-warning">{pctOfPayroll.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* What-if: reduce turnover */}
              <div className="border-t border-border-subtle pt-3">
                <h4 className="text-xs font-semibold text-text-secondary mb-2">If you cut turnover to 100%:</h4>
                <div className="flex flex-col gap-1 text-xs">
                  {(() => {
                    const reducedSeps = Math.round(headcount * 1.0)
                    const reducedCost = reducedSeps * costPerSeparation
                    const savings = totalTurnoverCost - reducedCost
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-tertiary">Separations</span>
                          <span className="font-mono text-success">{reducedSeps} (down {annualSeparations - reducedSeps})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-tertiary">Annual savings</span>
                          <span className="font-mono text-success font-bold">${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <p className="text-xs text-text-disabled mt-2">
                  Invest in retention: better pay, training, scheduling flexibility, recognition programs
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
