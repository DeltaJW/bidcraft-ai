import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, Download, ArrowRight, Loader2, AlertTriangle, Shield } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { downloadCSV } from '@/utils/csv'
import { fetchWageDetermination, type WageDetermination, type WageRate, COMMON_CATEGORIES } from '@/services/sca'
import { burdenProfilesStore } from '@/data/mockStore'
import type { BurdenProfile } from '@/types'

export default function SCALookup() {
  const [wdNumber, setWdNumber] = useState('')
  const [revision, setRevision] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WageDetermination | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  async function handleSearch() {
    const num = wdNumber.trim().replace(/^WD\s*/i, '').replace(/^#/, '')
    if (!num) {
      toast('Enter a wage determination number', 'error')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const wd = await fetchWageDetermination(num, revision ? parseInt(revision) : undefined)
      setResult(wd)
      toast(`Found WD ${wd.wdNumber} Rev ${wd.revision} — ${wd.rates.length} labor categories`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  function createBurdenProfile(rate: WageRate) {
    const profile: BurdenProfile = {
      id: `bp-${Date.now()}`,
      name: `${rate.occupation} — WD ${result?.wdNumber}`,
      baseWage: rate.rate,
      hwRate: result?.hwRate ?? 0,
      ficaPct: 7.65,
      suiPct: 2.7,
      wcPct: 5.0,
      futaPct: 0.6,
      vacationDays: 0,
      holidayDays: 10,
      sickDays: 0,
      gaPct: 12,
      feePct: 10,
      computedRate: null,
    }

    // Calculate the computed rate
    const basePlusHW = profile.baseWage + profile.hwRate
    const taxTotal = profile.baseWage * ((profile.ficaPct + profile.suiPct + profile.wcPct + profile.futaPct) / 100)
    const leaveDays = profile.vacationDays + profile.holidayDays + profile.sickDays
    const effectiveDays = 260 - leaveDays
    const leavePct = effectiveDays > 0 ? (leaveDays / effectiveDays) * 100 : 0
    const leaveDollar = (basePlusHW + taxTotal) * (leavePct / 100)
    const subtotal = basePlusHW + taxTotal + leaveDollar
    const gaDollar = subtotal * (profile.gaPct / 100)
    const preProfit = subtotal + gaDollar
    const feeDollar = preProfit * (profile.feePct / 100)
    profile.computedRate = preProfit + feeDollar

    burdenProfilesStore.update((prev) => [...prev, profile])
    toast(`Created burden profile: ${rate.occupation} @ $${rate.rate}/hr → $${profile.computedRate.toFixed(2)}/hr burdened`)
  }

  function exportRates() {
    if (!result) return
    const headers = ['Code', 'Occupation', 'Hourly Rate']
    const rows = result.rates.map(r => [r.code, r.occupation, r.rate])
    downloadCSV(`WD-${result.wdNumber}-Rev${result.revision}.csv`, headers, rows)
    toast('Wage rates exported as CSV')
  }

  const filteredRates = result?.rates.filter(r =>
    r.occupation.toLowerCase().includes(filter.toLowerCase()) ||
    r.code.includes(filter)
  ) ?? []

  const commonCodes = new Set(COMMON_CATEGORIES.map(c => c.code))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">SCA Wage Determination Lookup</h1>
        <span className="badge badge-blue">SAM.gov</span>
      </div>

      {/* Search */}
      <GlassCard title="Look Up Wage Determination" subtitle="Enter the WD number from your RFP or contract solicitation">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">WD Number</label>
            <input
              value={wdNumber}
              onChange={(e) => setWdNumber(e.target.value)}
              placeholder="2015-4281"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <p className="helper-text">Found in Section J of the solicitation or on the SF-1449</p>
          </div>
          <div className="w-32">
            <label className="label">Revision (optional)</label>
            <input
              type="number"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="Latest"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading || !wdNumber.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </div>
      </GlassCard>

      {/* Error */}
      {error && (
        <div className="mt-4 glass p-4 flex items-center gap-3 border-error/30">
          <AlertTriangle className="w-5 h-5 text-error-light" />
          <span className="text-sm text-error-light">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex flex-col gap-4"
        >
          {/* WD Info */}
          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  WD {result.wdNumber} — Revision {result.revision}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-text-tertiary">
                  {result.active && <span className="badge badge-green">Active</span>}
                  {result.publishDate && <span>Published: {result.publishDate}</span>}
                  <span>{result.rates.length} labor categories</span>
                  {result.hwRate && <span>H&W: ${result.hwRate.toFixed(2)}/hr</span>}
                </div>
                {result.locationText && (
                  <p className="text-xs text-text-tertiary mt-2">{result.locationText}</p>
                )}
              </div>
              <button className="btn btn-ghost" onClick={exportRates}>
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </GlassCard>

          {/* H&W callout */}
          {result.hwRate && (
            <div className="card-brand p-4 flex items-center gap-3">
              <div className="text-sm">
                <span className="text-text-tertiary">Health & Welfare Rate: </span>
                <span className="text-xl font-bold font-mono text-accent">${result.hwRate.toFixed(2)}</span>
                <span className="text-text-tertiary"> /hr</span>
              </div>
            </div>
          )}

          {/* Filter + Rate Table */}
          <GlassCard title={`Labor Categories (${filteredRates.length})`}>
            <div className="mb-4">
              <input
                placeholder="Filter by occupation or code..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Occupation</th>
                    <th className="numeric">Hourly Rate</th>
                    <th className="w-40"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRates.map((r) => (
                    <tr key={r.code + r.occupation} className={commonCodes.has(r.code) ? 'bg-accent/5' : ''}>
                      <td className="font-mono text-xs">{r.code}</td>
                      <td>
                        {r.occupation}
                        {commonCodes.has(r.code) && (
                          <span className="badge badge-blue ml-2">Common</span>
                        )}
                      </td>
                      <td className="numeric">${r.rate.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-ghost !text-xs !py-1 !px-2"
                          onClick={() => createBurdenProfile(r)}
                        >
                          <ArrowRight className="w-3 h-3" />
                          Create Burden Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRates.length === 0 && filter && (
              <p className="text-center text-text-tertiary text-sm py-4">No categories match "{filter}"</p>
            )}
          </GlassCard>

          {/* Vacation / Holidays info */}
          {(result.vacationText || result.holidaysText) && (
            <GlassCard title="Leave & Holiday Requirements">
              {result.vacationText && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-text-secondary mb-1">Vacation</h4>
                  <p className="text-xs text-text-tertiary whitespace-pre-wrap">{result.vacationText}</p>
                </div>
              )}
              {result.holidaysText && (
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary mb-1">Holidays</h4>
                  <p className="text-xs text-text-tertiary whitespace-pre-wrap">{result.holidaysText}</p>
                </div>
              )}
            </GlassCard>
          )}
        </motion.div>
      )}

      {/* Help text when no search yet */}
      {!result && !loading && !error && (
        <div className="mt-8 text-center">
          <FileText className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-text-secondary font-medium mb-2">Where to find your WD number</h3>
          <p className="text-sm text-text-tertiary max-w-lg mx-auto">
            The Wage Determination number is in your contract solicitation, usually in Section J
            (Attachments) or referenced on the SF-1449 form. It looks like <code className="text-accent">2015-4281</code>.
            Enter it above and we'll pull every labor category with current rates directly from SAM.gov.
          </p>
        </div>
      )}
    </motion.div>
  )
}
