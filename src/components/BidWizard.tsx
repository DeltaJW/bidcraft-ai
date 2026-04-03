import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Check, ArrowRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { companyStore, burdenProfilesStore, rateLibraryStore, quotesStore, useStore } from '@/data/mockStore'

interface WizardStep {
  id: string
  label: string
  path: string
  isComplete: () => boolean
  description: string
}

export default function BidWizard() {
  const company = useStore(companyStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const rateLibrary = useStore(rateLibraryStore)
  const quotes = useStore(quotesStore)
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  const steps: WizardStep[] = [
    {
      id: 'company',
      label: 'Company Setup',
      path: '/company',
      isComplete: () => !!company.name,
      description: 'Name, logo, CAGE code',
    },
    {
      id: 'rates',
      label: 'Rate Library',
      path: '/rates',
      isComplete: () => rateLibrary.rates.length > 0,
      description: 'Production rates loaded',
    },
    {
      id: 'burden',
      label: 'Burden Rates',
      path: '/burden',
      isComplete: () => burdenProfiles.length > 0,
      description: 'Build a burdened labor rate',
    },
    {
      id: 'workload',
      label: 'Workloading',
      path: '/workload',
      isComplete: () => false,
      description: 'Zones, tasks, frequencies',
    },
    {
      id: 'proposal',
      label: 'Generate Proposal',
      path: '/proposal',
      isComplete: () => quotes.some(q => q.quoteType === 'proposal'),
      description: 'Create & save your bid',
    },
  ]

  const completedCount = steps.filter(s => s.isComplete()).length
  const currentStepIdx = steps.findIndex(s => s.path === location.pathname)
  const nextStep = steps.find(s => !s.isComplete())
  const allDone = completedCount >= 4

  return (
    <div className="stat-card mb-6 no-print">
      {/* Collapsed header — always visible */}
      <button
        className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer bg-transparent border-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-semibold text-text-disabled uppercase tracking-widest">
            Bid Progress
          </h3>
          {!expanded && nextStep && (
            <span className="text-[10px] text-text-tertiary">
              Next: <span className="text-text-secondary font-medium">{nextStep.label}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-accent font-semibold">
            {completedCount}/{steps.length}
          </span>
          <ChevronDown className={`w-3 h-3 text-text-disabled transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Progress bar — always visible */}
      <div className="px-4 pb-2">
        <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Expandable steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 flex flex-col gap-0.5 border-t border-border-subtle pt-2">
              {steps.map((step, idx) => {
                const isComplete = step.isComplete()
                const isCurrent = idx === currentStepIdx
                const isNext = !isComplete && idx === steps.findIndex(s => !s.isComplete())

                return (
                  <NavLink
                    key={step.id}
                    to={step.path}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all no-underline ${
                      isCurrent
                        ? 'bg-accent-muted'
                        : isNext
                          ? 'bg-surface-0 border border-border-subtle'
                          : 'hover:bg-surface-0 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isComplete
                        ? 'bg-success text-white'
                        : isCurrent
                          ? 'bg-accent text-white'
                          : 'bg-surface-3 text-text-disabled'
                    }`}>
                      {isComplete ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-medium ${
                        isComplete ? 'text-text-secondary' : isCurrent ? 'text-accent' : isNext ? 'text-text-primary' : 'text-text-tertiary'
                      }`}>
                        {step.label}
                      </div>
                      <div className="text-[10px] text-text-disabled truncate">
                        {isComplete ? 'Done' : step.description}
                      </div>
                    </div>

                    {isNext && !isCurrent && (
                      <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                  </NavLink>
                )
              })}
            </div>

            {allDone && (
              <div className="mx-3 mb-3 p-2 rounded-md bg-success/10 text-center">
                <p className="text-[10px] text-success font-semibold tracking-wide uppercase">Ready to submit your bid</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
