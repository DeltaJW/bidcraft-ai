import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { PREBUILT_TEMPLATES, type PrebuiltTemplate } from '@/data/buildingTemplates'
import { templatesStore, workloadDraftStore } from '@/data/mockStore'
import { FREQUENCY_ANNUAL_MULTIPLIER } from '@/types'

export default function QuickEstimate() {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filtered = selectedFilter === 'all'
    ? PREBUILT_TEMPLATES
    : PREBUILT_TEMPLATES.filter((t) => t.industry === selectedFilter)

  function loadTemplate(template: PrebuiltTemplate) {
    // Calculate annual hours for each task
    const zones = template.zones.map((z) => ({
      name: z.name,
      tasks: z.tasks.map((t) => {
        const hoursPerOccurrence = t.sqftPerHour > 0 && t.sqft > 0
          ? t.sqft / t.sqftPerHour
          : 0
        const annualHours = hoursPerOccurrence * FREQUENCY_ANNUAL_MULTIPLIER[t.frequency]
        return {
          taskName: t.taskName,
          equipment: t.equipment,
          sqft: t.sqft,
          sqftPerHour: t.sqftPerHour,
          frequency: t.frequency,
          annualHours,
        }
      }),
    }))

    const totalAnnualHours = zones.reduce(
      (sum, z) => sum + z.tasks.reduce((s, t) => s + t.annualHours, 0),
      0
    )

    workloadDraftStore.set({
      buildingName: template.name,
      zones,
      totalAnnualHours,
      burdenProfileId: '',
    })

    toast(`Loaded "${template.name}" — ${totalAnnualHours.toFixed(0)} hrs/yr`)
    navigate('/proposal')
  }

  function saveAsUserTemplate(template: PrebuiltTemplate) {
    templatesStore.update((prev) => [
      ...prev,
      {
        id: `tmpl-${Date.now()}`,
        name: template.name,
        description: template.description,
        zones: template.zones.map((z) => ({
          ...z,
          id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tasks: z.tasks.map((t) => ({
            ...t,
            id: `zt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          })),
        })),
        createdAt: new Date().toISOString(),
      },
    ])
    toast(`Saved "${template.name}" to your templates`)
  }

  const industries = [
    { key: 'all', label: 'All' },
    { key: 'janitorial', label: 'Janitorial' },
    { key: 'security', label: 'Security' },
    { key: 'landscaping', label: 'Landscaping' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="mb-2">
        <p className="section-label">Quick Start</p>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Quick Estimate</h1>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Pick a pre-built building template, load it into a proposal, and adjust to fit your scope.
        Each template includes zones, tasks, production rates, and frequencies based on industry standards.
      </p>

      {/* Industry filter */}
      <div className="flex gap-2 mb-6">
        {industries.map((ind) => (
          <button
            key={ind.key}
            onClick={() => setSelectedFilter(ind.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              selectedFilter === ind.key
                ? 'bg-accent-muted border-accent/30 text-accent'
                : 'bg-transparent border-border-default text-text-secondary hover:bg-surface-3 hover:text-text-primary'
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => {
          const totalHours = template.zones.reduce(
            (sum, z) =>
              sum +
              z.tasks.reduce((s, t) => {
                const hrs = t.sqftPerHour > 0 && t.sqft > 0 ? t.sqft / t.sqftPerHour : 0
                return s + hrs * FREQUENCY_ANNUAL_MULTIPLIER[t.frequency]
              }, 0),
            0
          )

          return (
            <GlassCard key={template.id} className="glass-hover flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
                  <span className="badge badge-navy text-xs mt-1">{template.industry}</span>
                </div>
              </div>

              <p className="text-xs text-text-tertiary mb-3 flex-1">{template.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="card-inset p-2 text-center">
                  <div className="text-sm font-bold font-mono text-text-primary">
                    {template.sqft >= 1000 ? `${(template.sqft / 1000).toFixed(0)}K` : template.sqft}
                  </div>
                  <div className="text-xs text-text-disabled">sq ft</div>
                </div>
                <div className="card-inset p-2 text-center">
                  <div className="text-sm font-bold font-mono text-text-primary">{template.zones.length}</div>
                  <div className="text-xs text-text-disabled">zones</div>
                </div>
                <div className="card-inset p-2 text-center">
                  <div className="text-sm font-bold font-mono text-accent">
                    {totalHours >= 1000 ? `${(totalHours / 1000).toFixed(1)}K` : totalHours.toFixed(0)}
                  </div>
                  <div className="text-xs text-text-disabled">hrs/yr</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1 justify-center !text-xs"
                  onClick={() => loadTemplate(template)}
                >
                  <ArrowRight className="w-3 h-3" />
                  Use This
                </button>
                <button
                  className="btn btn-ghost !text-xs"
                  onClick={() => saveAsUserTemplate(template)}
                >
                  Save
                </button>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </motion.div>
  )
}
