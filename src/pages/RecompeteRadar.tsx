import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Radar, Search, Loader2, Bookmark, BookmarkCheck, Clock, Trash2, Download } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { downloadCSV } from '@/utils/csv'

/* ── types ── */
interface RecompeteResult {
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
  daysUntilEnd: number
  urgency: 'red' | 'amber' | 'green'
}

interface TrackedContract {
  id: string
  recipient: string
  agency: string
  awardAmount: number
  endDate: string
  description: string
  trackedAt: string
}

/* ── constants ── */
const STORAGE_KEY = 'bidcraft-recompete-watchlist'

const NAICS_CODES: Record<string, string> = {
  '561720': 'Janitorial Services',
  '561210': 'Facilities Support Services',
  '561730': 'Landscaping Services',
  '561612': 'Security Guards and Patrol',
  '561621': 'Security Systems Services',
  '561110': 'Office Administrative Services',
}

const US_STATES = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH',
  'OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

/* ── helpers ── */
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgency(daysUntilEnd: number): 'red' | 'amber' | 'green' {
  if (daysUntilEnd <= 180) return 'red'
  if (daysUntilEnd <= 365) return 'amber'
  return 'green'
}

function urgencyLabel(u: 'red' | 'amber' | 'green') {
  if (u === 'red') return '< 6 mo'
  if (u === 'amber') return '6-12 mo'
  return '12-18 mo'
}

function urgencyBadgeClass(u: 'red' | 'amber' | 'green') {
  if (u === 'red') return 'bg-red-500/15 text-red-400 border border-red-500/25'
  if (u === 'amber') return 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
  return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
}

function formatCurrency(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

function countdownText(endDate: string) {
  const days = daysBetween(new Date(), new Date(endDate))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Today'
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  return `${months}mo`
}

/* ── localStorage helpers ── */
function loadWatchlist(): TrackedContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWatchlist(list: TrackedContract[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/* ── component ── */
export default function RecompeteRadar() {
  const [naics, setNaics] = useState('561720')
  const [state, setState] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RecompeteResult[]>([])
  const [searched, setSearched] = useState(false)
  const [watchlist, setWatchlist] = useState<TrackedContract[]>(loadWatchlist)

  // Persist watchlist changes
  useEffect(() => {
    saveWatchlist(watchlist)
  }, [watchlist])

  const isTracked = useCallback(
    (id: string) => watchlist.some((w) => w.id === id),
    [watchlist]
  )

  /* ── search ── */
  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    setResults([])

    const now = new Date()
    // We want contracts whose end date is between now and 18 months from now.
    // USASpending time_period filters by action date range, but we'll search
    // a wide window and then client-filter by end date.
    const eighteenMonthsOut = new Date(now)
    eighteenMonthsOut.setMonth(eighteenMonthsOut.getMonth() + 18)

    // Search for contracts active in the next 18 months
    // Use a broad time_period to capture contracts that will end in our window
    const searchStart = new Date(now)
    searchStart.setFullYear(searchStart.getFullYear() - 5) // look back for long-running contracts

    try {
      const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            naics_codes: [naics],
            award_type_codes: ['A', 'B', 'C', 'D'],
            time_period: [{
              start_date: searchStart.toISOString().slice(0, 10),
              end_date: eighteenMonthsOut.toISOString().slice(0, 10),
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
          limit: 100,
          page: 1,
          sort: 'End Date',
          order: 'asc',
        }),
      })

      if (!res.ok) throw new Error(`USASpending API returned ${res.status}`)
      const data = await res.json()

      const today = new Date()
      const maxDate = new Date(today)
      maxDate.setMonth(maxDate.getMonth() + 18)

      const awards: RecompeteResult[] = (data.results || [])
        .map((r: Record<string, unknown>, i: number) => {
          const endDateStr = (r['End Date'] as string) || ''
          if (!endDateStr) return null
          const endDate = new Date(endDateStr)
          const days = daysBetween(today, endDate)

          // Only keep contracts ending within 0-18 months
          if (days < 0 || days > 548) return null

          return {
            id: (r['Award ID'] as string) || `recompete-${i}`,
            recipient: (r['Recipient Name'] as string) || 'Unknown',
            awardAmount: (r['Award Amount'] as number) || 0,
            agency: (r['Awarding Agency'] as string) || '',
            description: (r['Description'] as string) || '',
            startDate: (r['Start Date'] as string) || '',
            endDate: endDateStr,
            state: (r['Place of Performance State Code'] as string) || '',
            naics: (r['NAICS Code'] as string) || naics,
            type: (r['Award Type'] as string) || '',
            daysUntilEnd: days,
            urgency: getUrgency(days),
          }
        })
        .filter(Boolean) as RecompeteResult[]

      // Sort by days until end (soonest first)
      awards.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd)

      setResults(awards)
      if (awards.length === 0) {
        toast('No expiring contracts found for this search', 'info')
      } else {
        toast(`Found ${awards.length} contracts expiring within 18 months`)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── track / untrack ── */
  function trackContract(r: RecompeteResult) {
    if (isTracked(r.id)) {
      setWatchlist((prev) => prev.filter((w) => w.id !== r.id))
      toast('Removed from watch list', 'info')
    } else {
      setWatchlist((prev) => [
        ...prev,
        {
          id: r.id,
          recipient: r.recipient,
          agency: r.agency,
          awardAmount: r.awardAmount,
          endDate: r.endDate,
          description: r.description,
          trackedAt: new Date().toISOString(),
        },
      ])
      toast('Added to watch list')
    }
  }

  function removeTracked(id: string) {
    setWatchlist((prev) => prev.filter((w) => w.id !== id))
    toast('Removed from watch list', 'info')
  }

  /* ── export ── */
  function exportResults() {
    const headers = ['Recipient', 'Award Amount', 'Agency', 'State', 'Start Date', 'End Date', 'Days Until End', 'Urgency', 'Description']
    const rows = results.map((r) => [
      r.recipient,
      r.awardAmount,
      r.agency,
      r.state,
      r.startDate,
      r.endDate,
      r.daysUntilEnd,
      urgencyLabel(r.urgency),
      r.description,
    ])
    downloadCSV(`recompete-radar-${naics}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  /* ── computed stats ── */
  const redCount = results.filter((r) => r.urgency === 'red').length
  const amberCount = results.filter((r) => r.urgency === 'amber').length
  const greenCount = results.filter((r) => r.urgency === 'green').length
  const totalValue = results.reduce((s, r) => s + r.awardAmount, 0)

  /* ── watchlist with live countdowns ── */
  const watchlistSorted = [...watchlist].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Radar className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Recompete Radar</h1>
        <span className="badge badge-blue">USASpending</span>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Find federal contracts expiring in your market. Track recompete opportunities before they hit the street.
      </p>

      {/* Search */}
      <GlassCard title="Search Expiring Contracts" className="mb-6">
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
              {US_STATES.map((s) => (
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
              {loading ? 'Scanning...' : 'Scan Market'}
            </button>
          </div>
        </div>
        <p className="helper-text mt-2">
          Finds contracts ending within 6-18 months. Data from USASpending.gov — no API key needed.
        </p>
      </GlassCard>

      {/* Watch List */}
      {watchlistSorted.length > 0 && (
        <GlassCard
          title={`Watch List (${watchlistSorted.length})`}
          className="mb-6"
          action={
            <div className="flex items-center gap-1">
              <BookmarkCheck className="w-4 h-4 text-accent" />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {watchlistSorted.map((w) => {
              const days = daysBetween(new Date(), new Date(w.endDate))
              const urg = getUrgency(Math.max(days, 0))
              return (
                <div
                  key={w.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-0 border border-border-subtle"
                >
                  <div className={`shrink-0 px-2 py-1 rounded text-xs font-bold font-mono ${urgencyBadgeClass(urg)}`}>
                    {countdownText(w.endDate)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{w.recipient}</div>
                    <div className="text-xs text-text-tertiary truncate">{w.agency}</div>
                    <div className="text-xs text-text-disabled mt-0.5">
                      Ends {w.endDate} &middot; {formatCurrency(w.awardAmount)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeTracked(w.id)}
                    className="shrink-0 p-1 rounded hover:bg-surface-3 text-text-disabled hover:text-red-400 transition-colors"
                    title="Remove from watch list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Stats Row */}
      {searched && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-400">{redCount}</div>
              <div className="text-xs text-text-tertiary">Expiring &lt; 6 mo</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-amber-400">{amberCount}</div>
              <div className="text-xs text-text-tertiary">Expiring 6-12 mo</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{greenCount}</div>
              <div className="text-xs text-text-tertiary">Expiring 12-18 mo</div>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <div className="text-2xl font-bold font-mono text-accent">{formatCurrency(totalValue)}</div>
              <div className="text-xs text-text-tertiary">Total Value</div>
            </GlassCard>
          </div>

          {/* Results Table */}
          <GlassCard
            title={`Expiring Contracts (${results.length})`}
            action={
              <button className="btn btn-ghost !text-xs" onClick={exportResults}>
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Urgency</th>
                    <th>Incumbent</th>
                    <th>Agency</th>
                    <th className="numeric">Value</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${urgencyBadgeClass(r.urgency)}`}>
                          {urgencyLabel(r.urgency)}
                        </span>
                      </td>
                      <td className="font-medium max-w-[180px] truncate">{r.recipient}</td>
                      <td className="text-xs max-w-[200px] truncate">{r.agency}</td>
                      <td className="numeric value-accent">{formatCurrency(r.awardAmount)}</td>
                      <td className="text-xs whitespace-nowrap">{r.startDate}</td>
                      <td className="text-xs whitespace-nowrap">{r.endDate}</td>
                      <td className="text-xs max-w-[200px] truncate" title={r.description}>{r.description}</td>
                      <td>
                        <button
                          onClick={() => trackContract(r)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isTracked(r.id)
                              ? 'bg-accent/15 text-accent'
                              : 'hover:bg-surface-3 text-text-disabled hover:text-accent'
                          }`}
                          title={isTracked(r.id) ? 'Remove from watch list' : 'Track this contract'}
                        >
                          {isTracked(r.id) ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {/* Empty states */}
      {searched && results.length === 0 && !loading && (
        <GlassCard className="text-center py-12">
          <Radar className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <p className="text-text-tertiary">No expiring contracts found. Try a broader search — different NAICS, state, or keyword.</p>
        </GlassCard>
      )}

      {!searched && watchlistSorted.length === 0 && (
        <GlassCard className="text-center py-12">
          <Radar className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-text-secondary font-medium mb-2">Spot recompetes before the competition</h3>
          <p className="text-sm text-text-tertiary max-w-lg mx-auto">
            Search for federal contracts expiring in 6-18 months by industry, state, and keyword.
            Track the ones in your market and start positioning early.
            Data pulled live from USASpending.gov — no API key required.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-text-disabled">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Countdown tracking
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Personal watch list
            </span>
          </div>
        </GlassCard>
      )}
    </motion.div>
  )
}
