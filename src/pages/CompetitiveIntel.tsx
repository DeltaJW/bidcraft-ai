import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Search, Loader2 } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { downloadCSV } from '@/utils/csv'

interface AwardResult {
  id: string
  recipient: string
  awardAmount: number
  agency: string
  description: string
  startDate: string
  endDate: string
  state: string
  naics: string
  type: string
}

const NAICS_CODES: Record<string, string> = {
  '561720': 'Janitorial Services',
  '561210': 'Facilities Support Services',
  '561730': 'Landscaping Services',
  '561612': 'Security Guards and Patrol',
  '561621': 'Security Systems Services',
  '561110': 'Office Administrative Services',
}

export default function CompetitiveIntel() {
  const [naics, setNaics] = useState('561720')
  const [state, setState] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AwardResult[]>([])
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    setResults([])

    try {
      const params: Record<string, string> = {
        naics_codes: naics,
        award_type_codes: '["A","B","C","D"]', // contracts
        time_period: JSON.stringify([{
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          end_date: new Date().toISOString().slice(0, 10),
        }]),
        limit: '50',
        page: '1',
        sort: '-Award Amount',
        order: 'desc',
      }

      if (state) {
        params.place_of_performance_locations = JSON.stringify([{ country: 'USA', state }])
      }
      if (keyword) {
        params.keywords = JSON.stringify([keyword])
      }

      const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            naics_codes: [naics],
            award_type_codes: ['A', 'B', 'C', 'D'],
            time_period: [{
              start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              end_date: new Date().toISOString().slice(0, 10),
            }],
            ...(state ? { place_of_performance_locations: [{ country: 'USA', state }] } : {}),
            ...(keyword ? { keywords: [keyword] } : {}),
          },
          fields: [
            'Award ID',
            'Recipient Name',
            'Award Amount',
            'Awarding Agency',
            'Description',
            'Start Date',
            'End Date',
            'Place of Performance State Code',
            'NAICS Code',
            'Award Type',
          ],
          limit: 50,
          page: 1,
          sort: 'Award Amount',
          order: 'desc',
        }),
      })

      if (!res.ok) throw new Error(`USASpending API returned ${res.status}`)
      const data = await res.json()

      const awards: AwardResult[] = (data.results || []).map((r: Record<string, unknown>, i: number) => ({
        id: `award-${i}`,
        recipient: (r['Recipient Name'] as string) || 'Unknown',
        awardAmount: (r['Award Amount'] as number) || 0,
        agency: (r['Awarding Agency'] as string) || '',
        description: (r['Description'] as string) || '',
        startDate: (r['Start Date'] as string) || '',
        endDate: (r['End Date'] as string) || '',
        state: (r['Place of Performance State Code'] as string) || '',
        naics: (r['NAICS Code'] as string) || naics,
        type: (r['Award Type'] as string) || '',
      }))

      setResults(awards)
      if (awards.length === 0) {
        toast('No awards found for this search', 'info')
      } else {
        toast(`Found ${awards.length} awards`)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  function exportResults() {
    const headers = ['Recipient', 'Award Amount', 'Agency', 'State', 'Start Date', 'End Date', 'Description']
    const rows = results.map(r => [
      r.recipient,
      r.awardAmount,
      r.agency,
      r.state,
      r.startDate,
      r.endDate,
      r.description,
    ])
    downloadCSV(`competitive-intel-${naics}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  const totalValue = results.reduce((s, r) => s + r.awardAmount, 0)
  const avgValue = results.length > 0 ? totalValue / results.length : 0
  const topRecipients = [...new Map(results.map(r => [r.recipient, r])).values()]
    .sort((a, b) => b.awardAmount - a.awardAmount)
    .slice(0, 5)

  const US_STATES = [
    '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
    'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH',
    'OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      <div className="mb-2">
        <p className="section-label">Intelligence</p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Competitive Intelligence</h1>
          <span className="badge badge-blue">USASpending</span>
        </div>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        See who's winning contracts in your market. Pull real award data from USASpending.gov — free, no API key needed.
      </p>

      {/* Search */}
      <GlassCard title="Search Awards" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Industry (NAICS)</label>
            <select value={naics} onChange={(e) => setNaics(e.target.value)}>
              {Object.entries(NAICS_CODES).map(([code, label]) => (
                <option key={code} value={code}>{code} — {label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">State (optional)</label>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {US_STATES.map(s => (
                <option key={s} value={s}>{s || 'All states'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Keyword (optional)</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. custodial, janitorial"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching...' : 'Search Awards'}
            </button>
          </div>
        </div>
        <p className="helper-text mt-2">Searches last 12 months of federal contract awards. Data from USASpending.gov.</p>
      </GlassCard>

      {/* Results */}
      {searched && results.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-text-primary">{results.length}</div>
              <div className="text-xs text-text-tertiary">Awards Found</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-accent">
                ${totalValue >= 1e6 ? `${(totalValue / 1e6).toFixed(1)}M` : `${(totalValue / 1e3).toFixed(0)}K`}
              </div>
              <div className="text-xs text-text-tertiary">Total Value</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-text-primary">
                ${avgValue >= 1e6 ? `${(avgValue / 1e6).toFixed(1)}M` : `${(avgValue / 1e3).toFixed(0)}K`}
              </div>
              <div className="text-xs text-text-tertiary">Avg Award</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-text-primary">{new Set(results.map(r => r.recipient)).size}</div>
              <div className="text-xs text-text-tertiary">Unique Winners</div>
            </GlassCard>
          </div>

          {/* Top competitors */}
          {topRecipients.length > 0 && (
            <GlassCard title="Top Award Recipients" className="mb-6" action={
              <button className="btn btn-ghost !text-xs" onClick={exportResults}>Export CSV</button>
            }>
              <div className="flex flex-col gap-2">
                {topRecipients.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-0">
                    <span className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-text-primary truncate">{r.recipient}</span>
                    <span className="font-mono text-sm text-accent font-bold">
                      ${r.awardAmount >= 1e6 ? `${(r.awardAmount / 1e6).toFixed(1)}M` : `${(r.awardAmount / 1e3).toFixed(0)}K`}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Full results table */}
          <GlassCard title={`All Awards (${results.length})`}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th className="numeric">Amount</th>
                    <th>Agency</th>
                    <th>State</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium max-w-xs truncate">{r.recipient}</td>
                      <td className="numeric value-accent">
                        ${r.awardAmount >= 1e6 ? `${(r.awardAmount / 1e6).toFixed(2)}M` : r.awardAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-xs max-w-xs truncate">{r.agency}</td>
                      <td>{r.state}</td>
                      <td className="text-xs">{r.startDate} — {r.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {searched && results.length === 0 && !loading && (
        <GlassCard className="text-center py-12">
          <Eye className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <p className="text-text-tertiary">No awards found. Try a broader search — different NAICS, state, or keyword.</p>
        </GlassCard>
      )}

      {!searched && (
        <GlassCard className="text-center py-12">
          <Eye className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-text-secondary font-medium mb-2">Know your competition</h3>
          <p className="text-sm text-text-tertiary max-w-lg mx-auto">
            Search federal contract awards by industry, state, and keyword.
            See who's winning, what they're charging, and where the opportunities are.
            Data pulled live from USASpending.gov — no API key required.
          </p>
        </GlassCard>
      )}
    </motion.div>
  )
}
