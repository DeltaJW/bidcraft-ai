import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PenTool,
  FileDown,
  RefreshCw,
  Loader2,
  KeyRound,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { sendMessage, type ChatMessage } from '@/services/ai'
import {
  quotesStore,
  companyStore,
  burdenProfilesStore,
  laborCategoriesStore,
  aiSettingsStore,
  useStore,
} from '@/data/mockStore'
import type { Quote } from '@/types'

// ---- Section definitions ----

interface NarrativeSection {
  id: string
  title: string
  description: string
  promptTemplate: (ctx: PromptContext) => string
}

interface PromptContext {
  companyName: string
  setAside: string
  cageCode: string
  uei: string
  address: string
  quoteTitle: string
  contractRef: string
  location: string
  scopeDescription: string
  tasks: string
  totalHours: number
  totalLabor: number
  totalMaterials: number
  grandTotal: number
  materials: string
  burdenRate: string
  laborCategories: string
}

type SectionStatus = 'idle' | 'generating' | 'complete' | 'error'

const SECTIONS: NarrativeSection[] = [
  {
    id: 'technical',
    title: 'Technical Approach',
    description: 'How you will perform the work: methods, equipment, processes, and production rates.',
    promptTemplate: (ctx) => `Write a Technical Approach section for a government janitorial/facility services proposal.

COMPANY:
- Name: ${ctx.companyName}
- Set-Aside Status: ${ctx.setAside || 'None'}
- CAGE Code: ${ctx.cageCode || 'N/A'}
- UEI: ${ctx.uei || 'N/A'}
- Location: ${ctx.address || 'N/A'}

CONTRACT/QUOTE:
- Title: ${ctx.quoteTitle}
- Contract Reference: ${ctx.contractRef || 'N/A'}
- Location: ${ctx.location || 'N/A'}
- Scope: ${ctx.scopeDescription || 'General facility services'}

WORKLOAD DETAILS:
${ctx.tasks}

- Total Annual Hours: ${ctx.totalHours.toFixed(1)}
- Total Labor Cost: $${ctx.totalLabor.toLocaleString()}
- Total Materials: $${ctx.totalMaterials.toLocaleString()}
- Grand Total: $${ctx.grandTotal.toLocaleString()}

MATERIALS:
${ctx.materials || 'None specified'}

BURDEN/RATE INFO:
${ctx.burdenRate}

LABOR CATEGORIES:
${ctx.laborCategories || 'Not defined'}

Write a professional Technical Approach (1-2 pages) covering:
1. Understanding of the requirement
2. Specific cleaning methods and equipment for each task area
3. Production rates and how staffing levels were determined
4. Green cleaning and sustainability practices
5. Equipment and supply management

Use professional government proposal language. Be specific to the actual tasks and square footage in the quote. Do not use placeholder text.`,
  },
  {
    id: 'management',
    title: 'Management Plan',
    description: 'Staffing structure, supervision, scheduling, and communication protocols.',
    promptTemplate: (ctx) => `Write a Management Plan section for a government janitorial/facility services proposal.

COMPANY:
- Name: ${ctx.companyName}
- Set-Aside Status: ${ctx.setAside || 'None'}
- CAGE Code: ${ctx.cageCode || 'N/A'}

CONTRACT/QUOTE:
- Title: ${ctx.quoteTitle}
- Contract Reference: ${ctx.contractRef || 'N/A'}
- Location: ${ctx.location || 'N/A'}
- Scope: ${ctx.scopeDescription || 'General facility services'}

WORKLOAD DETAILS:
${ctx.tasks}

- Total Annual Hours: ${ctx.totalHours.toFixed(1)}
- Grand Total: $${ctx.grandTotal.toLocaleString()}

LABOR CATEGORIES:
${ctx.laborCategories || 'Not defined'}

Write a professional Management Plan (1-2 pages) covering:
1. Organizational structure and chain of command
2. Project Manager and Site Supervisor roles/qualifications
3. Staffing plan (number of workers, shifts, schedules based on actual hours)
4. Communication plan with the Contracting Officer and COR
5. Employee recruitment, screening, and retention
6. Training program (initial and ongoing)
7. Subcontractor management (if applicable)

Use professional government proposal language. Base staffing numbers on the actual total hours in the quote. Do not use placeholder text.`,
  },
  {
    id: 'quality',
    title: 'Quality Control Plan',
    description: 'Inspection procedures, corrective actions, performance standards, and reporting.',
    promptTemplate: (ctx) => `Write a Quality Control Plan section for a government janitorial/facility services proposal.

COMPANY:
- Name: ${ctx.companyName}
- Set-Aside Status: ${ctx.setAside || 'None'}
- CAGE Code: ${ctx.cageCode || 'N/A'}

CONTRACT/QUOTE:
- Title: ${ctx.quoteTitle}
- Contract Reference: ${ctx.contractRef || 'N/A'}
- Location: ${ctx.location || 'N/A'}

WORKLOAD DETAILS:
${ctx.tasks}

- Total Annual Hours: ${ctx.totalHours.toFixed(1)}

Write a professional Quality Control Plan (1-2 pages) covering:
1. QC organization and responsible personnel
2. Inspection methodology (types: daily, weekly, monthly)
3. Inspection checklists tied to each task area from the scope
4. Rating scale and acceptable performance thresholds
5. Deficiency identification and corrective action procedures
6. Documentation and reporting (inspection logs, trend analysis)
7. Customer complaint resolution process
8. Continuous improvement program

Use professional government proposal language. Reference the specific task areas and zones from the quote. Do not use placeholder text.`,
  },
  {
    id: 'transition',
    title: 'Transition Plan',
    description: 'How you will take over from the incumbent contractor within the phase-in period.',
    promptTemplate: (ctx) => `Write a Transition Plan section for a government janitorial/facility services proposal.

COMPANY:
- Name: ${ctx.companyName}
- Set-Aside Status: ${ctx.setAside || 'None'}
- CAGE Code: ${ctx.cageCode || 'N/A'}

CONTRACT/QUOTE:
- Title: ${ctx.quoteTitle}
- Contract Reference: ${ctx.contractRef || 'N/A'}
- Location: ${ctx.location || 'N/A'}
- Scope: ${ctx.scopeDescription || 'General facility services'}

WORKLOAD DETAILS:
${ctx.tasks}

- Total Annual Hours: ${ctx.totalHours.toFixed(1)}
- Grand Total: $${ctx.grandTotal.toLocaleString()}

LABOR CATEGORIES:
${ctx.laborCategories || 'Not defined'}

Write a professional Transition Plan (1-1.5 pages) covering:
1. Phase-in timeline (typically 30-day transition) with milestones
2. Week-by-week transition activities
3. Personnel recruitment and onboarding during transition
4. Equipment procurement and staging
5. Site familiarization and walk-throughs
6. Coordination with incumbent contractor and government POC
7. Supply chain setup
8. Badge/access credential processing
9. Full operational capability (FOC) milestone

Use professional government proposal language. Be specific to the scope and staffing levels from the quote. Do not use placeholder text.`,
  },
]

// ---- Helpers ----

function buildPromptContext(quote: Quote): PromptContext {
  const company = companyStore.get()
  const burdenProfiles = burdenProfilesStore.get()
  const laborCats = laborCategoriesStore.get()

  const tasksText = quote.tasks
    .map(
      (t) =>
        `- ${t.taskName}: ${t.sqft.toLocaleString()} sqft @ ${t.sqftPerHour} sqft/hr = ${t.hours.toFixed(1)} hrs ($${t.laborCost.toLocaleString()})`
    )
    .join('\n')

  const materialsText =
    quote.materials.length > 0
      ? quote.materials
          .map(
            (m) =>
              `- ${m.name}: ${m.quantity} ${m.unit} @ $${m.unitCost.toFixed(2)} = $${(m.quantity * m.unitCost).toFixed(2)}`
          )
          .join('\n')
      : 'None specified'

  const profile = burdenProfiles.find((p) => p.id === quote.burdenProfileId)
  const burdenText = profile
    ? `Profile "${profile.name}": $${profile.baseWage.toFixed(2)} base wage -> $${profile.computedRate?.toFixed(2)}/hr burdened (G&A: ${profile.gaPct}%, Fee: ${profile.feePct}%)`
    : 'No burden profile linked'

  const laborText =
    laborCats.length > 0
      ? laborCats.map((lc) => `- ${lc.name}: ${lc.headcount} workers`).join('\n')
      : 'Not defined'

  return {
    companyName: company.name || 'Company Name',
    setAside: company.setAside,
    cageCode: company.cageCode,
    uei: company.uei,
    address: company.address,
    quoteTitle: quote.title,
    contractRef: quote.contractRef,
    location: quote.location,
    scopeDescription: quote.scopeDescription,
    tasks: tasksText || 'No tasks defined',
    totalHours: quote.totalHours,
    totalLabor: quote.totalLabor,
    totalMaterials: quote.totalMaterials,
    grandTotal: quote.grandTotal,
    materials: materialsText,
    burdenRate: burdenText,
    laborCategories: laborText,
  }
}

// ---- Component ----

export default function NarrativeWriter() {
  const quotes = useStore(quotesStore)
  const aiSettings = useStore(aiSettingsStore)
  const company = useStore(companyStore)

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [activeSectionId, setActiveSectionId] = useState<string>('technical')
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({
    technical: 'idle',
    management: 'idle',
    quality: 'idle',
    transition: 'idle',
  })
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({
    technical: '',
    management: '',
    quality: '',
    transition: '',
  })

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId) || null
  const activeSection = SECTIONS.find((s) => s.id === activeSectionId)!
  const hasKey = !!aiSettings.apiKey

  const handleGenerate = useCallback(
    async (sectionId: string) => {
      if (!selectedQuote) {
        toast('Select a quote first', 'error')
        return
      }
      if (!aiSettings.apiKey) {
        toast('Add your Claude API key in Settings first', 'error')
        return
      }

      const section = SECTIONS.find((s) => s.id === sectionId)!
      const ctx = buildPromptContext(selectedQuote)
      const prompt = section.promptTemplate(ctx)

      setSectionStatuses((prev) => ({ ...prev, [sectionId]: 'generating' }))
      setSectionContent((prev) => ({ ...prev, [sectionId]: '' }))
      setActiveSectionId(sectionId)

      const messages: ChatMessage[] = [{ role: 'user', content: prompt }]

      try {
        const result = await sendMessage(messages, (partial) => {
          setSectionContent((prev) => ({ ...prev, [sectionId]: partial }))
        })
        setSectionContent((prev) => ({ ...prev, [sectionId]: result }))
        setSectionStatuses((prev) => ({ ...prev, [sectionId]: 'complete' }))
        toast(`${section.title} generated`, 'success')
      } catch (err) {
        setSectionStatuses((prev) => ({ ...prev, [sectionId]: 'error' }))
        toast(err instanceof Error ? err.message : 'Generation failed', 'error')
      }
    },
    [selectedQuote, aiSettings.apiKey]
  )

  function handleExportAll() {
    const completeSections = SECTIONS.filter((s) => sectionContent[s.id]?.trim())
    if (completeSections.length === 0) {
      toast('Generate at least one section first', 'error')
      return
    }

    const quoteLabel = selectedQuote?.title || 'Proposal'
    const companyLabel = company.name || 'Company'

    let doc = `PROPOSAL NARRATIVE\n`
    doc += `${'='.repeat(60)}\n`
    doc += `Company: ${companyLabel}\n`
    doc += `Quote: ${quoteLabel}\n`
    if (selectedQuote?.contractRef) doc += `Contract Ref: ${selectedQuote.contractRef}\n`
    if (selectedQuote?.location) doc += `Location: ${selectedQuote.location}\n`
    doc += `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`
    doc += `${'='.repeat(60)}\n\n`

    for (const section of completeSections) {
      doc += `\n${'─'.repeat(60)}\n`
      doc += `${section.title.toUpperCase()}\n`
      doc += `${'─'.repeat(60)}\n\n`
      doc += sectionContent[section.id]
      doc += '\n\n'
    }

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${quoteLabel.replace(/[^a-zA-Z0-9]/g, '_')}_Narrative.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast('Narrative exported', 'success')
  }

  const statusIcon = (status: SectionStatus) => {
    switch (status) {
      case 'idle':
        return <Circle className="w-4 h-4 text-text-disabled" />
      case 'generating':
        return <Loader2 className="w-4 h-4 text-accent animate-spin" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
    }
  }

  const statusLabel = (status: SectionStatus) => {
    switch (status) {
      case 'idle':
        return 'Not started'
      case 'generating':
        return 'Generating...'
      case 'complete':
        return 'Complete'
      case 'error':
        return 'Error'
    }
  }

  const completedCount = Object.values(sectionStatuses).filter((s) => s === 'complete').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">AI Tools</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Narrative Writer</h1>
            <span className="badge badge-blue">AI-Powered</span>
          </div>
        </div>
        {completedCount > 0 && (
          <button className="btn btn-primary" onClick={handleExportAll}>
            <FileDown className="w-4 h-4" />
            Export All ({completedCount}/{SECTIONS.length})
          </button>
        )}
      </div>

      {!hasKey ? (
        <GlassCard className="text-center py-12">
          <KeyRound className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h2>
          <p className="text-text-tertiary text-sm mb-4 max-w-md mx-auto">
            The Narrative Writer uses the Claude API to generate proposal sections. Your key is
            stored locally and never sent anywhere except Anthropic.
          </p>
          <Link to="/settings" className="btn btn-primary no-underline">
            <KeyRound className="w-4 h-4" />
            Configure in Settings
          </Link>
        </GlassCard>
      ) : (
        <>
          {/* Quote selector + company summary */}
          <GlassCard>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Select Quote
                </label>
                <select
                  className="w-full"
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                >
                  <option value="">-- Choose a saved quote --</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} - ${q.grandTotal.toLocaleString()} ({q.status})
                    </option>
                  ))}
                </select>
              </div>
              {company.name && (
                <div className="flex-1 text-sm text-text-secondary space-y-0.5">
                  <p className="font-medium text-text-primary">{company.name}</p>
                  {company.setAside && <p>Set-Aside: {company.setAside}</p>}
                  {company.cageCode && <p>CAGE: {company.cageCode}</p>}
                  {company.address && <p>{company.address}</p>}
                </div>
              )}
              {selectedQuote && (
                <div className="flex-1 text-sm text-text-secondary space-y-0.5">
                  <p className="font-medium text-text-primary">{selectedQuote.title}</p>
                  <p>
                    {selectedQuote.totalHours.toFixed(0)} hours | $
                    {selectedQuote.grandTotal.toLocaleString()}
                  </p>
                  <p>
                    {selectedQuote.tasks.length} tasks | {selectedQuote.materials.length} materials
                  </p>
                  {selectedQuote.location && <p>{selectedQuote.location}</p>}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Main layout: sections list + editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Section cards */}
            <div className="space-y-3">
              {SECTIONS.map((section) => {
                const status = sectionStatuses[section.id]
                const isActive = activeSectionId === section.id
                const isGenerating = status === 'generating'

                return (
                  <div
                    key={section.id}
                    className={`glass p-4 cursor-pointer transition-all ${
                      isActive
                        ? 'ring-2 ring-accent/50 bg-accent/5'
                        : 'hover:bg-surface-3'
                    }`}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(status)}
                        <h3 className="text-sm font-semibold text-text-primary">
                          {section.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          status === 'complete'
                            ? 'bg-green-500/15 text-green-400'
                            : status === 'generating'
                              ? 'bg-accent/15 text-accent'
                              : status === 'error'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-surface-3 text-text-disabled'
                        }`}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mb-3">{section.description}</p>
                    <button
                      className={`btn w-full text-xs ${
                        status === 'complete' ? 'btn-ghost' : 'btn-primary'
                      }`}
                      disabled={!selectedQuote || isGenerating}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerate(section.id)
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : status === 'complete' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <PenTool className="w-3.5 h-3.5" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Right: Preview / editor */}
            <div className="lg:col-span-2">
              <GlassCard className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {activeSection.title}
                  </h2>
                  {sectionContent[activeSectionId] && (
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost text-xs"
                        disabled={sectionStatuses[activeSectionId] === 'generating'}
                        onClick={() => handleGenerate(activeSectionId)}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>

                {!selectedQuote ? (
                  <div className="flex-1 flex items-center justify-center text-text-disabled text-sm">
                    Select a quote above to get started
                  </div>
                ) : !sectionContent[activeSectionId] &&
                  sectionStatuses[activeSectionId] === 'idle' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <PenTool className="w-10 h-10 text-text-disabled" />
                    <p className="text-text-tertiary text-sm max-w-sm">
                      Click <strong>Generate</strong> on the left to create the{' '}
                      {activeSection.title} section using AI with your quote data.
                    </p>
                  </div>
                ) : (
                  <textarea
                    className="flex-1 min-h-[500px] !bg-surface-1/50 !text-text-secondary text-sm font-mono leading-relaxed resize-none"
                    value={sectionContent[activeSectionId]}
                    onChange={(e) =>
                      setSectionContent((prev) => ({
                        ...prev,
                        [activeSectionId]: e.target.value,
                      }))
                    }
                    placeholder={
                      sectionStatuses[activeSectionId] === 'generating'
                        ? 'Generating...'
                        : 'Content will appear here...'
                    }
                    readOnly={sectionStatuses[activeSectionId] === 'generating'}
                  />
                )}
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
