import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Trash2, Printer, Save, DollarSign, Download, FileDown } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import ProposalPreview from '@/components/ProposalPreview'
import {
  companyStore,
  burdenProfilesStore,
  workloadDraftStore,
  quotesStore,
  useStore,
} from '@/data/mockStore'
import type { MaterialItem, Quote } from '@/types'

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

export default function Proposal() {
  const company = useStore(companyStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const workloadDraft = useStore(workloadDraftStore)
  const printRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [location, setLocation] = useState('')
  const [scopeDescription, setScopeDescription] = useState('')
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [zones, setZones] = useState<ProposalZone[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [assumptions, setAssumptions] = useState<string[]>([
    'Pricing based on standard business hours (Mon-Fri, 6:00 PM - 11:00 PM)',
    'All cleaning supplies and equipment provided by contractor',
    'Client to provide water, electricity, and restroom access for cleaning crew',
    'Scope assumes current building conditions; additional remediation quoted separately',
    'Annual pricing subject to SCA wage determination adjustments',
  ])
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load from workload draft if available
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
            laborCost: 0, // will be recalculated
          })),
        }))
      )
      // Clear the draft
      workloadDraftStore.set(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0

  // Recalculate labor costs when burden rate changes
  const computedZones = zones.map((z) => ({
    ...z,
    tasks: z.tasks.map((t) => ({
      ...t,
      laborCost: t.annualHours * burdenRate,
    })),
  }))

  const totalAnnualHours = computedZones
    .flatMap((z) => z.tasks)
    .reduce((s, t) => s + t.annualHours, 0)
  const totalLabor = computedZones
    .flatMap((z) => z.tasks)
    .reduce((s, t) => s + t.laborCost, 0)
  const totalMaterials = materials.reduce((s, m) => s + m.unitCost * m.quantity, 0)
  const grandTotal = totalLabor + totalMaterials
  const monthlyTotal = grandTotal / 12

  // Materials CRUD
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

  // Assumptions CRUD
  function addAssumption() {
    setAssumptions((prev) => [...prev, ''])
  }
  function updateAssumption(index: number, value: string) {
    setAssumptions((prev) => prev.map((a, i) => (i === index ? value : a)))
  }
  function removeAssumption(index: number) {
    setAssumptions((prev) => prev.filter((_, i) => i !== index))
  }

  // Save
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

  if (showPreview) {
    return (
      <div>
        <div className="no-print mb-4 flex gap-2">
          <button className="btn btn-ghost" onClick={() => setShowPreview(false)}>
            Back to Editor
          </button>
          <button className="btn btn-primary" onClick={handlePDF}>
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="btn btn-ghost" onClick={handleDOCX}>
            <FileDown className="w-4 h-4" />
            Download DOCX
          </button>
        </div>
        <ProposalPreview
          ref={printRef}
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
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Full Proposal</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={handleSave}>
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Preview & Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Proposal info */}
          <GlassCard title="Proposal Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-tertiary mb-1">Proposal Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Annual Janitorial Services — Federal Building 101"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Contract Reference</label>
                <input
                  value={contractRef}
                  onChange={(e) => setContractRef(e.target.value)}
                  placeholder="GS-07F-0001X"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Federal Building, 123 Main St, Washington DC"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Burden Profile</label>
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
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-tertiary mb-1">Scope of Work</label>
                <textarea
                  rows={3}
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  placeholder="Provide comprehensive janitorial services including daily cleaning, periodic floor care, and restroom sanitation for all occupied areas..."
                />
              </div>
            </div>
          </GlassCard>

          {/* Zones with tasks (read from workload) */}
          <GlassCard title="Labor by Zone" subtitle="Imported from workloading calculator">
            {computedZones.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary text-sm">
                No zones — use the Workloading Calculator to build zones and click "Send to Proposal"
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {computedZones.map((zone) => (
                  <div key={zone.id} className="border border-border-subtle rounded-lg overflow-hidden">
                    <div className="bg-surface-2 px-4 py-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-text-primary">{zone.name}</span>
                      <span className="text-xs text-text-tertiary">
                        {zone.tasks.reduce((s, t) => s + t.annualHours, 0).toFixed(1)} hrs/yr
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-text-tertiary border-t border-border-subtle">
                          <th className="text-left px-3 py-1.5 font-medium">Task</th>
                          <th className="text-left px-3 py-1.5 font-medium">Equipment</th>
                          <th className="text-right px-3 py-1.5 font-medium">Sq Ft</th>
                          <th className="text-left px-3 py-1.5 font-medium">Frequency</th>
                          <th className="text-right px-3 py-1.5 font-medium">Hrs/Yr</th>
                          <th className="text-right px-3 py-1.5 font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zone.tasks.map((t) => (
                          <tr key={t.id} className="border-t border-border-subtle">
                            <td className="px-3 py-1.5">{t.taskName}</td>
                            <td className="px-3 py-1.5 text-text-tertiary">{t.equipment}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-xs">{t.sqft.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-text-tertiary text-xs">{t.frequency.replace('_', 'x/')}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-xs">{t.annualHours.toFixed(1)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-xs text-accent">
                              ${t.laborCost.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Materials */}
          <GlassCard title="Annual Materials" subtitle="Supplies, chemicals, and consumables">
            {materials.length > 0 && (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-text-tertiary">
                    <th className="text-left px-2 py-2 font-medium">Item</th>
                    <th className="text-right px-2 py-2 font-medium w-24">Unit Cost</th>
                    <th className="text-right px-2 py-2 font-medium w-16">Qty/Yr</th>
                    <th className="text-left px-2 py-2 font-medium w-16">Unit</th>
                    <th className="text-right px-2 py-2 font-medium w-24">Annual</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-t border-border-subtle">
                      <td className="px-2 py-2">
                        <input
                          className="!text-xs"
                          value={m.name}
                          onChange={(e) => updateMaterial(m.id, { name: e.target.value })}
                          placeholder="Floor finish, trash liners, etc."
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="!text-right !text-xs"
                          value={m.unitCost || ''}
                          onChange={(e) => updateMaterial(m.id, { unitCost: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          className="!text-right !text-xs"
                          value={m.quantity || ''}
                          onChange={(e) => updateMaterial(m.id, { quantity: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="!text-xs"
                          value={m.unit}
                          onChange={(e) => updateMaterial(m.id, { unit: e.target.value })}
                        >
                          <option>ea</option>
                          <option>gal</option>
                          <option>case</option>
                          <option>box</option>
                          <option>roll</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-accent">
                        ${(m.unitCost * m.quantity).toFixed(2)}
                      </td>
                      <td className="px-1 py-2">
                        <button
                          className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                          onClick={() => removeMaterial(m.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="btn btn-ghost !text-xs" onClick={addMaterial}>
              <Plus className="w-3 h-3" /> Add Material
            </button>
          </GlassCard>

          {/* Assumptions */}
          <GlassCard title="Assumptions & Conditions" subtitle="Included in the printed proposal">
            <div className="flex flex-col gap-2">
              {assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-text-tertiary mt-1.5 text-xs">{i + 1}.</span>
                  <input
                    className="!text-xs flex-1"
                    value={a}
                    onChange={(e) => updateAssumption(i, e.target.value)}
                  />
                  <button
                    className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer mt-0.5"
                    onClick={() => removeAssumption(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost !text-xs mt-3" onClick={addAssumption}>
              <Plus className="w-3 h-3" /> Add Assumption
            </button>
          </GlassCard>
        </div>

        {/* Right: Cost summary */}
        <div>
          <GlassCard title="Cost Summary" className="sticky top-8">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Annual Hours</span>
                <span className="font-mono text-text-secondary">{totalAnnualHours.toFixed(1)}</span>
              </div>
              {burdenRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Burden Rate</span>
                  <span className="font-mono text-text-secondary">${burdenRate.toFixed(2)}/hr</span>
                </div>
              )}
              <div className="border-t border-border-subtle my-1" />
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Annual Labor</span>
                <span className="font-mono text-text-primary font-medium">
                  ${totalLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Annual Materials</span>
                <span className="font-mono text-text-primary font-medium">
                  ${totalMaterials.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="border-t border-border-subtle my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Annual Total
                </span>
                <span className="text-xl font-bold text-accent font-mono">
                  ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Monthly</span>
                <span className="font-mono text-text-secondary">
                  ${monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              {computedZones.length > 0 && (
                <>
                  <div className="border-t border-border-subtle my-1" />
                  <p className="text-xs text-text-tertiary font-medium mb-1">By Zone</p>
                  {computedZones.map((z) => {
                    const zoneCost = z.tasks.reduce((s, t) => s + t.laborCost, 0)
                    return (
                      <div key={z.id} className="flex justify-between">
                        <span className="text-text-tertiary text-xs">{z.name}</span>
                        <span className="font-mono text-xs text-text-secondary">
                          ${zoneCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
