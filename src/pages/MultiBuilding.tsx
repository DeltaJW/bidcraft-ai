import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Plus, Trash2, ChevronDown, ChevronRight, Save } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { PREBUILT_TEMPLATES } from '@/data/buildingTemplates'
import { burdenProfilesStore, quotesStore, companyStore, useStore } from '@/data/mockStore'
import { FREQUENCY_ANNUAL_MULTIPLIER, type Zone, type ZoneTask, type Frequency, type MaterialItem, type Quote } from '@/types'
import { rateLibraryStore } from '@/data/mockStore'

interface BuildingEntry {
  id: string
  name: string
  sqft: number
  address: string
  zones: Zone[]
  materials: MaterialItem[]
  expanded: boolean
}

export default function MultiBuilding() {
  const navigate = useNavigate()
  const library = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const company = useStore(companyStore)

  const [title, setTitle] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [buildings, setBuildings] = useState<BuildingEntry[]>([])
  const [assumptions] = useState([
    'Pricing based on standard business hours (Mon-Fri, 6:00 PM - 11:00 PM)',
    'All cleaning supplies and equipment provided by contractor',
    'Client to provide water, electricity, and restroom access',
    'Annual pricing subject to SCA wage determination adjustments',
  ])

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0

  function addBuilding() {
    setBuildings((prev) => [
      ...prev,
      {
        id: `bldg-${Date.now()}`,
        name: `Building ${prev.length + 1}`,
        sqft: 0,
        address: '',
        zones: [],
        materials: [],
        expanded: true,
      },
    ])
  }

  function loadTemplate(buildingId: string, templateId: string) {
    const tmpl = PREBUILT_TEMPLATES.find((t) => t.id === templateId)
    if (!tmpl) return
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              name: tmpl.name,
              sqft: tmpl.sqft,
              zones: tmpl.zones.map((z) => ({
                ...z,
                id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                tasks: z.tasks.map((t) => ({
                  ...t,
                  id: `zt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                })),
              })),
              expanded: true,
            }
          : b
      )
    )
  }

  function removeBuilding(id: string) {
    setBuildings((prev) => prev.filter((b) => b.id !== id))
  }

  function toggleExpand(id: string) {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, expanded: !b.expanded } : b))
    )
  }

  function updateBuilding(id: string, updates: Partial<BuildingEntry>) {
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  function addZoneToBuilding(buildingId: string) {
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              zones: [
                ...b.zones,
                { id: `zone-${Date.now()}`, name: `Zone ${b.zones.length + 1}`, tasks: [] },
              ],
            }
          : b
      )
    )
  }

  function addTaskToZone(buildingId: string, zoneId: string) {
    const firstRate = library.rates[0]
    if (!firstRate) return
    const newTask: ZoneTask = {
      id: `zt-${Date.now()}`,
      rateItemId: firstRate.id,
      taskName: firstRate.task,
      sqft: 0,
      frequency: '5x_week' as Frequency,
      equipment: firstRate.equipment,
      sqftPerHour: firstRate.sqftPerHour,
    }
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              zones: b.zones.map((z) =>
                z.id === zoneId ? { ...z, tasks: [...z.tasks, newTask] } : z
              ),
            }
          : b
      )
    )
  }

  function taskAnnualHours(t: ZoneTask): number {
    if (t.sqftPerHour <= 0 || t.sqft <= 0) return 0
    return (t.sqft / t.sqftPerHour) * FREQUENCY_ANNUAL_MULTIPLIER[t.frequency]
  }

  // Totals
  const buildingSummaries = buildings.map((b) => {
    const hours = b.zones.reduce(
      (sum, z) => sum + z.tasks.reduce((s, t) => s + taskAnnualHours(t), 0),
      0
    )
    const labor = hours * burdenRate
    const materials = b.materials.reduce((s, m) => s + m.unitCost * m.quantity, 0)
    return { ...b, hours, labor, materials, total: labor + materials }
  })

  const grandTotalHours = buildingSummaries.reduce((s, b) => s + b.hours, 0)
  const grandTotalLabor = buildingSummaries.reduce((s, b) => s + b.labor, 0)
  const grandTotalMaterials = buildingSummaries.reduce((s, b) => s + b.materials, 0)
  const grandTotal = grandTotalLabor + grandTotalMaterials
  const totalFTEs = grandTotalHours / (6.5 * 260)

  function handleSave() {
    if (buildings.length === 0) {
      toast('Add at least one building', 'error')
      return
    }
    if (!selectedBurdenId) {
      toast('Select a burden profile', 'error')
      return
    }

    const quote: Quote = {
      id: `quote-${Date.now()}`,
      companyId: company.id,
      burdenProfileId: selectedBurdenId,
      quoteType: 'proposal',
      title: title || 'Multi-Building Proposal',
      contractRef,
      location: buildings.map((b) => b.name).join(', '),
      scopeDescription: `Multi-building proposal covering ${buildings.length} buildings, ${grandTotalHours.toFixed(0)} annual hours, ${totalFTEs.toFixed(1)} FTEs`,
      tasks: buildingSummaries.flatMap((b) =>
        b.zones.flatMap((z) =>
          z.tasks.map((t) => ({
            id: t.id,
            taskName: `[${b.name} — ${z.name}] ${t.taskName}`,
            equipment: t.equipment,
            sqft: t.sqft,
            sqftPerHour: t.sqftPerHour,
            hours: taskAnnualHours(t),
            laborCost: taskAnnualHours(t) * burdenRate,
          }))
        )
      ),
      materials: buildings.flatMap((b) => b.materials),
      assumptions,
      totalHours: grandTotalHours,
      totalLabor: grandTotalLabor,
      totalMaterials: grandTotalMaterials,
      grandTotal,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    quotesStore.update((prev) => [...prev, quote])
    toast('Multi-building proposal saved')
    navigate('/saved')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Output</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Multi-Building Proposal</h1>
        </div>
        <button className="btn btn-primary" onClick={addBuilding}>
          <Plus className="w-4 h-4" />
          Add Building
        </button>
      </div>

      {/* Proposal info */}
      <GlassCard title="Proposal Details" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Proposal Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Annual Janitorial Services — Multiple Buildings"
            />
          </div>
          <div>
            <label className="label">Contract Reference</label>
            <input
              value={contractRef}
              onChange={(e) => setContractRef(e.target.value)}
              placeholder="GS-07F-0001X"
            />
          </div>
          <div>
            <label className="label">Burden Profile</label>
            <select value={selectedBurdenId} onChange={(e) => setSelectedBurdenId(e.target.value)}>
              <option value="">— Select —</option>
              {burdenProfiles.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.name} (${bp.computedRate?.toFixed(2)}/hr)
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Buildings */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {buildings.length === 0 && (
            <GlassCard className="text-center py-12">
              <Building2 className="w-12 h-12 text-text-disabled mx-auto mb-3" />
              <p className="text-text-tertiary mb-2">No buildings added yet</p>
              <p className="text-xs text-text-disabled mb-4">
                Add buildings and load templates, or build zones from scratch for each one.
              </p>
              <button className="btn btn-primary" onClick={addBuilding}>
                <Plus className="w-4 h-4" />
                Add First Building
              </button>
            </GlassCard>
          )}

          {buildingSummaries.map((bldg) => (
            <GlassCard key={bldg.id} className="!p-0 overflow-hidden">
              {/* Building header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2 transition-colors"
                onClick={() => toggleExpand(bldg.id)}
              >
                <div className="flex items-center gap-3">
                  {bldg.expanded ? <ChevronDown className="w-4 h-4 text-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-text-tertiary" />}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{bldg.name}</h3>
                    <p className="text-xs text-text-tertiary">
                      {bldg.zones.length} zones | {bldg.hours.toFixed(0)} hrs/yr | ${bldg.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="!w-40 !text-xs !py-1"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { loadTemplate(bldg.id, e.target.value); e.target.value = '' }}
                    defaultValue=""
                  >
                    <option value="">Load template...</option>
                    {PREBUILT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    className="p-1.5 text-text-disabled hover:text-error-light transition-colors bg-transparent border-none cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); removeBuilding(bldg.id) }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Building content */}
              {bldg.expanded && (
                <div className="border-t border-border-subtle p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="label">Building Name</label>
                      <input
                        value={bldg.name}
                        onChange={(e) => updateBuilding(bldg.id, { name: e.target.value })}
                        className="!text-sm"
                      />
                    </div>
                    <div>
                      <label className="label">Address / Location</label>
                      <input
                        value={bldg.address}
                        onChange={(e) => updateBuilding(bldg.id, { address: e.target.value })}
                        className="!text-sm"
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>

                  {/* Zones summary */}
                  {bldg.zones.map((zone) => {
                    const zoneHours = zone.tasks.reduce((s, t) => s + taskAnnualHours(t), 0)
                    return (
                      <div key={zone.id} className="card-inset p-3 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-text-primary">{zone.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-accent">{zoneHours.toFixed(1)} hrs/yr</span>
                            <button
                              className="text-xs text-text-tertiary hover:text-accent bg-transparent border-none cursor-pointer"
                              onClick={() => addTaskToZone(bldg.id, zone.id)}
                            >
                              + Task
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-tertiary">
                          {zone.tasks.length} tasks
                        </p>
                      </div>
                    )
                  })}

                  <button
                    className="btn btn-ghost !text-xs mt-2"
                    onClick={() => addZoneToBuilding(bldg.id)}
                  >
                    <Plus className="w-3 h-3" /> Add Zone
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Right: Grand Summary */}
        <div>
          <GlassCard title="Grand Total" className="sticky top-8">
            <div className="flex flex-col gap-3 text-sm">
              <div className="text-center mb-2">
                <div className="text-3xl font-bold font-mono text-accent">
                  ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-text-tertiary">Annual Total</p>
              </div>

              <div className="border-t border-border-subtle pt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-text-tertiary">Buildings</span>
                  <span className="font-mono text-text-primary">{buildings.length}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-text-tertiary">Annual Hours</span>
                  <span className="font-mono text-text-primary">{grandTotalHours.toFixed(0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-text-tertiary">FTEs</span>
                  <span className="font-mono text-text-primary">{totalFTEs.toFixed(1)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-text-tertiary">Labor</span>
                  <span className="font-mono text-text-primary">${grandTotalLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-text-tertiary">Materials</span>
                  <span className="font-mono text-text-primary">${grandTotalMaterials.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Monthly</span>
                  <span className="font-mono text-text-primary">${(grandTotal / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Per-building breakdown */}
              {buildingSummaries.length > 0 && (
                <div className="border-t border-border-subtle pt-3">
                  <h4 className="text-xs font-semibold text-text-secondary mb-2">By Building</h4>
                  {buildingSummaries.map((b) => (
                    <div key={b.id} className="flex justify-between text-xs mb-1">
                      <span className="text-text-tertiary truncate mr-2">{b.name}</span>
                      <span className="font-mono text-text-secondary">${b.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary w-full justify-center mt-3"
                onClick={handleSave}
                disabled={buildings.length === 0}
              >
                <Save className="w-4 h-4" />
                Save Proposal
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
