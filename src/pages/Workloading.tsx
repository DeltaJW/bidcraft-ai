import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Plus, Trash2, MapPin, Send, FolderOpen, Download } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { rateLibraryStore, burdenProfilesStore, workloadDraftStore, templatesStore, useStore } from '@/data/mockStore'
import type { Zone, ZoneTask, Frequency } from '@/types'
import { FREQUENCY_ANNUAL_MULTIPLIER, FREQUENCY_LABELS } from '@/types'

const PRODUCTIVE_HOURS_PER_DAY = 6.5
const WORK_DAYS_PER_YEAR = 260

export default function Workloading() {
  const navigate = useNavigate()
  const library = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const templates = useStore(templatesStore)
  const [buildingName, setBuildingName] = useState('')
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)

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

  const allTasks = zones.flatMap((z) => z.tasks)
  const totalAnnualHours = allTasks.reduce((sum, t) => sum + taskAnnualHours(t), 0)
  const totalMonthlyHours = totalAnnualHours / 12
  const totalWeeklyHours = totalAnnualHours / 52
  const totalDailyHours = totalAnnualHours / WORK_DAYS_PER_YEAR
  const fteCount = totalAnnualHours / (PRODUCTIVE_HOURS_PER_DAY * WORK_DAYS_PER_YEAR)
  const annualLaborCost = selectedBurden
    ? totalAnnualHours * selectedBurden.computedRate!
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-white">Workloading Calculator</h1>
        </div>
        <div className="flex gap-2">
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
            <h3 className="text-sm font-semibold text-white">Load from Template</h3>
            <button
              className="text-xs text-navy-500 hover:text-navy-300 bg-transparent border-none cursor-pointer"
              onClick={() => setShowTemplates(false)}
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="glass glass-hover p-3 cursor-pointer group relative"
                onClick={() => loadTemplate(tmpl.id)}
              >
                <h4 className="text-sm font-medium text-white">{tmpl.name}</h4>
                <p className="text-xs text-navy-500 mt-0.5">{tmpl.description}</p>
                <p className="text-xs text-navy-600 mt-1">
                  {new Date(tmpl.createdAt).toLocaleDateString()}
                </p>
                <button
                  className="absolute top-2 right-2 p-1 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deleteTemplate(tmpl.id) }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Building info row */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            placeholder="Building name (e.g. Federal Building 101)"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
          />
        </div>
        <div className="w-72">
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

      <div className="grid grid-cols-4 gap-6">
        {/* Zones */}
        <div className="col-span-3 flex flex-col gap-4">
          {zones.length === 0 && (
            <GlassCard className="text-center py-12">
              <MapPin className="w-8 h-8 text-navy-600 mx-auto mb-3" />
              <p className="text-navy-400">Click "Add Zone" to create building zones</p>
              <p className="text-xs text-navy-600 mt-1">
                Zones represent areas like lobbies, offices, restrooms, etc.
              </p>
            </GlassCard>
          )}

          {zones.map((zone) => (
            <GlassCard key={zone.id} className="!p-0 overflow-hidden">
              {/* Zone header */}
              <div className="flex items-center justify-between p-4 border-b border-navy-700/30">
                <input
                  className="!bg-transparent !border-none !p-0 !text-white !font-semibold !text-sm !w-auto"
                  value={zone.name}
                  onChange={(e) => updateZoneName(zone.id, e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost !py-1 !px-2 !text-xs" onClick={() => addTaskToZone(zone.id)}>
                    <Plus className="w-3 h-3" /> Task
                  </button>
                  <button
                    className="p-1.5 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                    onClick={() => removeZone(zone.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {zone.tasks.length === 0 ? (
                <div className="p-6 text-center text-navy-500 text-sm">
                  No tasks — click "+ Task" to add cleaning tasks to this zone
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-navy-500">
                      <th className="text-left px-4 py-2 font-medium">Task</th>
                      <th className="text-right px-4 py-2 font-medium w-28">Sq Ft / Qty</th>
                      <th className="text-left px-4 py-2 font-medium w-44">Frequency</th>
                      <th className="text-right px-4 py-2 font-medium w-24">Rate</th>
                      <th className="text-right px-4 py-2 font-medium w-24">Hrs/Year</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {zone.tasks.map((task) => {
                      const annHrs = taskAnnualHours(task)
                      return (
                        <tr key={task.id} className="border-t border-navy-700/20">
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
                          <td className="px-4 py-2 text-right font-mono text-xs text-navy-400">
                            {task.sqftPerHour < 100
                              ? `${task.sqftPerHour}/hr`
                              : `${(task.sqftPerHour / 1000).toFixed(1)}K/hr`}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs text-accent">
                            {annHrs.toFixed(1)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              className="p-1 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
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

        {/* Right: Summary */}
        <div>
          <GlassCard title="Hours Summary" className="sticky top-8">
            <div className="flex flex-col gap-3 text-sm">
              <SummaryRow label="Annual Hours" value={`${totalAnnualHours.toFixed(1)}`} bold />
              <SummaryRow label="Monthly Hours" value={`${totalMonthlyHours.toFixed(1)}`} />
              <SummaryRow label="Weekly Hours" value={`${totalWeeklyHours.toFixed(1)}`} />
              <SummaryRow label="Daily Hours" value={`${totalDailyHours.toFixed(1)}`} />
              <div className="border-t border-navy-700/30 my-1" />
              <SummaryRow label="FTEs Needed" value={fteCount.toFixed(2)} bold />
              <p className="text-xs text-navy-500">
                Based on {PRODUCTIVE_HOURS_PER_DAY} productive hrs/day, {WORK_DAYS_PER_YEAR} work days/yr
              </p>

              {annualLaborCost !== null && (
                <>
                  <div className="border-t border-navy-700/30 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-navy-300 font-medium">Annual Labor</span>
                    <span className="text-lg font-bold text-accent font-mono">
                      ${annualLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Monthly</span>
                    <span className="font-mono text-navy-300">
                      ${(annualLaborCost / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </>
              )}

              {totalAnnualHours > 0 && (
                <button
                  className="btn btn-primary w-full mt-3 justify-center"
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
                        })),
                      })),
                      totalAnnualHours,
                      burdenProfileId: selectedBurdenId,
                    })
                    navigate('/proposal')
                  }}
                >
                  <Send className="w-4 h-4" />
                  Send to Proposal
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'text-navy-200 font-medium' : 'text-navy-400'}>{label}</span>
      <span className={`font-mono ${bold ? 'text-white font-medium' : 'text-navy-300'}`}>
        {value}
      </span>
    </div>
  )
}
