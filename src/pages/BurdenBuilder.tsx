import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, ChevronRight, ChevronLeft, Save, RotateCcw, Trash2 } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { burdenProfilesStore, useStore } from '@/data/mockStore'
import type { BurdenProfile } from '@/types'

const STEPS = [
  { title: 'Base Wage', desc: 'Starting hourly rate from WD or manual entry' },
  { title: 'Fringe Benefits', desc: 'Health & Welfare rate' },
  { title: 'Payroll Taxes', desc: 'FICA, SUI, Workers Comp, FUTA' },
  { title: 'Leave / PTO', desc: 'Vacation, holidays, sick days' },
  { title: 'Overhead / G&A', desc: 'General & Administrative costs' },
  { title: 'Profit / Fee', desc: 'Your desired profit margin' },
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

export default function BurdenBuilder() {
  const savedProfiles = useStore(burdenProfilesStore)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<BurdenProfile>(emptyProfile())
  const [saved, setSaved] = useState(false)
  const [suiState, setSuiState] = useState('')

  function update<K extends keyof BurdenProfile>(field: K, value: BurdenProfile[K]) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  // Calculations
  const basePlusHW = profile.baseWage + profile.hwRate
  const ficaDollar = profile.baseWage * (profile.ficaPct / 100)
  const suiDollar = profile.baseWage * (profile.suiPct / 100)
  const wcDollar = profile.baseWage * (profile.wcPct / 100)
  const futaDollar = profile.baseWage * (profile.futaPct / 100)
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

  function handleSave() {
    const completed: BurdenProfile = {
      ...profile,
      name: profile.name || 'Unnamed Profile',
      computedRate: fullyBurdened,
    }
    burdenProfilesStore.update((profiles) => [...profiles, completed])
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setProfile(emptyProfile())
      setStep(0)
    }, 2000)
  }

  function handleSuiStateChange(st: string) {
    setSuiState(st)
    if (SUI_BY_STATE[st]) {
      update('suiPct', SUI_BY_STATE[st])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-white">Burden Rate Builder</h1>
      </div>

      {/* Profile name */}
      <div className="mb-6">
        <input
          className="!max-w-sm"
          placeholder="Profile name (e.g. GSA Valley Region, Commercial Default)"
          value={profile.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Steps */}
        <div className="col-span-2">
          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  i === step
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : i < step
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-transparent border-navy-700/30 text-navy-500'
                }`}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <GlassCard title={STEPS[step].title} subtitle={STEPS[step].desc}>
                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Base Hourly Wage ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.baseWage || ''}
                        onChange={(e) => update('baseWage', Number(e.target.value))}
                        placeholder="17.75"
                      />
                      <p className="text-xs text-navy-500 mt-1">
                        Enter from SCA Wage Determination or your prevailing wage
                      </p>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Health & Welfare Rate ($/hr)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.hwRate || ''}
                        onChange={(e) => update('hwRate', Number(e.target.value))}
                        placeholder="4.60"
                      />
                      <p className="text-xs text-navy-500 mt-1">
                        From WD or your employer-provided health plan cost per hour
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">FICA (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.ficaPct}
                        onChange={(e) => update('ficaPct', Number(e.target.value))}
                      />
                      <p className="text-xs text-navy-500 mt-1">7.65% is federal law (Social Security 6.2% + Medicare 1.45%)</p>
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">State Unemployment — SUI (%)</label>
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
                      <label className="block text-xs text-navy-400 mb-1">Workers Comp (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.wcPct}
                        onChange={(e) => update('wcPct', Number(e.target.value))}
                        placeholder="5.0"
                      />
                      <p className="text-xs text-navy-500 mt-1">Varies by state and classification code</p>
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">FUTA (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.futaPct}
                        onChange={(e) => update('futaPct', Number(e.target.value))}
                      />
                      <p className="text-xs text-navy-500 mt-1">0.6% standard with state credit reduction</p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Vacation Days / Year</label>
                      <input
                        type="number"
                        value={profile.vacationDays}
                        onChange={(e) => update('vacationDays', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Holidays / Year</label>
                      <input
                        type="number"
                        value={profile.holidayDays}
                        onChange={(e) => update('holidayDays', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Sick Days / Year</label>
                      <input
                        type="number"
                        value={profile.sickDays}
                        onChange={(e) => update('sickDays', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3 glass !bg-navy-800/30 p-3 rounded-lg">
                      <p className="text-xs text-navy-400">
                        <strong className="text-navy-300">Calculated impact:</strong>{' '}
                        {totalPaidDays} paid non-work days = {leavePct.toFixed(2)}% cost increase.
                        Worker produces for {effectiveWorkDays} of {workDaysPerYear} paid days.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <label className="block text-xs text-navy-400 mb-1">G&A / Overhead Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.gaPct}
                      onChange={(e) => update('gaPct', Number(e.target.value))}
                    />
                    <p className="text-xs text-navy-500 mt-2">
                      This is the cost of running your company divided by total direct costs.
                      Typical range: <strong className="text-navy-300">8-18%</strong> for janitorial contractors.
                    </p>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <label className="block text-xs text-navy-400 mb-1">Profit / Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.feePct}
                      onChange={(e) => update('feePct', Number(e.target.value))}
                    />
                    <p className="text-xs text-navy-500 mt-2">
                      Typical range: <strong className="text-navy-300">5-12%</strong> for government,{' '}
                      <strong className="text-navy-300">10-20%</strong> for commercial.
                    </p>
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between mt-6 pt-4 border-t border-navy-700/30">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  {step < 5 ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setStep(step + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" onClick={() => { setProfile(emptyProfile()); setStep(0) }}>
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                      <button className="btn btn-primary" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Live breakdown */}
        <div>
          <GlassCard title="Live Breakdown" className="sticky top-8">
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Base Wage" value={profile.baseWage} />
              <Row label="Health & Welfare" value={profile.hwRate} />
              <Divider />
              <Row label="Subtotal" value={basePlusHW} bold />
              <Row label={`FICA (${profile.ficaPct}%)`} value={ficaDollar} />
              <Row label={`SUI (${profile.suiPct}%)`} value={suiDollar} />
              <Row label={`Workers Comp (${profile.wcPct}%)`} value={wcDollar} />
              <Row label={`FUTA (${profile.futaPct}%)`} value={futaDollar} />
              <Divider />
              <Row label="Tax Total" value={taxTotal} bold />
              <Row label={`Leave (${leavePct.toFixed(1)}%)`} value={leaveDollar} />
              <Divider />
              <Row label="Direct Cost" value={subtotal} bold />
              <Row label={`G&A (${profile.gaPct}%)`} value={gaDollar} />
              <Row label={`Fee (${profile.feePct}%)`} value={feeDollar} />
              <Divider />
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-white">Fully Burdened</span>
                <span className="text-xl font-bold text-accent font-mono">
                  ${fullyBurdened.toFixed(2)}
                </span>
              </div>
              {profile.baseWage > 0 && (
                <p className="text-xs text-navy-500 mt-2">
                  Markup: {((fullyBurdened / profile.baseWage - 1) * 100).toFixed(1)}% over base wage
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Saved Profiles */}
      {savedProfiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Saved Burden Profiles</h2>
          <div className="grid grid-cols-3 gap-3">
            {savedProfiles.map((bp) => (
              <GlassCard key={bp.id} className="glass-hover relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{bp.name}</h3>
                    <div className="text-2xl font-bold text-accent font-mono mt-1">
                      ${bp.computedRate?.toFixed(2)}
                    </div>
                    <p className="text-xs text-navy-500 mt-1">
                      Base: ${bp.baseWage.toFixed(2)} | Markup: {bp.baseWage > 0 ? ((bp.computedRate! / bp.baseWage - 1) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <button
                    className="p-1.5 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={() => burdenProfilesStore.update((prev) => prev.filter((p) => p.id !== bp.id))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3 mt-3 text-xs text-navy-500">
                  <span>H&W: ${bp.hwRate.toFixed(2)}</span>
                  <span>G&A: {bp.gaPct}%</span>
                  <span>Fee: {bp.feePct}%</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'text-navy-200 font-medium' : 'text-navy-400'}>{label}</span>
      <span className={`font-mono ${bold ? 'text-white font-medium' : 'text-navy-300'}`}>
        ${value.toFixed(2)}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-navy-700/30 my-1" />
}
