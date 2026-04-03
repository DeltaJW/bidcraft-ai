import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Scale, Save, Trash2, Clock, ChevronRight, Plus } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { bidDecisionsStore, useStore } from '@/data/mockStore'

// ---- Types ----

export interface BidDecisionCriterion {
  key: string
  label: string
  description: string
  score: number // 0 = unscored, 1-5
}

export interface BidDecision {
  id: string
  opportunityName: string
  agency: string
  contractNumber: string
  estimatedValue: number
  dueDate: string
  criteria: BidDecisionCriterion[]
  totalScore: number
  recommendation: string
  notes: string
  createdAt: string
  updatedAt: string
}

// ---- Criteria Definitions ----

const CRITERIA_DEFS: { key: string; label: string; description: string }[] = [
  { key: 'contract_size', label: 'Contract Size Fit', description: 'Does this match our typical contract size? (1=way too big/small, 5=sweet spot)' },
  { key: 'geographic_fit', label: 'Geographic Fit', description: 'Is this in our operating area? (1=new market, 5=existing presence)' },
  { key: 'service_match', label: 'Service Type Match', description: 'Do we perform this type of work? (1=never done, 5=core competency)' },
  { key: 'past_performance', label: 'Past Performance', description: 'Do we have relevant past performance? (1=none, 5=directly relevant CPARS)' },
  { key: 'incumbent', label: 'Incumbent Advantage', description: 'Is there a strong incumbent? (1=entrenched incumbent, 5=new requirement/no incumbent)' },
  { key: 'competition', label: 'Competition Level', description: 'How many bidders expected? (1=10+ bidders, 5=sole source/limited)' },
  { key: 'margin', label: 'Margin Potential', description: 'Can we make money? (1=razor thin, 5=healthy margins)' },
  { key: 'win_probability', label: 'Win Probability', description: 'Overall gut feeling (1=long shot, 5=strong favorite)' },
  { key: 'strategic_value', label: 'Strategic Value', description: 'Does this open new doors? (1=one-off, 5=gateway to more work)' },
  { key: 'capacity', label: 'Capacity', description: 'Do we have bandwidth to perform? (1=fully stretched, 5=ready to go)' },
]

function buildDefaultCriteria(): BidDecisionCriterion[] {
  return CRITERIA_DEFS.map((d) => ({ ...d, score: 0 }))
}

function getRecommendation(total: number): { label: string; color: string; bg: string; description: string } {
  if (total >= 40) return { label: 'STRONG BID', color: 'text-success', bg: 'bg-success/10', description: 'High confidence -- commit resources' }
  if (total >= 30) return { label: 'CONSIDER', color: 'text-accent', bg: 'bg-accent/10', description: 'Worth pursuing with conditions' }
  if (total >= 20) return { label: 'CAUTION', color: 'text-warning', bg: 'bg-warning/10', description: 'Significant risks -- bid only if strategic' }
  return { label: 'NO-BID', color: 'text-error-light', bg: 'bg-error/10', description: "Don't waste resources" }
}

function scoreButtonColor(value: number, selected: boolean): string {
  if (!selected) return 'bg-surface-3 text-text-disabled hover:bg-surface-2 hover:text-text-secondary border border-border-subtle'
  switch (value) {
    case 1: return 'bg-error/20 text-error-light border border-error/40 ring-1 ring-error/30'
    case 2: return 'bg-orange-500/20 text-orange-300 border border-orange-500/40 ring-1 ring-orange-500/30'
    case 3: return 'bg-warning/20 text-warning border border-warning/40 ring-1 ring-warning/30'
    case 4: return 'bg-lime-500/20 text-lime-300 border border-lime-500/40 ring-1 ring-lime-500/30'
    case 5: return 'bg-success/20 text-success border border-success/40 ring-1 ring-success/30'
    default: return ''
  }
}

// ---- Component ----

export default function BidNoBid() {
  const savedDecisions = useStore(bidDecisionsStore)

  // Active scorecard state
  const [view, setView] = useState<'list' | 'scorecard'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [opportunityName, setOpportunityName] = useState('')
  const [agency, setAgency] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [estimatedValue, setEstimatedValue] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [criteria, setCriteria] = useState<BidDecisionCriterion[]>(buildDefaultCriteria())
  const [notes, setNotes] = useState('')

  const totalScore = useMemo(() => criteria.reduce((sum, c) => sum + c.score, 0), [criteria])
  const scoredCount = useMemo(() => criteria.filter((c) => c.score > 0).length, [criteria])
  const allScored = scoredCount === criteria.length
  const recommendation = getRecommendation(totalScore)

  function setScore(key: string, score: number) {
    setCriteria((prev) => prev.map((c) => (c.key === key ? { ...c, score } : c)))
  }

  function startNew() {
    setEditingId(null)
    setOpportunityName('')
    setAgency('')
    setContractNumber('')
    setEstimatedValue(0)
    setDueDate('')
    setCriteria(buildDefaultCriteria())
    setNotes('')
    setView('scorecard')
  }

  function loadDecision(d: BidDecision) {
    setEditingId(d.id)
    setOpportunityName(d.opportunityName)
    setAgency(d.agency)
    setContractNumber(d.contractNumber)
    setEstimatedValue(d.estimatedValue)
    setDueDate(d.dueDate)
    setCriteria(d.criteria)
    setNotes(d.notes)
    setView('scorecard')
  }

  function saveDecision() {
    const now = new Date().toISOString()
    const id = editingId || `bd-${Date.now()}`

    const decision: BidDecision = {
      id,
      opportunityName: opportunityName || 'Untitled Opportunity',
      agency,
      contractNumber,
      estimatedValue,
      dueDate,
      criteria,
      totalScore,
      recommendation: recommendation.label,
      notes,
      createdAt: editingId
        ? savedDecisions.find((d) => d.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    }

    bidDecisionsStore.update((prev) => {
      const idx = prev.findIndex((d) => d.id === id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = decision
        return next
      }
      return [decision, ...prev]
    })

    setEditingId(id)
  }

  function deleteDecision(id: string) {
    bidDecisionsStore.update((prev) => prev.filter((d) => d.id !== id))
  }

  // ---- Render: List View ----

  if (view === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Bid / No-Bid Decision</h1>
        </div>
        <p className="text-text-tertiary text-sm mb-6">
          Structured decision matrix to evaluate opportunities before committing bid resources.
        </p>

        <div className="mb-6">
          <button className="btn btn-primary flex items-center gap-2" onClick={startNew}>
            <Plus className="w-4 h-4" />
            New Scorecard
          </button>
        </div>

        {savedDecisions.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <Scale className="w-12 h-12 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-secondary mb-2">No Scorecards Yet</h3>
              <p className="text-text-tertiary text-sm max-w-md mx-auto">
                Create a bid/no-bid scorecard to evaluate opportunities using a structured 10-criteria decision matrix.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {savedDecisions.map((d) => {
              const rec = getRecommendation(d.totalScore)
              return (
                <GlassCard key={d.id} className="cursor-pointer hover:border-accent/30 transition-all">
                  <div className="flex items-center justify-between" onClick={() => loadDecision(d)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-text-primary truncate">{d.opportunityName}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.color} ${rec.bg}`}>
                          {rec.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        {d.agency && <span>{d.agency}</span>}
                        {d.contractNumber && <span>{d.contractNumber}</span>}
                        {d.estimatedValue > 0 && <span>${d.estimatedValue.toLocaleString()}</span>}
                        {d.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {d.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono text-text-primary">{d.totalScore}</div>
                        <div className="text-xs text-text-tertiary">/ 50</div>
                      </div>
                      <button
                        className="btn btn-ghost p-2 text-text-disabled hover:text-error-light"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDecision(d.id)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-text-disabled" />
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </motion.div>
    )
  }

  // ---- Render: Scorecard View ----

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl">
      <div className="flex items-center gap-3 mb-2">
        <Scale className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Bid / No-Bid Scorecard</h1>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost text-sm" onClick={() => setView('list')}>
          &larr; Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details + Criteria */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Opportunity Details */}
          <GlassCard title="Opportunity Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Opportunity Name *</label>
                <input
                  type="text"
                  value={opportunityName}
                  onChange={(e) => setOpportunityName(e.target.value)}
                  placeholder="e.g., Fort Hood Base Janitorial Services"
                />
              </div>
              <div>
                <label className="label">Agency</label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="e.g., GSA, Army, NPS"
                />
              </div>
              <div>
                <label className="label">Contract / Solicitation Number</label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g., W911NF-26-R-0001"
                />
              </div>
              <div>
                <label className="label">Estimated Annual Value ($)</label>
                <input
                  type="number"
                  value={estimatedValue || ''}
                  onChange={(e) => setEstimatedValue(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Proposal Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </GlassCard>

          {/* Scoring Criteria */}
          <GlassCard title="Scoring Criteria" subtitle="Rate each factor 1 (worst) to 5 (best)">
            <div className="flex flex-col gap-4">
              {criteria.map((c) => (
                <div
                  key={c.key}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-surface-2/50 border border-border-subtle"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary">{c.label}</div>
                    <div className="text-xs text-text-tertiary">{c.description}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setScore(c.key, c.score === v ? 0 : v)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${scoreButtonColor(v, c.score === v)}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notes */}
          <GlassCard title="Notes" subtitle="Key considerations, risks, or conditions">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Capture important context: why you scored certain factors low, conditions for proceeding, team input..."
            />
          </GlassCard>
        </div>

        {/* Right: Live Score Sidebar */}
        <div>
          <div className="sticky top-8 flex flex-col gap-5">
            <GlassCard className={`border ${allScored ? recommendation.color.replace('text-', 'border-') + '/30' : 'border-border-default'}`}>
              {/* Score Circle */}
              <div className="flex flex-col items-center mb-5">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(totalScore / 50) * 327} 327`}
                      className={`${recommendation.color} transition-all duration-500`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono text-text-primary">{totalScore}</span>
                    <span className="text-xs text-text-tertiary">/ 50</span>
                  </div>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className={`p-4 rounded-lg text-center mb-4 ${recommendation.bg}`}>
                <h3 className={`text-lg font-bold ${recommendation.color}`}>{recommendation.label}</h3>
                <p className="text-xs text-text-tertiary mt-1">{recommendation.description}</p>
              </div>

              {/* Criteria progress */}
              <div className="text-xs text-text-tertiary mb-4 text-center">
                {scoredCount} of {criteria.length} criteria scored
              </div>

              {/* Score breakdown */}
              <div className="border-t border-border-subtle pt-3 mb-4">
                <h4 className="text-xs font-semibold text-text-secondary mb-2">Score Thresholds</h4>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className={`flex justify-between ${totalScore >= 40 ? 'text-success font-semibold' : 'text-text-tertiary'}`}>
                    <span>40-50: Strong Bid</span>
                    <span>{totalScore >= 40 ? '<<<' : ''}</span>
                  </div>
                  <div className={`flex justify-between ${totalScore >= 30 && totalScore < 40 ? 'text-accent font-semibold' : 'text-text-tertiary'}`}>
                    <span>30-39: Consider</span>
                    <span>{totalScore >= 30 && totalScore < 40 ? '<<<' : ''}</span>
                  </div>
                  <div className={`flex justify-between ${totalScore >= 20 && totalScore < 30 ? 'text-warning font-semibold' : 'text-text-tertiary'}`}>
                    <span>20-29: Caution</span>
                    <span>{totalScore >= 20 && totalScore < 30 ? '<<<' : ''}</span>
                  </div>
                  <div className={`flex justify-between ${totalScore < 20 ? 'text-error-light font-semibold' : 'text-text-tertiary'}`}>
                    <span>Below 20: No-Bid</span>
                    <span>{totalScore > 0 && totalScore < 20 ? '<<<' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Weak areas */}
              {scoredCount > 0 && (
                <div className="border-t border-border-subtle pt-3 mb-4">
                  <h4 className="text-xs font-semibold text-text-secondary mb-2">Weak Areas (scored 1-2)</h4>
                  {criteria.filter((c) => c.score >= 1 && c.score <= 2).length === 0 ? (
                    <p className="text-xs text-text-tertiary">No weak areas identified</p>
                  ) : (
                    <div className="flex flex-col gap-1 text-xs">
                      {criteria
                        .filter((c) => c.score >= 1 && c.score <= 2)
                        .map((c) => (
                          <div key={c.key} className="flex items-center gap-2 text-error-light">
                            <span className="font-mono w-4 text-center">{c.score}</span>
                            <span>{c.label}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <button className="btn btn-primary w-full flex items-center justify-center gap-2" onClick={saveDecision}>
                <Save className="w-4 h-4" />
                {editingId ? 'Update Scorecard' : 'Save Scorecard'}
              </button>

              {editingId && (
                <p className="text-xs text-text-disabled text-center mt-2">
                  Last saved: {new Date(savedDecisions.find((d) => d.id === editingId)?.updatedAt || '').toLocaleString()}
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
