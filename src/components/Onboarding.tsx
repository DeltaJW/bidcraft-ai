import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  ClipboardList,
  Rocket,
  Sparkles,
  ShieldCheck,
  Trees,
  Wrench,
  SkipForward,
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

export default function Onboarding() {
  const navigate = useNavigate()
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(
    null
  )

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
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Content */}
      <motion.div
        className="relative w-full max-w-3xl mx-4"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome to BidCraft <span className="text-accent">AI</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            How do you want to get started?
          </p>
        </div>

        {/* 3 Lane Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {LANES.map((lane) => {
            const Icon = lane.icon
            const isSelected = selectedLane === lane.id
            return (
              <button
                key={lane.id}
                onClick={() => handleLanePick(lane.id)}
                className={`glass p-6 flex flex-col items-center text-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected
                    ? 'ring-2 ring-accent bg-accent/5'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-accent/20' : 'bg-accent/10'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isSelected ? 'text-accent' : 'text-text-secondary'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    {lane.title}
                  </h3>
                  <span className="text-xs text-accent font-mono">
                    {lane.time}
                  </span>
                </div>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {lane.description}
                </p>
                <span
                  className={`text-xs font-semibold mt-auto pt-2 transition-colors ${
                    isSelected ? 'text-accent' : 'text-text-disabled'
                  }`}
                >
                  {lane.cta}
                </span>
              </button>
            )
          })}
        </div>

        {/* Industry Picker */}
        <div className="glass p-6 mb-6">
          <p className="text-sm text-text-secondary text-center mb-4">
            Pick your industry first — we'll load the right production rates
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INDUSTRY_OPTIONS.map(({ key, icon: Icon, color }) => {
              const isSelected = selectedIndustry === key
              return (
                <button
                  key={key}
                  onClick={() => handleIndustryPick(key)}
                  className={`glass p-3 flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'ring-2 ring-accent bg-accent/5'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                  <span className="text-xs font-semibold text-text-primary">
                    {INDUSTRIES[key].label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Proceed Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            className="btn btn-primary px-10 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!selectedLane}
            onClick={handleProceed}
          >
            {selectedLane
              ? LANES.find((l) => l.id === selectedLane)!.cta
              : 'Pick a path above'}
          </button>
          <button
            className="text-xs text-text-disabled hover:text-text-tertiary transition-colors flex items-center gap-1"
            onClick={handleSkip}
          >
            <SkipForward className="w-3 h-3" />
            Already have data? Skip setup
          </button>
        </div>
      </motion.div>
    </div>
  )
}
