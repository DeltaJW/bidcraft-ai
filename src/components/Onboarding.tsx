import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Building2,
  ShieldCheck,
  Trees,
  Wrench,
  User,
  CheckCircle2,
  Calculator,
  Bot,
  Database,
  SkipForward,
} from 'lucide-react'
import {
  companyStore,
  rateLibraryStore,
  onboardingDismissedStore,
} from '@/data/mockStore'
import { loadDemoData } from '@/data/demoData'
import {
  INDUSTRIES,
  getRatesForIndustry,
  type IndustryType,
} from '@/data/industryRates'
import { DEFAULT_RATES } from '@/data/defaultRates'

const STEP_COUNT = 4

const INDUSTRY_OPTIONS: {
  key: IndustryType
  icon: typeof Building2
  color: string
}[] = [
  { key: 'janitorial', icon: Sparkles, color: '#5B8DEF' },
  { key: 'security', icon: ShieldCheck, color: '#22C55E' },
  { key: 'landscaping', icon: Trees, color: '#EAB308' },
  { key: 'maintenance', icon: Wrench, color: '#A78BFA' },
]

const SET_ASIDE_OPTIONS = [
  '',
  'SDVOSB',
  'VOSB',
  'HUBZone',
  '8(a)',
  'WOSB',
  'EDWOSB',
  'Small Business',
  'Large Business',
]

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(
    null
  )
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [setAside, setSetAside] = useState('')

  function goNext() {
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1))
  }

  function dismiss() {
    onboardingDismissedStore.set(true)
  }

  function handleIndustryPick(industry: IndustryType) {
    setSelectedIndustry(industry)
    const rates = getRatesForIndustry(industry)
    // janitorial returns [] because it uses DEFAULT_RATES
    const finalRates = rates.length > 0 ? rates : [...DEFAULT_RATES]
    rateLibraryStore.set({
      id: `${industry}-library`,
      name: INDUSTRIES[industry].label,
      rates: finalRates,
    })
    goNext()
  }

  function handleCompanySave() {
    companyStore.update((prev) => ({
      ...prev,
      name: companyName.trim() || prev.name,
      contactName: contactName.trim() || prev.contactName,
      setAside: setAside || prev.setAside,
    }))
    goNext()
  }

  function handleFinish() {
    dismiss()
  }

  function handleNavigate(path: string) {
    dismiss()
    navigate(path)
  }

  function handleLoadDemo() {
    loadDemoData()
    dismiss()
  }

  // ---- Step renderers ----

  function renderWelcome() {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Welcome to BidCraft <span className="text-accent">AI</span>
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed max-w-sm mb-8">
          Build fully burdened labor rates, calculate workloading hours, and
          generate professional government-ready quotes and proposals — all in
          one place.
        </p>
        <button className="btn btn-primary px-8 py-3 text-base" onClick={goNext}>
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  function renderIndustry() {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Pick your industry
        </h2>
        <p className="text-text-tertiary text-sm mb-6">
          We'll load the right production rates for you
        </p>
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          {INDUSTRY_OPTIONS.map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => handleIndustryPick(key)}
              className="glass glass-hover p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Icon className="w-7 h-7" style={{ color }} />
              <span className="text-sm font-semibold text-text-primary">
                {INDUSTRIES[key].label}
              </span>
              <span className="text-xs text-text-tertiary">
                {INDUSTRIES[key].rateUnit}
              </span>
            </button>
          ))}
        </div>
        <button
          className="text-xs text-text-disabled hover:text-text-tertiary transition-colors flex items-center gap-1"
          onClick={goNext}
        >
          <SkipForward className="w-3 h-3" />
          Skip — I'll set this up later
        </button>
      </div>
    )
  }

  function renderCompany() {
    return (
      <div className="flex flex-col items-center w-full">
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Company basics
        </h2>
        <p className="text-text-tertiary text-sm mb-6">
          Just the essentials — you can fill in the rest later
        </p>
        <div className="w-full space-y-4 mb-6">
          <div>
            <label className="label">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <input
                type="text"
                placeholder="Patriot Facility Services LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <input
                type="text"
                placeholder="Sarah Mitchell"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">Set-Aside Status</label>
            <select
              value={setAside}
              onChange={(e) => setSetAside(e.target.value)}
            >
              <option value="">None / Not Applicable</option>
              {SET_ASIDE_OPTIONS.filter(Boolean).map((sa) => (
                <option key={sa} value={sa}>
                  {sa}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full">
          <button className="btn btn-primary flex-1" onClick={handleCompanySave}>
            Save & Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <button
          className="text-xs text-text-disabled hover:text-text-tertiary transition-colors flex items-center gap-1 mt-3"
          onClick={goNext}
        >
          <SkipForward className="w-3 h-3" />
          Skip — I'll do this later
        </button>
      </div>
    )
  }

  function renderReady() {
    const items: { label: string; done: boolean }[] = [
      {
        label: selectedIndustry
          ? `Industry rates loaded: ${INDUSTRIES[selectedIndustry].label}`
          : 'Industry rates: using defaults',
        done: !!selectedIndustry,
      },
      {
        label: companyName.trim()
          ? `Company: ${companyName.trim()}`
          : 'Company name: not set yet',
        done: !!companyName.trim(),
      },
      {
        label: setAside ? `Set-aside: ${setAside}` : 'Set-aside: none selected',
        done: !!setAside,
      },
    ]

    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-1">
          You're ready!
        </h2>
        <p className="text-text-tertiary text-sm mb-5">
          Here's what we set up. Pick a next step to dive in.
        </p>

        {/* Setup summary */}
        <div className="w-full card-inset p-4 mb-6 text-left space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${item.done ? 'text-success' : 'text-text-disabled'}`}
              />
              <span
                className={
                  item.done ? 'text-text-secondary' : 'text-text-disabled'
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="w-full space-y-2">
          <button
            className="btn btn-ghost w-full justify-start"
            onClick={() => handleNavigate('/burden')}
          >
            <Calculator className="w-4 h-4 text-accent" />
            Build a Burden Rate
          </button>
          <button
            className="btn btn-ghost w-full justify-start"
            onClick={() => handleNavigate('/ai')}
          >
            <Bot className="w-4 h-4 text-accent" />
            Try the AI Assistant
          </button>
          <button
            className="btn btn-ghost w-full justify-start"
            onClick={handleLoadDemo}
          >
            <Database className="w-4 h-4 text-accent" />
            Load Demo Data
          </button>
        </div>

        <button
          className="btn btn-primary w-full mt-4"
          onClick={handleFinish}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  const steps = [renderWelcome, renderIndustry, renderCompany, renderReady]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Card */}
      <motion.div
        className="relative glass p-8 w-full max-w-lg mx-4 shadow-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-accent'
                  : i < step
                    ? 'w-4 bg-accent/40'
                    : 'w-4 bg-border-default'
              }`}
            />
          ))}
          <span className="text-xs text-text-disabled ml-2 font-mono">
            {step + 1}/{STEP_COUNT}
          </span>
        </div>

        {/* Content with animation */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          >
            {steps[step]()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
