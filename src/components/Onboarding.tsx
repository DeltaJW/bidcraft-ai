import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  ClipboardList,
  Rocket,
  ShieldCheck,
  Trees,
  Wrench,
  SkipForward,
  Sparkles,
} from 'lucide-react'
import {
  rateLibraryStore,
  onboardingDismissedStore,
  userModeStore,
} from '@/data/mockStore'
import {
  INDUSTRIES,
  getRatesForIndustry,
  type IndustryType,
} from '@/data/industryRates'
import { DEFAULT_RATES } from '@/data/defaultRates'

const INDUSTRY_OPTIONS: {
  key: IndustryType
  icon: typeof Sparkles
  color: string
}[] = [
  { key: 'janitorial', icon: Sparkles, color: '#5B8DEF' },
  { key: 'security', icon: ShieldCheck, color: '#22C55E' },
  { key: 'landscaping', icon: Trees, color: '#EAB308' },
  { key: 'maintenance', icon: Wrench, color: '#A78BFA' },
]

type LaneId = 'quick' | 'guided' | 'expert'

const LANES: {
  id: LaneId
  icon: typeof Zap
  title: string
  time: string
  description: string
  cta: string
}[] = [
  {
    id: 'quick',
    icon: Zap,
    title: 'Quick Estimate',
    time: '2 minutes',
    description: "I just want to get a rough number fast",
    cta: 'Jump In',
  },
  {
    id: 'guided',
    icon: ClipboardList,
    title: 'Build a Full Bid',
    time: 'Guided',
    description: 'Walk me through pricing a contract step by step',
    cta: 'Start Wizard',
  },
  {
    id: 'expert',
    icon: Rocket,
    title: "I Know What I'm Doing",
    time: 'Expert',
    description: "Give me all the tools, I'll figure it out",
    cta: 'Go to Dashboard',
  },
]

const overlayAnim = { hidden: { opacity: 0 }, show: { opacity: 1 } }
const panelAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
}
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null)

  function loadIndustryRates(industry: IndustryType) {
    const rates = getRatesForIndustry(industry)
    const finalRates = rates.length > 0 ? rates : [...DEFAULT_RATES]
    rateLibraryStore.set({
      id: `${industry}-library`,
      name: INDUSTRIES[industry].label,
      rates: finalRates,
    })
  }

  function handleIndustryPick(industry: IndustryType) {
    setSelectedIndustry(industry)
    loadIndustryRates(industry)
  }

  function handleLanePick(lane: LaneId) {
    setSelectedLane(lane)
  }

  function handleProceed() {
    if (!selectedLane) return
    onboardingDismissedStore.set(true)
    switch (selectedLane) {
      case 'quick':
        navigate('/estimate')
        break
      case 'guided':
        userModeStore.set('guided')
        navigate('/company')
        break
      case 'expert':
        userModeStore.set('expert')
        navigate('/')
        break
    }
  }

  function handleSkip() {
    onboardingDismissedStore.set(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with dot grid */}
      <motion.div
        className="absolute inset-0 bg-surface-0/90 backdrop-blur-sm dot-grid"
        variants={overlayAnim}
        initial="hidden"
        animate="show"
      />

      {/* Content */}
      <motion.div
        className="relative w-full max-w-3xl mx-4"
        variants={panelAnim}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Header */}
          <motion.div variants={itemAnim} className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-brand-navy flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-sm font-bold font-mono">BC</span>
            </div>
            <p className="section-label mb-2">Let's Win</p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Welcome to BidCraft <span className="text-accent font-normal">AI</span>
            </h1>
            <p className="text-sm text-text-tertiary mt-1">
              How do you want to start winning?
            </p>
          </motion.div>

          {/* 3 Lane Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {LANES.map((lane) => {
              const Icon = lane.icon
              const isSelected = selectedLane === lane.id
              return (
                <motion.button
                  key={lane.id}
                  variants={itemAnim}
                  onClick={() => handleLanePick(lane.id)}
                  className={`stat-card p-5 flex flex-col items-center text-center gap-2.5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'glow-ring'
                      : 'hover:border-border-default'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-accent/20' : 'bg-surface-2'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-accent' : 'text-text-tertiary'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {lane.title}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-accent tracking-wide">
                      {lane.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-disabled leading-relaxed">
                    {lane.description}
                  </p>
                  <span
                    className={`text-[11px] font-semibold mt-auto transition-colors ${
                      isSelected ? 'text-accent' : 'text-text-disabled'
                    }`}
                  >
                    {lane.cta}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Industry Picker */}
          <motion.div variants={itemAnim} className="stat-card p-5 mb-6">
            <p className="text-[11px] text-text-disabled text-center mb-3 tracking-wide">
              Pick your industry — we'll load the right production rates
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INDUSTRY_OPTIONS.map(({ key, icon: Icon, color }) => {
                const isSelected = selectedIndustry === key
                return (
                  <button
                    key={key}
                    onClick={() => handleIndustryPick(key)}
                    className={`rounded-lg p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all border bg-transparent ${
                      isSelected
                        ? 'border-accent bg-accent/5'
                        : 'border-border-subtle hover:border-border-default'
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                    <span className="text-[11px] font-semibold text-text-primary">
                      {INDUSTRIES[key].label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Proceed */}
          <motion.div variants={itemAnim} className="flex flex-col items-center gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-md bg-brand-navy text-white text-sm font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={!selectedLane}
              onClick={handleProceed}
            >
              {selectedLane
                ? LANES.find((l) => l.id === selectedLane)!.cta
                : 'Pick a path above'}
            </button>
            <button
              className="text-[11px] text-text-disabled hover:text-text-tertiary transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
              onClick={handleSkip}
            >
              <SkipForward className="w-3 h-3" />
              Already have data? Skip setup
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
