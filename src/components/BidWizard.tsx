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
  const allDone = completedCount >= 4

  return (
    <div className="stat-card mb-6 no-print">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-text-disabled uppercase tracking-widest">
          Bid Progress
        </h3>
        <span className="text-[10px] font-mono text-accent font-semibold">
          {completedCount}/{steps.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-3 py-2 flex flex-col gap-0.5">
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
    </div>
  )
}
