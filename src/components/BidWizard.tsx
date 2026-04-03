import { NavLink, useLocation } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
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
      isComplete: () => false, // completed when user sends to proposal
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
  const allDone = completedCount >= 4 // rates always starts complete

  return (
    <div className="glass p-4 mb-6 no-print">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Bid Progress
        </h3>
        <span className="text-xs text-text-tertiary">
          {completedCount}/{steps.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-0 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1">
        {steps.map((step, idx) => {
          const isComplete = step.isComplete()
          const isCurrent = idx === currentStepIdx
          const isNext = !isComplete && idx === steps.findIndex(s => !s.isComplete())

          return (
            <NavLink
              key={step.id}
              to={step.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all no-underline ${
                isCurrent
                  ? 'bg-accent-muted border border-accent/20'
                  : isNext
                    ? 'bg-surface-0 border border-border-subtle hover:border-accent/20'
                    : 'hover:bg-surface-0 border border-transparent'
              }`}
            >
              {/* Step indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isComplete
                  ? 'bg-success text-white'
                  : isCurrent
                    ? 'bg-accent text-white'
                    : 'bg-surface-3 text-text-disabled'
              }`}>
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  isComplete ? 'text-text-secondary' : isCurrent ? 'text-accent' : isNext ? 'text-text-primary' : 'text-text-tertiary'
                }`}>
                  {step.label}
                </div>
                <div className="text-xs text-text-disabled truncate">
                  {isComplete ? 'Done' : step.description}
                </div>
              </div>

              {/* Arrow for next step */}
              {isNext && !isCurrent && (
                <ArrowRight className="w-4 h-4 text-accent shrink-0" />
              )}
            </NavLink>
          )
        })}
      </div>

      {allDone && (
        <div className="mt-3 p-2 rounded-lg bg-success/10 text-center">
          <p className="text-xs text-success font-medium">Ready to submit your bid!</p>
        </div>
      )}
    </div>
  )
}
