import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, FileSpreadsheet, Shield, Building2, ClipboardList, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { sendMessage } from '@/services/ai'
import {
  companyStore,
  burdenProfilesStore,
  aiSettingsStore,
  useStore,
} from '@/data/mockStore'
import type { BurdenProfile } from '@/types'

interface UploadedDoc {
  id: string
  name: string
  type: DocType
  content: string
  status: 'pending' | 'processing' | 'done' | 'error'
  result: string | null
  appliedTo: string | null
}

type DocType = 'wage_determination' | 'pws' | 'solicitation' | 'benefits' | 'company' | 'other'

const DOC_TYPES: { value: DocType; label: string; icon: typeof FileText; desc: string; fillsWhat: string }[] = [
  { value: 'wage_determination', label: 'Wage Determination', icon: Shield, desc: 'SCA WD from solicitation', fillsWhat: 'Burden Builder — base wages, H&W rate, labor categories' },
  { value: 'pws', label: 'Performance Work Statement', icon: ClipboardList, desc: 'Scope of work / PWS', fillsWhat: 'Workloading — zones, tasks, sqft, frequencies' },
  { value: 'solicitation', label: 'Solicitation / RFP', icon: FileText, desc: 'Full solicitation package', fillsWhat: 'Proposal — contract ref, location, NAICS, set-aside, eval criteria' },
  { value: 'benefits', label: 'Benefits Summary', icon: FileSpreadsheet, desc: 'Insurance / fringe cost docs', fillsWhat: 'Burden Builder — H&W rate, leave days, insurance costs' },
  { value: 'company', label: 'Company Document', icon: Building2, desc: 'SAM registration, letterhead', fillsWhat: 'Company Profile — name, address, CAGE, UEI, set-aside' },
  { value: 'other', label: 'Other Document', icon: FileText, desc: 'Any other document', fillsWhat: 'AI will determine what data can be extracted' },
]

const EXTRACTION_PROMPTS: Record<DocType, string> = {
  wage_determination: `Extract all labor categories with hourly rates from this wage determination document. Also extract:
- WD number and revision
- Health & Welfare (H&W) rate
- Vacation requirements
- Holiday requirements
Return as JSON: { wdNumber, revision, hwRate, laborCategories: [{ code, title, rate }], vacation, holidays }`,

  pws: `Extract the scope of work from this Performance Work Statement. For each area/zone, identify:
- Area name and approximate square footage
- Cleaning tasks required
- Frequencies (daily, weekly, monthly, etc.)
- Special requirements
Return as JSON: { buildingName, totalSqft, zones: [{ name, sqft, tasks: [{ task, frequency, notes }] }] }`,

  solicitation: `Extract key bid information from this solicitation:
- Solicitation/contract number
- Agency name
- Location/address
- NAICS code
- Set-aside type
- Period of performance (start/end dates, option years)
- Evaluation criteria
- Wage determination number referenced
Return as JSON: { solicitationNumber, agency, location, naics, setAside, startDate, endDate, optionYears, evaluationCriteria: [], wdNumber }`,

  benefits: `Extract fringe benefit costs from this document:
- Health insurance cost per employee per hour or per month
- Dental/vision costs if listed
- Vacation days/policy
- Holiday schedule
- Sick leave policy
- Any other fringe benefits with costs
Return as JSON: { hwRate, vacationDays, holidays, sickDays, otherBenefits: [] }`,

  company: `Extract company information:
- Legal business name
- DBA name if different
- Address
- CAGE code
- UEI (SAM unique entity ID)
- Set-aside status (8(a), HUBZone, SDVOSB, etc.)
- Contact person name, title, phone, email
Return as JSON: { name, dbaName, address, cageCode, uei, setAside, contactName, contactTitle, contactPhone, contactEmail }`,

  other: `Analyze this document and extract any information relevant to a government contract bid:
- Company information
- Labor rates or wage data
- Scope of work details
- Contract terms
- Financial data
Return as JSON with whatever fields are relevant.`,
}

export default function DocumentHub() {
  const aiSettings = useStore(aiSettingsStore)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [dragOver, setDragOver] = useState(false)

  const hasKey = !!aiSettings.apiKey

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const newDoc: UploadedDoc = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: inferDocType(file.name, content),
          content: content.slice(0, 50000), // limit to ~50K chars for AI
          status: 'pending',
          result: null,
          appliedTo: null,
        }
        setDocs((prev) => [...prev, newDoc])
      }
      reader.readAsText(file)
    })
  }, [])

  function inferDocType(filename: string, content: string): DocType {
    const lower = filename.toLowerCase() + ' ' + content.slice(0, 1000).toLowerCase()
    if (lower.includes('wage determination') || lower.includes('wd ') || lower.includes('register of wage')) return 'wage_determination'
    if (lower.includes('performance work statement') || lower.includes('pws') || lower.includes('scope of work') || lower.includes('statement of work')) return 'pws'
    if (lower.includes('solicitation') || lower.includes('rfp') || lower.includes('sf-1449') || lower.includes('request for proposal')) return 'solicitation'
    if (lower.includes('benefits') || lower.includes('insurance') || lower.includes('fringe') || lower.includes('health plan')) return 'benefits'
    if (lower.includes('cage') || lower.includes('uei') || lower.includes('sam.gov') || lower.includes('entity registration')) return 'company'
    return 'other'
  }

  async function processDocument(docId: string) {
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'processing' } : d))

    const doc = docs.find((d) => d.id === docId)
    if (!doc) return

    try {
      const prompt = `${EXTRACTION_PROMPTS[doc.type]}\n\nHere is the document text:\n\n${doc.content}`
      const response = await sendMessage([{ role: 'user', content: prompt }])

      setDocs((prev) => prev.map((d) =>
        d.id === docId ? { ...d, status: 'done', result: response } : d
      ))
      toast(`Extracted data from ${doc.name}`)
    } catch (err) {
      setDocs((prev) => prev.map((d) =>
        d.id === docId ? { ...d, status: 'error', result: err instanceof Error ? err.message : 'Extraction failed' } : d
      ))
      toast('Extraction failed', 'error')
    }
  }

  function applyWDResults(doc: UploadedDoc) {
    if (!doc.result) return
    try {
      // Try to parse JSON from the result
      const jsonMatch = doc.result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) { toast('Could not parse extraction results', 'error'); return }
      const data = JSON.parse(jsonMatch[0])

      if (data.laborCategories && Array.isArray(data.laborCategories)) {
        let created = 0
        for (const cat of data.laborCategories) {
          if (cat.rate && cat.title) {
            const profile: BurdenProfile = {
              id: `bp-${Date.now()}-${created}`,
              name: `${cat.title} — WD ${data.wdNumber || 'uploaded'}`,
              baseWage: parseFloat(cat.rate) || 0,
              hwRate: parseFloat(data.hwRate) || 0,
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
            // Calculate burdened rate
            const basePlusHW = profile.baseWage + profile.hwRate
            const taxTotal = profile.baseWage * ((profile.ficaPct + profile.suiPct + profile.wcPct + profile.futaPct) / 100)
            const leaveDays = profile.vacationDays + profile.holidayDays + profile.sickDays
            const effectiveDays = 260 - leaveDays
            const leavePct = effectiveDays > 0 ? leaveDays / effectiveDays : 0
            const leaveDollar = (basePlusHW + taxTotal) * leavePct
            const subtotal = basePlusHW + taxTotal + leaveDollar
            const gaDollar = subtotal * (profile.gaPct / 100)
            const preProfit = subtotal + gaDollar
            const feeDollar = preProfit * (profile.feePct / 100)
            profile.computedRate = preProfit + feeDollar

            burdenProfilesStore.update((prev) => [...prev, profile])
            created++
          }
        }
        setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, appliedTo: 'Burden Builder' } : d))
        toast(`Created ${created} burden profiles from wage determination`)
      }
    } catch {
      toast('Failed to apply WD data', 'error')
    }
  }

  function applyCompanyResults(doc: UploadedDoc) {
    if (!doc.result) return
    try {
      const jsonMatch = doc.result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) { toast('Could not parse results', 'error'); return }
      const data = JSON.parse(jsonMatch[0])

      companyStore.update((prev) => ({
        ...prev,
        name: data.name || prev.name,
        address: data.address || prev.address,
        cageCode: data.cageCode || prev.cageCode,
        uei: data.uei || prev.uei,
        setAside: data.setAside || prev.setAside,
        contactName: data.contactName || prev.contactName,
        contactTitle: data.contactTitle || prev.contactTitle,
        contactEmail: data.contactEmail || prev.contactEmail,
        contactPhone: data.contactPhone || prev.contactPhone,
      }))
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, appliedTo: 'Company Profile' } : d))
      toast('Company profile updated from document')
    } catch {
      toast('Failed to apply company data', 'error')
    }
  }

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  function processAll() {
    docs.filter((d) => d.status === 'pending').forEach((d) => processDocument(d.id))
  }

  const pendingCount = docs.filter((d) => d.status === 'pending').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="mb-2">
        <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Intelligence</p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Document Hub</h1>
          <span className="badge badge-blue">AI-Powered</span>
        </div>
      </div>
      <p className="text-text-tertiary text-sm mb-6">
        Drop your contract documents here. AI extracts the data and fills out the rest of the app for you —
        wage determinations, scopes of work, company info, and more.
      </p>

      {!hasKey ? (
        <GlassCard className="text-center py-12">
          <Upload className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h2>
          <p className="text-text-tertiary text-sm mb-4">Document extraction uses the Claude API. Add your key in Settings.</p>
        </GlassCard>
      ) : (
        <>
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors cursor-pointer ${
              dragOver
                ? 'border-accent bg-accent-muted'
                : 'border-border-default hover:border-accent/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.txt,.pdf,.doc,.docx,.csv,.xlsx'
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) handleFiles(files)
              }
              input.click()
            }}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-accent' : 'text-text-disabled'}`} />
            <p className="text-text-secondary font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-text-tertiary mt-1">
              Supports: .txt, .csv, .xlsx (PDF text must be pasted — browser can't read PDFs directly)
            </p>
          </div>

          {/* Document type guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {DOC_TYPES.map((dt) => (
              <div key={dt.value} className="card-inset p-3">
                <div className="flex items-center gap-2 mb-1">
                  <dt.icon className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-text-primary">{dt.label}</span>
                </div>
                <p className="text-xs text-text-tertiary">{dt.fillsWhat}</p>
              </div>
            ))}
          </div>

          {/* Uploaded documents */}
          {docs.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-secondary">
                  Uploaded Documents ({docs.length})
                </h2>
                <div className="flex gap-2">
                  {pendingCount > 0 && (
                    <button className="btn btn-primary" onClick={processAll}>
                      Process All ({pendingCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {docs.map((doc) => {
                    const typeInfo = DOC_TYPES.find((dt) => dt.value === doc.type) || DOC_TYPES[5]
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <GlassCard className="!p-4">
                          <div className="flex items-start gap-4">
                            {/* Status icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              doc.status === 'done' ? 'bg-success/15' :
                              doc.status === 'processing' ? 'bg-accent/15' :
                              doc.status === 'error' ? 'bg-error/15' :
                              'bg-surface-3'
                            }`}>
                              {doc.status === 'processing' ? (
                                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                              ) : doc.status === 'done' ? (
                                <Check className="w-5 h-5 text-success" />
                              ) : doc.status === 'error' ? (
                                <AlertTriangle className="w-5 h-5 text-error-light" />
                              ) : (
                                <typeInfo.icon className="w-5 h-5 text-text-tertiary" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-text-primary truncate">{doc.name}</h3>
                                <span className="badge badge-navy">{typeInfo.label}</span>
                                {doc.appliedTo && (
                                  <span className="badge badge-green">Applied → {doc.appliedTo}</span>
                                )}
                              </div>
                              <p className="text-xs text-text-tertiary">
                                {doc.content.length.toLocaleString()} characters extracted
                              </p>

                              {/* Type selector */}
                              <div className="flex items-center gap-2 mt-2">
                                <select
                                  className="!w-48 !text-xs !py-1"
                                  value={doc.type}
                                  onChange={(e) => setDocs((prev) => prev.map((d) =>
                                    d.id === doc.id ? { ...d, type: e.target.value as DocType } : d
                                  ))}
                                >
                                  {DOC_TYPES.map((dt) => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                  ))}
                                </select>

                                {doc.status === 'pending' && (
                                  <button className="btn btn-primary !text-xs !py-1 !px-3" onClick={() => processDocument(doc.id)}>
                                    Extract Data
                                  </button>
                                )}

                                {doc.status === 'done' && doc.type === 'wage_determination' && !doc.appliedTo && (
                                  <button className="btn btn-success !text-xs !py-1 !px-3" onClick={() => applyWDResults(doc)}>
                                    Apply to Burden Builder
                                  </button>
                                )}

                                {doc.status === 'done' && doc.type === 'company' && !doc.appliedTo && (
                                  <button className="btn btn-success !text-xs !py-1 !px-3" onClick={() => applyCompanyResults(doc)}>
                                    Apply to Company Profile
                                  </button>
                                )}

                                {doc.status === 'done' && !doc.appliedTo && doc.type !== 'wage_determination' && doc.type !== 'company' && (
                                  <span className="text-xs text-text-tertiary">View extracted data in the AI result below</span>
                                )}
                              </div>

                              {/* Result preview */}
                              {doc.result && (
                                <div className="mt-3 card-inset p-3 max-h-48 overflow-y-auto">
                                  <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
                                    {doc.result.slice(0, 2000)}
                                    {doc.result.length > 2000 && '...'}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              className="p-1.5 text-text-disabled hover:text-error-light transition-colors bg-transparent border-none cursor-pointer shrink-0"
                              onClick={() => removeDoc(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Empty state */}
          {docs.length === 0 && (
            <GlassCard className="text-center py-8">
              <FileText className="w-10 h-10 text-text-disabled mx-auto mb-3" />
              <h3 className="text-text-secondary font-medium mb-1">No documents yet</h3>
              <p className="text-xs text-text-tertiary max-w-md mx-auto">
                Upload your wage determinations, performance work statements, solicitations,
                and company documents. AI will extract the data and fill out BidCraft for you.
              </p>
            </GlassCard>
          )}
        </>
      )}
    </motion.div>
  )
}
