import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, Printer, Save, Download, FileDown, ClipboardList, Package, BookOpen } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import ProposalPreview from '@/components/ProposalPreview'
import ProposalCoverPage from '@/components/ProposalCoverPage'
import SupplyCatalogModal from '@/components/SupplyCatalogModal'
import {
  companyStore,
  burdenProfilesStore,
  workloadDraftStore,
  quotesStore,
  clientsStore,
  useStore,
} from '@/data/mockStore'
import type { MaterialItem, Quote } from '@/types'
import type { SupplyItem } from '@/data/defaultSupplies'

interface ProposalZone {
  id: string
  name: string
  tasks: ProposalTask[]
}

interface ProposalTask {
  id: string
  taskName: string
  equipment: string
  sqft: number
  sqftPerHour: number
  frequency: string
  annualHours: number
  laborCost: number
}

const pageAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function Proposal() {
  const company = useStore(companyStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const workloadDraft = useStore(workloadDraftStore)
  const clients = useStore(clientsStore)
  const printRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [location, setLocation] = useState('')
  const [submittedTo, setSubmittedTo] = useState('')
  const [scopeDescription, setScopeDescription] = useState('')
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [zones, setZones] = useState<ProposalZone[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [assumptions, setAssumptions] = useState<string[]>([
    'Pricing based on standard business hours (Mon-Fri, 6:00 PM - 11:00 PM)',
    'All cleaning supplies and equipment provided by contractor',
    'Client to provide water, electricity, and restroom access for cleaning crew',
    'Scope assumes current building conditions; additional remediation quoted separately',
    'Annual pricing subject to SCA wage determination adjustments',
  ])
  const [materialsMarkupPct, setMaterialsMarkupPct] = useState(10)
  const [showPreview, setShowPreview] = useState(false)
  const [showCoverPage, setShowCoverPage] = useState(true)
  const [showCatalog, setShowCatalog] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (workloadDraft) {
      setTitle(`Annual Proposal — ${workloadDraft.buildingName || 'Building'}`)
      setSelectedBurdenId(workloadDraft.burdenProfileId)
      setZones(
        workloadDraft.zones.map((z, i) => ({
          id: `pz-${Date.now()}-${i}`,
          name: z.name,
          tasks: z.tasks.map((t, j) => ({
            id: `pt-${Date.now()}-${i}-${j}`,
            taskName: t.taskName,
            equipment: t.equipment,
            sqft: t.sqft,
            sqftPerHour: t.sqftPerHour,
            frequency: t.frequency,
            annualHours: t.annualHours,
            laborCost: 0,
          })),
        }))
      )
      workloadDraftStore.set(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0

  const computedZones = zones.map((z) => ({
    ...z,
    tasks: z.tasks.map((t) => ({
      ...t,
      laborCost: t.annualHours * burdenRate,
    })),
  }))

  const totalAnnualHours = computedZones.flatMap((z) => z.tasks).reduce((s, t) => s + t.annualHours, 0)
  const totalLabor = computedZones.flatMap((z) => z.tasks).reduce((s, t) => s + t.laborCost, 0)
  const rawMaterials = materials.reduce((s, m) => s + m.unitCost * m.quantity, 0)
  const totalMaterials = rawMaterials * (1 + materialsMarkupPct / 100)
  const grandTotal = totalLabor + totalMaterials
  const monthlyTotal = grandTotal / 12

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { id: `mat-${Date.now()}`, name: '', unitCost: 0, quantity: 12, unit: 'ea' },
    ])
  }
  function updateMaterial(id: string, updates: Partial<MaterialItem>) {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }
  function removeMaterial(id: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }
  function addMaterialFromCatalog(item: SupplyItem) {
    setMaterials((prev) => [
      ...prev,
      { id: `mat-${Date.now()}`, name: item.name, unitCost: item.unitCost, quantity: 12, unit: item.unit },
    ])
    toast(`Added "${item.name}" to materials`)
  }
  function addAssumption() {
    setAssumptions((prev) => [...prev, ''])
  }
  function updateAssumption(index: number, value: string) {
    setAssumptions((prev) => prev.map((a, i) => (i === index ? value : a)))
  }
  function removeAssumption(index: number) {
    setAssumptions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (zones.length === 0) {
      toast('No zones to save — use Workloading Calculator first', 'error')
      return
    }
    if (!selectedBurdenId) {
      toast('Select a burden profile to calculate costs', 'error')
      return
    }
    const quote: Quote = {
      id: `quote-${Date.now()}`,
      companyId: company.id,
      burdenProfileId: selectedBurdenId,
      ...(selectedClientId ? { clientId: selectedClientId } : {}),
      quoteType: 'proposal',
      title: title || 'Untitled Proposal',
      contractRef,
      location,
      scopeDescription,
      tasks: computedZones.flatMap((z) =>
        z.tasks.map((t) => ({
          id: t.id,
          taskName: `[${z.name}] ${t.taskName}`,
          equipment: t.equipment,
          sqft: t.sqft,
          sqftPerHour: t.sqftPerHour,
          hours: t.annualHours,
          laborCost: t.laborCost,
        }))
      ),
      materials,
      assumptions,
      totalHours: totalAnnualHours,
      totalLabor,
      totalMaterials,
      grandTotal,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    quotesStore.update((prev) => [...prev, quote])
    toast('Proposal saved')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handlePrint() {
    setShowPreview(true)
    setTimeout(() => window.print(), 300)
  }

  async function handlePDF() {
    setShowPreview(true)
    await new Promise(r => setTimeout(r, 300))
    if (printRef.current) {
      const { downloadPDF } = await import('@/utils/pdf')
      await downloadPDF(printRef.current, `${title || 'Proposal'}.pdf`)
    }
  }

  async function handleDOCX() {
    const { downloadDOCX } = await import('@/utils/docx')
    await downloadDOCX(
      {
        company,
        title,
        contractRef,
        location,
        scopeDescription,
        zones: computedZones,
        materials,
        assumptions,
        totalAnnualHours: totalAnnualHours,
        totalLabor,
        totalMaterials,
        grandTotal,
        monthlyTotal,
        burdenRate,
        burdenProfileName: selectedBurden?.name ?? '',
      },
      `${title || 'Proposal'}.docx`
    )
  }

  // ── Preview Mode ──
  if (showPreview) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <div>
        <div className="no-print mb-4 flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
            onClick={() => setShowPreview(false)}
          >
            Back to Editor
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors"
            onClick={handlePDF}
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
            onClick={handleDOCX}
          >
            <FileDown className="w-3.5 h-3.5" />
            Download DOCX
          </button>
          <label className="ml-4 flex items-center gap-2 cursor-pointer text-[11px] text-text-secondary select-none">
            <input
              type="checkbox"
              checked={showCoverPage}
              onChange={(e) => setShowCoverPage(e.target.checked)}
              style={{ width: 'auto', accentColor: '#5B8DEF' }}
            />
            <BookOpen className="w-3.5 h-3.5" />
            Cover Page
          </label>
        </div>
        <div ref={printRef}>
          {showCoverPage && (
            <ProposalCoverPage
              company={company}
              title={title}
              contractRef={contractRef}
              location={location}
              submittedTo={submittedTo}
              date={today}
            />
          )}
          <ProposalPreview
            company={company}
            title={title}
            contractRef={contractRef}
            location={location}
            scopeDescription={scopeDescription}
            zones={computedZones}
            materials={materials}
            assumptions={assumptions}
            totalAnnualHours={totalAnnualHours}
            totalLabor={totalLabor}
            totalMaterials={totalMaterials}
            grandTotal={grandTotal}
            monthlyTotal={monthlyTotal}
            burdenRate={burdenRate}
            burdenProfileName={selectedBurden?.name ?? ''}
          />
        </div>
      </div>
    )
  }

  // ── Editor Mode ──
  return (
    <motion.div
      className="max-w-5xl"
      initial="hidden"
      animate="show"
      variants={pageAnim}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Output</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Full Proposal</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
            onClick={handleSave}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" />
            Preview & Print
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Proposal Details */}
          <motion.div variants={fadeIn}>
            <GlassCard title="Proposal Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Proposal Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Annual Janitorial Services — Federal Building 101"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Contract Reference</label>
                  <input
                    value={contractRef}
                    onChange={(e) => setContractRef(e.target.value)}
                    placeholder="GS-07F-0001X"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Federal Building, 123 Main St, Washington DC"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Burden Profile</label>
                  <select
                    value={selectedBurdenId}
                    onChange={(e) => setSelectedBurdenId(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {burdenProfiles.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.name} (${bp.computedRate?.toFixed(2)}/hr)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Client (optional)</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.agency ? ` (${c.agency})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Submitted To</label>
                  <input
                    value={submittedTo}
                    onChange={(e) => setSubmittedTo(e.target.value)}
                    placeholder="General Services Administration, PBS Region 4"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-text-tertiary mb-1 font-medium">Scope of Work</label>
                  <textarea
                    rows={3}
                    value={scopeDescription}
                    onChange={(e) => setScopeDescription(e.target.value)}
                    placeholder="Provide comprehensive janitorial services including daily cleaning, periodic floor care, and restroom sanitation..."
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Labor by Zone */}
          <motion.div variants={fadeIn}>
            <GlassCard title="Labor by Zone" subtitle="Imported from workloading calculator">
              {computedZones.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardList className="w-10 h-10 text-text-disabled mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-text-primary mb-1">No zones imported</h3>
                  <p className="text-[11px] text-text-disabled max-w-sm mx-auto mb-4">
                    Build your workload in the Workloading Calculator, then click "Send to Proposal" to import.
                  </p>
                  <Link to="/workload" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-navy text-white text-xs font-semibold no-underline hover:bg-brand-navy-light transition-colors">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Go to Workloading
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {computedZones.map((zone) => (
                    <div key={zone.id} className="border border-border-subtle rounded-lg overflow-hidden">
                      <div className="bg-surface-2 px-4 py-2 flex justify-between items-center">
                        <span className="text-[12px] font-semibold text-text-primary">{zone.name}</span>
                        <span className="text-[11px] font-mono text-text-tertiary">
                          {zone.tasks.reduce((s, t) => s + t.annualHours, 0).toFixed(1)} hrs/yr
                        </span>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Task</th>
                            <th>Equipment</th>
                            <th className="numeric">Sq Ft</th>
                            <th>Freq</th>
                            <th className="numeric">Hrs/Yr</th>
                            <th className="numeric">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zone.tasks.map((t) => (
                            <tr key={t.id}>
                              <td className="text-text-primary">{t.taskName}</td>
                              <td>{t.equipment}</td>
                              <td className="numeric">{t.sqft.toLocaleString()}</td>
                              <td className="text-[11px]">{t.frequency.replace('_', '/')}</td>
                              <td className="numeric">{t.annualHours.toFixed(1)}</td>
                              <td className="numeric value-accent">${t.laborCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Materials */}
          <motion.div variants={fadeIn}>
            <GlassCard title="Annual Materials" subtitle="Supplies, chemicals, consumables" action={
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-text-disabled">Markup:</label>
                <input
                  type="number"
                  className="!w-16 !text-xs !py-1 !text-right"
                  value={materialsMarkupPct}
                  onChange={(e) => setMaterialsMarkupPct(Number(e.target.value))}
                />
                <span className="text-[11px] text-text-disabled">%</span>
              </div>
            }>
              {materials.length > 0 && (
                <table className="data-table mb-4">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="numeric w-24">Unit Cost</th>
                      <th className="numeric w-16">Qty/Yr</th>
                      <th className="w-16">Unit</th>
                      <th className="numeric w-24">Annual</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <input
                            className="!text-xs !border-none !bg-transparent !p-0"
                            value={m.name}
                            onChange={(e) => updateMaterial(m.id, { name: e.target.value })}
                            placeholder="Floor finish, trash liners, etc."
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="!text-right !text-xs !border-none !bg-transparent !p-0"
                            value={m.unitCost || ''}
                            onChange={(e) => updateMaterial(m.id, { unitCost: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="!text-right !text-xs !border-none !bg-transparent !p-0"
                            value={m.quantity || ''}
                            onChange={(e) => updateMaterial(m.id, { quantity: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select
                            className="!text-xs !border-none !bg-transparent !p-0"
                            value={m.unit}
                            onChange={(e) => updateMaterial(m.id, { unit: e.target.value })}
                          >
                            <option>ea</option>
                            <option>gal</option>
                            <option>case</option>
                            <option>box</option>
                            <option>roll</option>
                            <option>pail</option>
                            <option>bag</option>
                          </select>
                        </td>
                        <td className="numeric value-accent">
                          ${(m.unitCost * m.quantity).toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                            onClick={() => removeMaterial(m.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-[11px] font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
                  onClick={addMaterial}
                >
                  <Plus className="w-3 h-3" /> Add Material
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-[11px] font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all"
                  onClick={() => setShowCatalog(true)}
                >
                  <Package className="w-3 h-3" /> From Catalog
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Assumptions */}
          <motion.div variants={fadeIn}>
            <GlassCard title="Assumptions & Conditions" subtitle="Included in the printed proposal">
              <div className="flex flex-col gap-2">
                {assumptions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-text-disabled mt-2 text-[11px] font-mono w-5 text-right shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <input
                      className="!text-xs flex-1"
                      value={a}
                      onChange={(e) => updateAssumption(i, e.target.value)}
                    />
                    <button
                      className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer mt-0.5"
                      onClick={() => removeAssumption(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-[11px] font-medium bg-transparent cursor-pointer hover:text-text-primary transition-all mt-3"
                onClick={addAssumption}
              >
                <Plus className="w-3 h-3" /> Add Assumption
              </button>
            </GlassCard>
          </motion.div>
        </div>

        {/* Right: Cost Summary — command center panel */}
        <motion.div variants={fadeIn}>
          <div className="stat-card sticky top-8">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-accent">Cost Summary</p>
            </div>

            <div className="px-4 py-3 flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-text-disabled">Annual Hours</span>
                <span className="font-mono text-text-secondary tabular-nums">{totalAnnualHours.toFixed(1)}</span>
              </div>
              {burdenRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-disabled">Burden Rate</span>
                  <span className="font-mono text-text-secondary tabular-nums">${burdenRate.toFixed(2)}/hr</span>
                </div>
              )}
              <div className="separator-gradient my-1" />
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Annual Labor</span>
                <span className="font-mono text-text-primary font-semibold tabular-nums">
                  ${totalLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Annual Materials</span>
                <span className="font-mono text-text-primary font-semibold tabular-nums">
                  ${totalMaterials.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Grand total — navy bar */}
            <div className="px-4 py-3 bg-brand-navy/20 border-t border-accent/20">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Annual Total</span>
                <span className="text-2xl font-bold text-accent font-mono tracking-tight">
                  ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-text-disabled">Monthly</span>
                <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                  ${monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Zone breakdown */}
            {computedZones.length > 0 && (
              <div className="px-4 py-3 border-t border-border-subtle">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled mb-2">By Zone</p>
                <div className="flex flex-col gap-1.5">
                  {computedZones.map((z) => {
                    const zoneCost = z.tasks.reduce((s, t) => s + t.laborCost, 0)
                    return (
                      <div key={z.id} className="flex justify-between text-[12px]">
                        <span className="text-text-disabled truncate">{z.name}</span>
                        <span className="font-mono text-text-secondary tabular-nums">
                          ${zoneCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <SupplyCatalogModal
        open={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelect={addMaterialFromCatalog}
      />
    </motion.div>
  )
}
