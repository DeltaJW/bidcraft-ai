import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, MapPin, Send, FolderOpen, Download } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import HelpTip from '@/components/HelpTip'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from '@/components/Toast'
import { rateLibraryStore, burdenProfilesStore, laborCategoriesStore, workloadDraftStore, templatesStore, useStore } from '@/data/mockStore'
import { downloadCSV } from '@/utils/csv'
import type { Zone, ZoneTask, Frequency } from '@/types'
import { FREQUENCY_ANNUAL_MULTIPLIER, FREQUENCY_LABELS } from '@/types'

const PRODUCTIVE_HOURS_PER_DAY = 6.5
const WORK_DAYS_PER_YEAR = 260

export default function Workloading() {
  const navigate = useNavigate()
  const library = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const laborCategories = useStore(laborCategoriesStore)
  const templates = useStore(templatesStore)
  const [buildingName, setBuildingName] = useState('')
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)

  // Get the effective burdened rate for a task: category override > page-level default
  function getTaskBurdenRate(task: ZoneTask): number | null {
    if (task.laborCategoryId) {
      const cat = laborCategories.find((c) => c.id === task.laborCategoryId)
      if (cat?.burdenProfileId) {
        const bp = burdenProfiles.find((b) => b.id === cat.burdenProfileId)
        if (bp?.computedRate) return bp.computedRate
      }
    }
    return selectedBurden?.computedRate ?? null
  }

  function addZone() {
    setZones((prev) => [
      ...prev,
      { id: `zone-${Date.now()}`, name: `Zone ${prev.length + 1}`, tasks: [] },
    ])
  }

  function removeZone(zoneId: string) {
    setZones((prev) => prev.filter((z) => z.id !== zoneId))
  }

  function updateZoneName(zoneId: string, name: string) {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, name } : z)))
  }

  function addTaskToZone(zoneId: string) {
    const firstRate = library.rates[0]
    if (!firstRate) return
    const newTask: ZoneTask = {
      id: `zt-${Date.now()}`,
      rateItemId: firstRate.id,
      taskName: firstRate.task,
      sqft: 0,
      frequency: '5x_week',
      equipment: firstRate.equipment,
      sqftPerHour: firstRate.sqftPerHour,
    }
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId ? { ...z, tasks: [...z.tasks, newTask] } : z
      )
    )
  }

  function updateTask(zoneId: string, taskId: string, updates: Partial<ZoneTask>) {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              tasks: z.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
            }
          : z
      )
    )
  }

  function removeTask(zoneId: string, taskId: string) {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, tasks: z.tasks.filter((t) => t.id !== taskId) }
          : z
      )
    )
  }

  function handleRateChange(zoneId: string, taskId: string, rateId: string) {
    const rate = library.rates.find((r) => r.id === rateId)
    if (!rate) return
    updateTask(zoneId, taskId, {
      rateItemId: rateId,
      taskName: rate.task,
      equipment: rate.equipment,
      sqftPerHour: rate.sqftPerHour,
    })
  }

  // Templates
  function saveAsTemplate() {
    if (zones.length === 0) return
    templatesStore.update((prev) => [
      ...prev,
      {
        id: `tmpl-${Date.now()}`,
        name: buildingName || `Template ${prev.length + 1}`,
        description: `${zones.length} zones, ${zones.reduce((s, z) => s + z.tasks.length, 0)} tasks`,
        zones: zones.map((z) => ({
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
    toast('Building template saved')
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }

  function loadTemplate(templateId: string) {
    const tmpl = templates.find((t) => t.id === templateId)
    if (!tmpl) return
    setBuildingName(tmpl.name)
    setZones(
      tmpl.zones.map((z) => ({
        ...z,
        id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tasks: z.tasks.map((t) => ({
          ...t,
          id: `zt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      }))
    )
    setShowTemplates(false)
  }

  function deleteTemplate(templateId: string) {
    templatesStore.update((prev) => prev.filter((t) => t.id !== templateId))
  }

  // Calculations
  function taskAnnualHours(t: ZoneTask): number {
    if (t.sqftPerHour <= 0 || t.sqft <= 0) return 0
    const hoursPerOccurrence = t.sqft / t.sqftPerHour
    return hoursPerOccurrence * FREQUENCY_ANNUAL_MULTIPLIER[t.frequency]
  }

  function handleExportWorkloadCSV() {
    const headers = ['Zone', 'Task', 'Equipment', 'Sq Ft', 'Frequency', 'Rate', 'Labor Category', 'Annual Hours', 'Annual Cost']
    const rows: (string | number)[][] = []
    zones.forEach((z) => {
      z.tasks.forEach((t) => {
        const annHrs = taskAnnualHours(t)
        const burdenRate = getTaskBurdenRate(t)
        const annCost = burdenRate ? annHrs * burdenRate : 0
        const catName = t.laborCategoryId
          ? laborCategories.find((c) => c.id === t.laborCategoryId)?.name ?? ''
          : '(Default)'
        rows.push([
          z.name,
          t.taskName,
          t.equipment,
          t.sqft,
          FREQUENCY_LABELS[t.frequency],
          t.sqftPerHour,
          catName,
          Number(annHrs.toFixed(1)),
          Number(annCost.toFixed(2)),
        ])
      })
    })
    const name = buildingName.trim() || 'workload'
    downloadCSV(`bidcraft-${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast('Workload exported as CSV')
  }

  const allTasks = zones.flatMap((z) => z.tasks)
  const totalAnnualHours = allTasks.reduce((sum, t) => sum + taskAnnualHours(t), 0)
  const totalMonthlyHours = totalAnnualHours / 12
  const totalWeeklyHours = totalAnnualHours / 52
  const totalDailyHours = totalAnnualHours / WORK_DAYS_PER_YEAR
  const fteCount = totalAnnualHours / (PRODUCTIVE_HOURS_PER_DAY * WORK_DAYS_PER_YEAR)

  // Per-task cost calculation: each task uses its own category rate or falls back to page default
  const taskCosts = allTasks.map((t) => {
    const hrs = taskAnnualHours(t)
    const rate = getTaskBurdenRate(t)
    return { task: t, hours: hrs, rate, cost: rate ? hrs * rate : null }
  })
  const hasCostData = taskCosts.some((tc) => tc.cost !== null)
  const annualLaborCost = hasCostData
    ? taskCosts.reduce((sum, tc) => sum + (tc.cost ?? 0), 0)
    : null
  const blendedEffectiveRate = annualLaborCost !== null && totalAnnualHours > 0
    ? annualLaborCost / totalAnnualHours
    : null

  // Cost breakdown by labor category
  type CategoryBreakdown = { id: string; name: string; hours: number; cost: number }
  const categoryBreakdownMap = new Map<string, CategoryBreakdown>()
  if (hasCostData) {
    for (const tc of taskCosts) {
      const catId = tc.task.laborCategoryId || '__default__'
      const catName = tc.task.laborCategoryId
        ? laborCategories.find((c) => c.id === tc.task.laborCategoryId)?.name ?? 'Unknown'
        : '(Default)'
      const existing = categoryBreakdownMap.get(catId)
      if (existing) {
        existing.hours += tc.hours
        existing.cost += tc.cost ?? 0
      } else {
        categoryBreakdownMap.set(catId, { id: catId, name: catName, hours: tc.hours, cost: tc.cost ?? 0 })
      }
    }
  }
  const categoryBreakdown = Array.from(categoryBreakdownMap.values()).filter((cb) => cb.hours > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">Calculator</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Workloading</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.length > 0 && (
            <button className="btn btn-ghost" onClick={() => setShowTemplates(!showTemplates)}>
              <FolderOpen className="w-4 h-4" />
              Templates
            </button>
          )}
          {zones.length > 0 && (
            <button className="btn btn-ghost" onClick={saveAsTemplate}>
              <Download className="w-4 h-4" />
              {templateSaved ? 'Saved!' : 'Save Template'}
            </button>
          )}
          <button className="btn btn-primary" onClick={addZone}>
            <Plus className="w-4 h-4" />
            Add Zone
          </button>
        </div>
      </div>

      {/* Template picker */}
      {showTemplates && templates.length > 0 && (
        <div className="mb-6 glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Load from Template</h3>
            <button
              className="text-xs text-text-tertiary hover:text-text-secondary bg-transparent border-none cursor-pointer"
              onClick={() => setShowTemplates(false)}
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="glass glass-hover p-3 cursor-pointer group relative"
                onClick={() => loadTemplate(tmpl.id)}
              >
                <h4 className="text-sm font-medium text-text-primary">{tmpl.name}</h4>
                <p className="text-xs text-text-tertiary mt-0.5">{tmpl.description}</p>
                <p className="text-xs text-text-disabled mt-1">
                  {new Date(tmpl.createdAt).toLocaleDateString()}
                </p>
                <button
                  className="absolute top-2 right-2 p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); setDeleteTemplateId(tmpl.id) }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Building info row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            placeholder="Building name (e.g. Federal Building 101)"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
          />
        </div>
        <div className="sm:w-72">
          <select
            value={selectedBurdenId}
            onChange={(e) => setSelectedBurdenId(e.target.value)}
          >
            <option value="">— Select Burden Profile —</option>
            {burdenProfiles.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name} (${bp.computedRate?.toFixed(2)}/hr)
              </option>
            ))}
          </select>
        </div>
      </div>

      {burdenProfiles.length === 0 && (
        <div className="glass p-4 mb-6 text-sm text-amber-400/80 border-amber-500/20">
          No burden profiles yet. Build one in the Burden Builder first to see labor costs.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Zones */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {zones.length === 0 && (
            <GlassCard className="text-center py-12">
              <MapPin className="w-12 h-12 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Build Your Workload</h3>
              <p className="text-text-tertiary text-sm mb-4 max-w-md mx-auto">
                Define zones (lobbies, offices, restrooms) and assign cleaning tasks with square footage and frequency to calculate labor hours.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button className="btn btn-primary" onClick={addZone}>
                  <Plus className="w-4 h-4" />
                  Add Zone
                </button>
                {templates.length > 0 && (
                  <button className="btn btn-ghost" onClick={() => setShowTemplates(true)}>
                    <FolderOpen className="w-4 h-4" />
                    Load a Template
                  </button>
                )}
              </div>
            </GlassCard>
          )}

          {zones.map((zone) => (
            <GlassCard key={zone.id} className="!p-0 overflow-hidden">
              {/* Zone header */}
              <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                <input
                  className="!bg-transparent !border-none !p-0 !text-text-primary !font-semibold !text-sm !w-auto"
                  value={zone.name}
                  onChange={(e) => updateZoneName(zone.id, e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost !py-1 !px-2 !text-xs" onClick={() => addTaskToZone(zone.id)}>
                    <Plus className="w-3 h-3" /> Task
                  </button>
                  <button
                    className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                    onClick={() => removeZone(zone.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {zone.tasks.length === 0 ? (
                <div className="p-6 text-center text-text-tertiary text-sm">
                  No tasks — click "+ Task" to add cleaning tasks to this zone
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-tertiary">
                      <th className="text-left px-4 py-2 font-medium">Task</th>
                      <th className="text-right px-4 py-2 font-medium w-28">Sq Ft / Qty</th>
                      <th className="text-left px-4 py-2 font-medium w-44">Frequency</th>
                      {laborCategories.length > 0 && (
                        <th className="text-left px-4 py-2 font-medium w-36">Labor Cat.</th>
                      )}
                      <th className="text-right px-4 py-2 font-medium w-24">Rate</th>
                      <th className="text-right px-4 py-2 font-medium w-24">Hrs/Year</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {zone.tasks.map((task) => {
                      const annHrs = taskAnnualHours(task)
                      return (
                        <tr key={task.id} className="border-t border-border-subtle">
                          <td className="px-4 py-2">
                            <select
                              value={task.rateItemId}
                              onChange={(e) => handleRateChange(zone.id, task.id, e.target.value)}
                              className="!text-xs"
                            >
                              {library.rates.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.task} — {r.equipment}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              className="!text-right !text-xs"
                              value={task.sqft || ''}
                              onChange={(e) =>
                                updateTask(zone.id, task.id, { sqft: Number(e.target.value) })
                              }
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={task.frequency}
                              onChange={(e) =>
                                updateTask(zone.id, task.id, {
                                  frequency: e.target.value as Frequency,
                                })
                              }
                              className="!text-xs"
                            >
                              {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </td>
                          {laborCategories.length > 0 && (
                            <td className="px-4 py-2">
                              <select
                                value={task.laborCategoryId || ''}
                                onChange={(e) =>
                                  updateTask(zone.id, task.id, {
                                    laborCategoryId: e.target.value || undefined,
                                  })
                                }
                                className="!text-xs"
                              >
                                <option value="">Default</option>
                                {laborCategories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="px-4 py-2 text-right font-mono text-xs text-text-tertiary">
                            {task.sqftPerHour < 100
                              ? `${task.sqftPerHour}/hr`
                              : `${(task.sqftPerHour / 1000).toFixed(1)}K/hr`}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs text-accent">
                            {annHrs.toFixed(1)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                              onClick={() => removeTask(zone.id, task.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Right: Summary — command center panel */}
        <div>
          <div className="stat-card sticky top-8">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-accent">Hours Summary</p>
              {totalAnnualHours > 0 && (
                <button
                  className="p-1 text-text-disabled hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                  onClick={handleExportWorkloadCSV}
                  title="Export as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col gap-2 text-[12px]">
              <SummaryRow label="Annual Hours" value={`${totalAnnualHours.toFixed(1)}`} bold />
              <SummaryRow label="Monthly Hours" value={`${totalMonthlyHours.toFixed(1)}`} />
              <SummaryRow label="Weekly Hours" value={`${totalWeeklyHours.toFixed(1)}`} />
              <SummaryRow label="Daily Hours" value={`${totalDailyHours.toFixed(1)}`} />
              <div className="separator-gradient my-1" />
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium text-[12px]">FTEs Needed <HelpTip text="Full-Time Equivalent = Annual Hours / (Productive Hours/Day x Work Days/Year). Example: 3,380 hrs / (6.5 x 260) = 2.0 FTEs" /></span>
                <span className="font-mono text-text-primary font-semibold">{fteCount.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-text-disabled">
                Based on {PRODUCTIVE_HOURS_PER_DAY} productive hrs/day <HelpTip text="Industry standard is 6.5 productive hours per 8-hour shift. Accounts for travel between zones, breaks, restocking supplies, and supervisor check-ins." />, {WORK_DAYS_PER_YEAR} work days/yr
              </p>
            </div>

            {annualLaborCost !== null && (
              <div className="px-4 py-3 bg-brand-navy/20 border-t border-accent/20">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Annual Labor</span>
                  <span className="text-2xl font-bold text-accent font-mono tracking-tight">
                    ${annualLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-text-disabled">Monthly</span>
                  <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                    ${(annualLaborCost / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {blendedEffectiveRate !== null && (
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-text-disabled">Blended Rate</span>
                    <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                      ${blendedEffectiveRate.toFixed(2)}/hr
                    </span>
                  </div>
                )}
              </div>
            )}

            {categoryBreakdown.length > 1 && (
              <div className="px-4 py-3 border-t border-border-subtle">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-text-disabled mb-2">By Labor Category</p>
                <div className="flex flex-col gap-1.5">
                  {categoryBreakdown.map((cb) => (
                    <div key={cb.id} className="flex justify-between text-[11px]">
                      <span className="text-text-disabled truncate mr-2">{cb.name}</span>
                      <span className="font-mono text-text-secondary whitespace-nowrap tabular-nums">
                        {cb.hours.toFixed(0)} hrs · ${cb.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalAnnualHours > 0 && (
              <div className="px-4 py-3 border-t border-border-subtle">
                <button
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-md bg-brand-navy text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-navy-light transition-colors"
                  onClick={() => {
                    workloadDraftStore.set({
                      buildingName,
                      zones: zones.map((z) => ({
                        name: z.name,
                        tasks: z.tasks.map((t) => ({
                          taskName: t.taskName,
                          equipment: t.equipment,
                          sqft: t.sqft,
                          sqftPerHour: t.sqftPerHour,
                          frequency: t.frequency,
                          annualHours: taskAnnualHours(t),
                          laborCategoryId: t.laborCategoryId,
                        })),
                      })),
                      totalAnnualHours,
                      burdenProfileId: selectedBurdenId,
                    })
                    navigate('/proposal')
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send to Proposal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteTemplateId !== null}
        title="Delete Template"
        message="This will permanently remove this building template. This cannot be undone."
        confirmLabel="Delete Template"
        onConfirm={() => {
          if (deleteTemplateId) deleteTemplate(deleteTemplateId)
          setDeleteTemplateId(null)
        }}
        onCancel={() => setDeleteTemplateId(null)}
      />
    </motion.div>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? 'text-text-secondary font-medium' : 'text-text-disabled'}`}>{label}</span>
      <span className={`font-mono tabular-nums ${bold ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
        {value}
      </span>
    </div>
  )
}
