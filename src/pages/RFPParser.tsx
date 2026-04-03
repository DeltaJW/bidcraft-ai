import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileSearch,
  Upload,
  Sparkles,
  Loader2,
  Building2,
  MapPin,
  Hash,
  Shield,
  ListChecks,
  Award,
  ArrowRight,
  AlertTriangle,
  KeyRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { sendMessage } from '@/services/ai'
import { aiSettingsStore, workloadDraftStore, useStore } from '@/data/mockStore'

// ---- Extracted data types ----

interface BuildingInfo {
  name: string
  sqft: number | null
  floors: number | null
  location: string
}

interface ParsedRFP {
  buildings: BuildingInfo[]
  wageDeterm: string | null
  naicsCode: string | null
  setAside: string | null
  scopeItems: string[]
  evaluationCriteria: string[]
}

// ---- Extraction prompt ----

const EXTRACTION_PROMPT = `You are a government contract RFP/solicitation document parser. Analyze the provided RFP text and extract structured data.

Return ONLY a valid JSON object (no markdown fencing, no explanation) with exactly this schema:

{
  "buildings": [
    {
      "name": "string — building or facility name",
      "sqft": number_or_null,
      "floors": number_or_null,
      "location": "string — city/state/address or empty string"
    }
  ],
  "wageDeterm": "string or null — SCA Wage Determination number (e.g. 2015-4281)",
  "naicsCode": "string or null — NAICS code (e.g. 561720)",
  "setAside": "string or null — set-aside type (e.g. Small Business, 8(a), SDVOSB, HUBZone, WOSB, Full & Open)",
  "scopeItems": ["array of scope/task description strings extracted from the SOW"],
  "evaluationCriteria": ["array of evaluation factor strings if found"]
}

Rules:
- If a field is not found in the text, use null (for strings/numbers) or empty array (for arrays).
- For buildings, extract every distinct facility/building mentioned with whatever details are available.
- For sqft, look for "square feet", "SF", "sq ft", "sqft" mentions.
- For wage determination, look for "WD", "Wage Determination", patterns like "20XX-XXXX".
- For NAICS, look for 6-digit codes near "NAICS".
- For set-aside, look for "set-aside", "small business", "8(a)", "SDVOSB", "HUBZone", "WOSB", "unrestricted", "full and open".
- For scope items, extract distinct tasks/services from the Statement of Work or Performance Work Statement.
- For evaluation criteria, look for "evaluation factors", "evaluation criteria", "best value", "LPTA" sections.

Return ONLY the JSON object.`

export default function RFPParser() {
  const navigate = useNavigate()
  const aiSettings = useStore(aiSettingsStore)
  const [rfpText, setRfpText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParsedRFP | null>(null)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasKey = !!aiSettings.apiKey

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [])

  function processFile(file: File) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setFileName(file.name)
      toast('PDF detected — please paste the text content instead. PDF text extraction is not yet supported.', 'error')
      return
    }

    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      toast('Only .txt files are supported. For PDFs, please paste the text.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) {
        setRfpText(text)
        setFileName(file.name)
        setResult(null)
        setError('')
        toast(`Loaded ${file.name} (${text.length.toLocaleString()} characters)`)
      }
    }
    reader.onerror = () => toast('Failed to read file', 'error')
    reader.readAsText(file)
  }

  async function handleParse() {
    const text = rfpText.trim()
    if (!text) {
      toast('Paste or upload RFP text first', 'error')
      return
    }
    if (!hasKey) {
      toast('Add your Claude API key in Settings first', 'error')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await sendMessage([
        { role: 'user', content: `${EXTRACTION_PROMPT}\n\n--- RFP TEXT ---\n${text}` },
      ])

      // Parse JSON from response — handle markdown fencing if AI wraps it
      let jsonStr = response.trim()
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim()
      }

      const parsed = JSON.parse(jsonStr) as ParsedRFP

      // Validate shape
      const validated: ParsedRFP = {
        buildings: Array.isArray(parsed.buildings)
          ? parsed.buildings.map((b) => ({
              name: b.name || 'Unknown',
              sqft: typeof b.sqft === 'number' ? b.sqft : null,
              floors: typeof b.floors === 'number' ? b.floors : null,
              location: b.location || '',
            }))
          : [],
        wageDeterm: typeof parsed.wageDeterm === 'string' ? parsed.wageDeterm : null,
        naicsCode: typeof parsed.naicsCode === 'string' ? parsed.naicsCode : null,
        setAside: typeof parsed.setAside === 'string' ? parsed.setAside : null,
        scopeItems: Array.isArray(parsed.scopeItems) ? parsed.scopeItems.filter((s): s is string => typeof s === 'string') : [],
        evaluationCriteria: Array.isArray(parsed.evaluationCriteria) ? parsed.evaluationCriteria.filter((s): s is string => typeof s === 'string') : [],
      }

      setResult(validated)
      const buildingCount = validated.buildings.length
      const scopeCount = validated.scopeItems.length
      toast(`Extracted ${buildingCount} building${buildingCount !== 1 ? 's' : ''}, ${scopeCount} scope item${scopeCount !== 1 ? 's' : ''}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse RFP'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  function createWorkloadFromResult() {
    if (!result || result.buildings.length === 0) {
      toast('No building data to create workload from', 'error')
      return
    }

    const building = result.buildings[0]
    const zones = result.scopeItems.length > 0
      ? [{
          name: building.name || 'Main Building',
          tasks: result.scopeItems.map((item) => ({
            taskName: item,
            equipment: 'Manual',
            sqft: building.sqft ?? 0,
            sqftPerHour: 5000,
            frequency: '5x_week' as const,
            annualHours: 0,
          })),
        }]
      : []

    workloadDraftStore.set({
      buildingName: building.name || 'RFP Building',
      zones,
      totalAnnualHours: 0,
      burdenProfileId: '',
    })

    toast('Workload draft created from RFP data')
    navigate('/workload')
  }

  function clearAll() {
    setRfpText('')
    setResult(null)
    setError('')
    setFileName(null)
  }

  const hasContent = rfpText.trim().length > 0
  const hasResult = result !== null && (
    result.buildings.length > 0 ||
    result.wageDeterm ||
    result.naicsCode ||
    result.setAside ||
    result.scopeItems.length > 0 ||
    result.evaluationCriteria.length > 0
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileSearch className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">RFP Document Parser</h1>
        <span className="badge badge-blue">AI</span>
      </div>

      {!hasKey ? (
        <GlassCard className="text-center py-12">
          <KeyRound className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h2>
          <p className="text-text-tertiary text-sm mb-4 max-w-md mx-auto">
            The RFP Parser uses the Claude API to extract structured data from solicitation documents. Add your key in Settings.
          </p>
          <Link to="/settings" className="btn btn-primary no-underline">
            <KeyRound className="w-4 h-4" />
            Configure in Settings
          </Link>
        </GlassCard>
      ) : (
        <>
          {/* Input Area */}
          <GlassCard
            title="RFP / Solicitation Text"
            subtitle="Paste the full text or relevant sections of your RFP, PWS, or SOW"
            action={
              hasContent ? (
                <button className="btn btn-ghost !text-xs" onClick={clearAll}>
                  <X className="w-3 h-3" />
                  Clear
                </button>
              ) : undefined
            }
          >
            {/* File upload drop zone */}
            <div
              className="border-2 border-dashed border-border-default rounded-lg p-4 mb-4 text-center cursor-pointer hover:border-accent/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-5 h-5 text-text-disabled mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">
                {fileName
                  ? <>Loaded: <span className="text-accent">{fileName}</span></>
                  : <>Drop a <span className="text-accent">.txt</span> file here or click to upload</>
                }
              </p>
              <p className="text-xs text-text-disabled mt-1">
                PDF files accepted but text must be pasted manually
              </p>
            </div>

            {/* Text area */}
            <textarea
              className="w-full !min-h-[300px] !font-mono !text-xs resize-y"
              placeholder="Paste your RFP text here...&#10;&#10;Include the Statement of Work, wage determination references, building details, evaluation criteria, and any other relevant sections."
              value={rfpText}
              onChange={(e) => {
                setRfpText(e.target.value)
                setResult(null)
                setError('')
              }}
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-text-disabled">
                {rfpText.length.toLocaleString()} characters
              </p>
              <button
                className="btn btn-primary"
                onClick={handleParse}
                disabled={loading || !hasContent}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? 'Parsing...' : 'Parse with AI'}
              </button>
            </div>
          </GlassCard>

          {/* Error */}
          {error && (
            <div className="mt-4 glass p-4 flex items-center gap-3 border-error/30">
              <AlertTriangle className="w-5 h-5 text-error-light" />
              <span className="text-sm text-error-light">{error}</span>
            </div>
          )}

          {/* Results */}
          {hasResult && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Extracted Data</h2>
                {result.buildings.length > 0 && (
                  <button className="btn btn-primary" onClick={createWorkloadFromResult}>
                    <ArrowRight className="w-4 h-4" />
                    Create Workload from This
                  </button>
                )}
              </div>

              {/* Top-level metadata cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Wage Determination */}
                <GlassCard>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Wage Determination
                    </span>
                  </div>
                  <p className="text-lg font-mono font-bold text-text-primary">
                    {result.wageDeterm || <span className="text-text-disabled">Not found</span>}
                  </p>
                </GlassCard>

                {/* NAICS Code */}
                <GlassCard>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      NAICS Code
                    </span>
                  </div>
                  <p className="text-lg font-mono font-bold text-text-primary">
                    {result.naicsCode || <span className="text-text-disabled">Not found</span>}
                  </p>
                </GlassCard>

                {/* Set-Aside */}
                <GlassCard>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Set-Aside Type
                    </span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {result.setAside || <span className="text-text-disabled">Not found</span>}
                  </p>
                </GlassCard>
              </div>

              {/* Buildings */}
              {result.buildings.length > 0 && (
                <GlassCard
                  title={`Buildings / Facilities (${result.buildings.length})`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.buildings.map((b, i) => (
                      <div key={i} className="card-inset p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-text-primary text-sm truncate">
                              {b.name}
                            </h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-tertiary">
                              {b.sqft && (
                                <span className="font-mono">
                                  {b.sqft.toLocaleString()} SF
                                </span>
                              )}
                              {b.floors && (
                                <span>{b.floors} floor{b.floors !== 1 ? 's' : ''}</span>
                              )}
                              {b.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {b.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Scope Items */}
              {result.scopeItems.length > 0 && (
                <GlassCard
                  title={`Scope / Tasks (${result.scopeItems.length})`}
                >
                  <div className="flex flex-col gap-2">
                    {result.scopeItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 card-inset p-3 rounded-lg">
                        <ListChecks className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Evaluation Criteria */}
              {result.evaluationCriteria.length > 0 && (
                <GlassCard
                  title={`Evaluation Criteria (${result.evaluationCriteria.length})`}
                >
                  <div className="flex flex-col gap-2">
                    {result.evaluationCriteria.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 card-inset p-3 rounded-lg">
                        <Award className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Bottom CTA */}
              {result.buildings.length > 0 && (
                <div className="card-brand p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary">Ready to build a workload?</h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      Pre-populate zones and tasks from this RFP data into the Workloading tool.
                    </p>
                  </div>
                  <button className="btn btn-primary shrink-0" onClick={createWorkloadFromResult}>
                    <ArrowRight className="w-4 h-4" />
                    Create Workload
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty state when no results yet and not loading */}
          {!result && !loading && !error && !hasContent && (
            <div className="mt-8 text-center">
              <FileSearch className="w-12 h-12 text-text-disabled mx-auto mb-4" />
              <h3 className="text-text-secondary font-medium mb-2">Upload or paste your RFP</h3>
              <p className="text-sm text-text-tertiary max-w-lg mx-auto">
                Paste the full solicitation text or key sections (Statement of Work, wage determination,
                evaluation criteria) and the AI will extract building details, scope items, NAICS codes,
                set-aside type, and more into structured data you can use to start pricing.
              </p>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
