import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Save, RotateCcw, Trash2, Plus, Pencil, Download, Search } from 'lucide-react'
import HelpTip from '@/components/HelpTip'
import { toast } from '@/components/Toast'
import { burdenProfilesStore, lastSCALookupStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'
import type { BurdenProfile } from '@/types'

const STEPS = [
  { title: 'Base Wage', desc: 'Starting hourly rate' },
  { title: 'Fringe', desc: 'Health & Welfare' },
  { title: 'Taxes', desc: 'FICA, SUI, WC, FUTA' },
  { title: 'Leave', desc: 'PTO / Holidays' },
  { title: 'G&A', desc: 'Overhead costs' },
  { title: 'Profit', desc: 'Fee margin' },
]

const SUI_BY_STATE: Record<string, number> = {
  AL: 2.7, AK: 2.0, AZ: 2.0, AR: 3.1, CA: 3.4, CO: 1.7, CT: 3.0, DE: 1.8,
  FL: 2.7, GA: 2.7, HI: 3.0, ID: 1.0, IL: 3.175, IN: 2.5, IA: 1.0, KS: 2.7,
  KY: 2.7, LA: 1.4, ME: 2.4, MD: 2.3, MA: 1.62, MI: 2.7, MN: 1.0, MS: 1.2,
  MO: 2.376, MT: 1.18, NE: 1.25, NV: 2.95, NH: 2.7, NJ: 2.8, NM: 1.0,
  NY: 4.025, NC: 1.0, ND: 1.02, OH: 2.7, OK: 1.5, OR: 2.1, PA: 3.6890,
  RI: 1.09, SC: 0.41, SD: 1.0, TN: 2.7, TX: 2.7, UT: 1.1, VT: 1.0,
  VA: 2.5, WA: 1.29, WV: 2.7, WI: 3.05, WY: 1.94, DC: 2.7,
}

function emptyProfile(): BurdenProfile {
  return {
    id: `bp-${Date.now()}`,
    name: '',
    baseWage: 0,
    hwRate: 0,
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
}

const pageAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function BurdenBuilder() {
  const savedProfiles = useStore(burdenProfilesStore)
  const lastSCA = useStore(lastSCALookupStore)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<BurdenProfile>(emptyProfile())
  const [saved, setSaved] = useState(false)
  const [suiState, setSuiState] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function update<K extends keyof BurdenProfile>(field: K, value: BurdenProfile[K]) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  // Calculations
  const basePlusHW = profile.baseWage + profile.hwRate
  const ficaDollar = profile.baseWage * (profile.ficaPct / 100)
  const annualWage = profile.baseWage * 2080
  const suiWageCap = 7000
  const futaWageCap = 7000
  const suiEffectivePct = annualWage > 0 ? Math.min(1, suiWageCap / annualWage) * profile.suiPct : profile.suiPct
  const futaEffectivePct = annualWage > 0 ? Math.min(1, futaWageCap / annualWage) * profile.futaPct : profile.futaPct
  const suiDollar = profile.baseWage * (suiEffectivePct / 100)
  const wcDollar = profile.baseWage * (profile.wcPct / 100)
  const futaDollar = profile.baseWage * (futaEffectivePct / 100)
  const taxTotal = ficaDollar + suiDollar + wcDollar + futaDollar

  const totalPaidDays = profile.vacationDays + profile.holidayDays + profile.sickDays
  const workDaysPerYear = 260
  const effectiveWorkDays = workDaysPerYear - totalPaidDays
  const leavePct = effectiveWorkDays > 0 ? (totalPaidDays / effectiveWorkDays) * 100 : 0
  const leaveDollar = (basePlusHW + taxTotal) * (leavePct / 100)

  const subtotal = basePlusHW + taxTotal + leaveDollar
  const gaDollar = subtotal * (profile.gaPct / 100)
  const preProfit = subtotal + gaDollar
  const feeDollar = preProfit * (profile.feePct / 100)
  const fullyBurdened = preProfit + feeDollar

  function handleExportBreakdown() {
    const headers = ['Component', 'Percentage', 'Dollar Amount']
    const rows: (string | number)[][] = [
      ['Base Wage', '', profile.baseWage.toFixed(2)],
      ['Health & Welfare', '', profile.hwRate.toFixed(2)],
      ['Subtotal (Base + H&W)', '', basePlusHW.toFixed(2)],
      [`FICA`, `${profile.ficaPct}%`, ficaDollar.toFixed(2)],
      [`SUI`, `${profile.suiPct}%`, suiDollar.toFixed(2)],
      [`Workers Comp`, `${profile.wcPct}%`, wcDollar.toFixed(2)],
      [`FUTA`, `${profile.futaPct}%`, futaDollar.toFixed(2)],
      ['Tax Total', '', taxTotal.toFixed(2)],
      ['Leave / PTO', `${leavePct.toFixed(1)}%`, leaveDollar.toFixed(2)],
      ['Direct Cost', '', subtotal.toFixed(2)],
      [`G&A / Overhead`, `${profile.gaPct}%`, gaDollar.toFixed(2)],
      [`Profit / Fee`, `${profile.feePct}%`, feeDollar.toFixed(2)],
      ['Fully Burdened Rate', '', fullyBurdened.toFixed(2)],
    ]
    const name = profile.name.trim() || 'burden-breakdown'
    downloadCSV(`bidcraft-${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast('Burden breakdown exported as CSV')
  }

  function handleSave() {
    if (profile.baseWage <= 0) {
      toast('Base wage is required', 'error')
      setStep(0)
      return
    }
    if (!profile.name.trim()) {
      toast('Profile name is required', 'error')
      return
    }
    if (lastSCA?.janitorRate && profile.baseWage < lastSCA.janitorRate) {
      toast(
        `Warning: $${profile.baseWage.toFixed(2)}/hr is below the SCA minimum of $${lastSCA.janitorRate.toFixed(2)}/hr (WD ${lastSCA.wdNumber}). Verify compliance.`,
        'error'
      )
    }
    const completed: BurdenProfile = {
      ...profile,
      name: profile.name.trim(),
      computedRate: fullyBurdened,
    }
    if (editingId) {
      burdenProfilesStore.update((profiles) =>
        profiles.map((p) => (p.id === editingId ? completed : p))
      )
    } else {
      burdenProfilesStore.update((profiles) => [...profiles, completed])
    }
    toast(editingId ? `Profile "${completed.name}" updated` : `Profile "${completed.name}" saved`)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setProfile(emptyProfile())
      setEditingId(null)
      setStep(0)
    }, 1500)
  }

  function loadProfile(bp: BurdenProfile) {
    setProfile({ ...bp })
    setEditingId(bp.id)
    setStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSuiStateChange(st: string) {
    setSuiState(st)
    if (SUI_BY_STATE[st]) {
      update('suiPct', SUI_BY_STATE[st])
    }
  }

  const waterfallSegments = [
    { label: 'Base', value: profile.baseWage, color: 'bg-accent' },
    { label: 'H&W', value: profile.hwRate, color: 'bg-blue-400' },
    { label: 'Taxes', value: taxTotal, color: 'bg-amber-400' },
    { label: 'Leave', value: leaveDollar, color: 'bg-purple-400' },
    { label: 'G&A', value: gaDollar, color: 'bg-emerald-400' },
    { label: 'Profit', value: feeDollar, color: 'bg-rose-400' },
  ]

  return (
    <motion.div
      className="max-w-5xl"
      initial="hidden"
      animate="show"
      variants={pageAnim}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Rate Calculator</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Burden Rate Builder</h1>
            {editingId && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">
                Editing
              </span>
            )}
          </div>
        </div>
        {editingId && (
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary hover:border-border-strong transition-all"
            onClick={() => { setProfile(emptyProfile()); setEditingId(null); setStep(0) }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Profile
          </button>
        )}
      </motion.div>

      {/* Profile name */}
      <motion.div variants={fadeIn} className="mb-6">
        <input
          className="!max-w-sm"
          placeholder="Profile name (e.g. GSA Valley Region, Commercial Default)"
          value={profile.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Steps */}
        <motion.div variants={fadeIn} className="lg:col-span-2">
          {/* Step indicators — segmented control style */}
          <div className="flex items-stretch gap-0 mb-5 rounded-lg border border-border-subtle overflow-hidden">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 py-2 px-1 text-center cursor-pointer border-none transition-all ${
                  i === step
                    ? 'bg-accent/15 text-accent'
                    : i < step
                      ? 'bg-surface-2 text-emerald-400'
                      : 'bg-surface-1 text-text-disabled hover:text-text-tertiary hover:bg-surface-2'
                } ${i > 0 ? 'border-l border-border-subtle' : ''}`}
                style={i > 0 ? { borderLeft: '1px solid var(--color-border-subtle)' } : {}}
              >
                <div className="text-[10px] font-mono font-bold">{String(i + 1).padStart(2, '0')}</div>
                <div className="text-[11px] font-semibold">{s.title}</div>
              </button>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
            >
              <div className="card-accent-left p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">{STEPS[step].title}</h3>
                  <p className="text-[11px] text-text-disabled">{STEPS[step].desc}</p>
                </div>

                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Base Hourly Wage ($) <HelpTip text="The starting hourly rate from your SCA Wage Determination or your company's prevailing wage. For federal contracts, this must meet the SCA minimum for the labor category." /></label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.baseWage || ''}
                        onChange={(e) => update('baseWage', Number(e.target.value))}
                        placeholder="17.75"
                      />
                      <p className="text-[11px] text-text-disabled mt-1">
                        Enter from SCA Wage Determination or your prevailing wage
                      </p>
                    </div>
                    {profile.baseWage === 0 && (
                      <div className="bg-accent/5 border border-accent/15 p-3 rounded-lg flex items-start gap-3">
                        <Search className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">
                            Need to find SCA wage rates? Look up the wage determination for your contract.
                          </p>
                          <Link
                            to="/sca"
                            className="text-[11px] text-accent hover:text-accent-hover transition-colors mt-1 inline-block no-underline font-medium"
                          >
                            Open SCA Wage Lookup →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Health & Welfare Rate ($/hr) <HelpTip text="The fringe benefit rate from the Wage Determination. Typically $4-5/hr for SCA contracts. Can be paid as cash-in-lieu or used toward employer health plan costs." /></label>
                    <input
                      type="number"
                      step="0.01"
                      value={profile.hwRate || ''}
                      onChange={(e) => update('hwRate', Number(e.target.value))}
                      placeholder="4.60"
                    />
                    <p className="text-[11px] text-text-disabled mt-1">
                      From WD or your employer-provided health plan cost per hour
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">FICA (%) <HelpTip text="Federal Insurance Contributions Act — Social Security (6.2%) + Medicare (1.45%) = 7.65%. This is set by federal law and cannot be changed." /></label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.ficaPct}
                        onChange={(e) => update('ficaPct', Number(e.target.value))}
                      />
                      <p className="text-[11px] text-text-disabled mt-1">7.65% is federal law</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">SUI (%) <HelpTip text="State Unemployment Insurance. Rates vary by state and employer history. New employers typically pay the standard rate. Select your state for the default." /></label>
                      <div className="flex gap-2">
                        <select
                          className="!w-24"
                          value={suiState}
                          onChange={(e) => handleSuiStateChange(e.target.value)}
                        >
                          <option value="">State</option>
                          {Object.keys(SUI_BY_STATE).sort().map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={profile.suiPct}
                          onChange={(e) => update('suiPct', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Workers Comp (%) <HelpTip text="Workers Compensation insurance rate. Varies by state and NCCI classification code. Janitorial (code 9014) typically ranges 3-7%." /></label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.wcPct}
                        onChange={(e) => update('wcPct', Number(e.target.value))}
                        placeholder="5.0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">FUTA (%) <HelpTip text="Federal Unemployment Tax Act. Standard rate is 6.0% but with state credit the effective rate is usually 0.6% on the first $7,000 per employee." /></label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.futaPct}
                        onChange={(e) => update('futaPct', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Vacation Days / Yr</label>
                      <input
                        type="number"
                        value={profile.vacationDays}
                        onChange={(e) => update('vacationDays', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Holidays / Yr</label>
                      <input
                        type="number"
                        value={profile.holidayDays}
                        onChange={(e) => update('holidayDays', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Sick Days / Yr</label>
                      <input
                        type="number"
                        value={profile.sickDays}
                        onChange={(e) => update('sickDays', Number(e.target.value))}
                      />
                    </div>
                    <div className="sm:col-span-3 bg-surface-2 border border-border-subtle p-3 rounded-lg">
                      <p className="text-[11px] text-text-tertiary">
                        <span className="font-semibold text-text-secondary">{totalPaidDays}</span> paid non-work days ={' '}
                        <span className="font-mono font-semibold text-accent">{leavePct.toFixed(2)}%</span> cost increase.
                        Worker produces for {effectiveWorkDays} of {workDaysPerYear} paid days.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <label className="block text-[11px] text-text-tertiary mb-1 font-medium">G&A / Overhead Rate (%) <HelpTip text="General & Administrative costs as a percentage of direct costs. Includes rent, utilities, management salaries, insurance, accounting, legal, etc. Typical range for janitorial contractors: 8-18%." /></label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.gaPct}
                      onChange={(e) => update('gaPct', Number(e.target.value))}
                    />
                    <p className="text-[11px] text-text-disabled mt-2">
                      Typical range: <span className="text-text-secondary font-semibold">8-18%</span> for janitorial contractors.
                    </p>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Profit / Fee (%) <HelpTip text="Your desired profit margin. Government contracts typically allow 5-12%. Commercial contracts commonly target 10-20%. Must cover business risk and return on investment." /></label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.feePct}
                      onChange={(e) => update('feePct', Number(e.target.value))}
                    />
                    <p className="text-[11px] text-text-disabled mt-2">
                      Gov: <span className="text-text-secondary font-semibold">5-12%</span> | Commercial: <span className="text-text-secondary font-semibold">10-20%</span>
                    </p>
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between mt-5 pt-4 border-t border-border-subtle">
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary hover:border-border-strong transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  {step < 5 ? (
                    <button
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors"
                      onClick={() => setStep(step + 1)}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
                        onClick={() => { setProfile(emptyProfile()); setStep(0) }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors"
                        onClick={handleSave}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saved ? 'Saved!' : editingId ? 'Update Profile' : 'Save Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right: Live breakdown panel — "Bloomberg terminal" style */}
        <motion.div variants={fadeIn}>
          <div className="stat-card sticky top-8">
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase font-semibold text-accent">Live Breakdown</p>
              </div>
              <button
                className="p-1 text-text-disabled hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                onClick={handleExportBreakdown}
                title="Export as CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Line items */}
            <div className="px-4 py-3 flex flex-col gap-1.5 text-[12px]">
              <BreakdownRow label="Base Wage" value={profile.baseWage} />
              <BreakdownRow label="Health & Welfare" value={profile.hwRate} />
              <div className="separator-gradient my-1" />
              <BreakdownRow label="Subtotal" value={basePlusHW} bold />
              <BreakdownRow label={`FICA ${profile.ficaPct}%`} value={ficaDollar} />
              <BreakdownRow label={`SUI ${profile.suiPct}%`} value={suiDollar} />
              <BreakdownRow label={`WC ${profile.wcPct}%`} value={wcDollar} />
              <BreakdownRow label={`FUTA ${profile.futaPct}%`} value={futaDollar} />
              <div className="separator-gradient my-1" />
              <BreakdownRow label="Tax Total" value={taxTotal} bold />
              <BreakdownRow label={`Leave ${leavePct.toFixed(1)}%`} value={leaveDollar} />
              <div className="separator-gradient my-1" />
              <BreakdownRow label="Direct Cost" value={subtotal} bold />
              <BreakdownRow label={`G&A ${profile.gaPct}%`} value={gaDollar} />
              <BreakdownRow label={`Fee ${profile.feePct}%`} value={feeDollar} />
            </div>

            {/* Total — prominent */}
            <div className="px-4 py-3 bg-brand-navy/20 border-t border-accent/20">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Fully Burdened</span>
                <span className="text-2xl font-bold text-accent font-mono tracking-tight">
                  ${fullyBurdened.toFixed(2)}
                </span>
              </div>
              {profile.baseWage > 0 && (
                <p className="text-[10px] text-text-disabled mt-1 text-right font-mono">
                  {((fullyBurdened / profile.baseWage - 1) * 100).toFixed(1)}% markup
                </p>
              )}
            </div>

            {/* Cost Waterfall */}
            {fullyBurdened > 0 && (
              <div className="px-4 py-3 border-t border-border-subtle">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled mb-2">Cost Waterfall</p>
                <div className="flex flex-col gap-1.5">
                  {waterfallSegments.map((seg) => {
                    const pct = fullyBurdened > 0 ? (seg.value / fullyBurdened) * 100 : 0
                    return (
                      <div key={seg.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-text-disabled w-10 text-right font-mono">{seg.label}</span>
                        <div className="flex-1 h-4 bg-surface-0 rounded overflow-hidden">
                          <motion.div
                            className={`h-full ${seg.color} rounded`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary w-14 text-right tabular-nums">
                          ${seg.value.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Saved Profiles */}
      {savedProfiles.length > 0 && (
        <motion.div variants={fadeIn} className="mt-8">
          <h2 className="text-[11px] tracking-widest uppercase font-semibold text-text-disabled mb-3">Saved Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedProfiles.map((bp) => (
              <div
                key={bp.id}
                className={`stat-card p-4 cursor-pointer group transition-all ${editingId === bp.id ? 'glow-ring' : 'hover:border-border-default'}`}
                onClick={() => loadProfile(bp)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{bp.name}</h3>
                    <div className="text-2xl font-bold text-accent font-mono mt-1 tracking-tight">
                      ${bp.computedRate != null ? bp.computedRate.toFixed(2) : '—'}
                    </div>
                    <p className="text-[11px] text-text-disabled mt-1 font-mono">
                      Base: ${bp.baseWage.toFixed(2)} | +{bp.baseWage > 0 && bp.computedRate != null ? (((bp.computedRate / bp.baseWage) - 1) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 text-text-tertiary hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); loadProfile(bp) }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        const deletedProfile = savedProfiles.find((p) => p.id === bp.id)
                        burdenProfilesStore.update((prev) => prev.filter((p) => p.id !== bp.id))
                        if (editingId === bp.id) {
                          setProfile(emptyProfile())
                          setEditingId(null)
                          setStep(0)
                        }
                        if (deletedProfile) {
                          toast('Burden profile deleted', 'info', {
                            label: 'Undo',
                            onClick: () => {
                              burdenProfilesStore.update((prev) => [...prev, deletedProfile])
                              toast('Burden profile restored', 'success')
                            },
                          })
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 text-[11px] text-text-disabled font-mono">
                  <span>H&W ${bp.hwRate.toFixed(2)}</span>
                  <span>G&A {bp.gaPct}%</span>
                  <span>Fee {bp.feePct}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? 'text-text-secondary font-medium' : 'text-text-disabled'}`}>{label}</span>
      <span className={`font-mono tabular-nums ${bold ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
        ${value.toFixed(2)}
      </span>
    </div>
  )
}
