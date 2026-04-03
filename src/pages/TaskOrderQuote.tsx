import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Trash2, Printer, DollarSign, Save, Download } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import QuotePreview from '@/components/QuotePreview'
import { rateLibraryStore, burdenProfilesStore, companyStore, quotesStore, useStore } from '@/data/mockStore'
import type { QuoteTask, MaterialItem, Quote } from '@/types'

export default function TaskOrderQuote() {
  const library = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const company = useStore(companyStore)

  const [title, setTitle] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [location, setLocation] = useState('')
  const [scopeDescription, setScopeDescription] = useState('')
  const [selectedBurdenId, setSelectedBurdenId] = useState('')
  const [tasks, setTasks] = useState<QuoteTask[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const selectedBurden = burdenProfiles.find((b) => b.id === selectedBurdenId)
  const burdenRate = selectedBurden?.computedRate ?? 0

  function addTask() {
    const first = library.rates[0]
    const newTask: QuoteTask = {
      id: `qt-${Date.now()}`,
      rateItemId: first.id,
      taskName: first.task,
      equipment: first.equipment,
      sqft: 0,
      sqftPerHour: first.sqftPerHour,
      hours: 0,
      laborCost: 0,
    }
    setTasks((prev) => [...prev, newTask])
  }

  function updateTaskField(id: string, updates: Partial<QuoteTask>) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const merged = { ...t, ...updates }
        // Recalculate hours and cost
        if (merged.sqftPerHour > 0 && merged.sqft > 0) {
          merged.hours = merged.sqft / merged.sqftPerHour
          merged.laborCost = merged.hours * burdenRate
        }
        return merged
      })
    )
  }

  function handleRateSelect(taskId: string, rateId: string) {
    const rate = library.rates.find((r) => r.id === rateId)
    if (!rate) return
    updateTaskField(taskId, {
      rateItemId: rateId,
      taskName: rate.task,
      equipment: rate.equipment,
      sqftPerHour: rate.sqftPerHour,
    })
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { id: `mat-${Date.now()}`, name: '', unitCost: 0, quantity: 1, unit: 'ea' },
    ])
  }

  function updateMaterial(id: string, updates: Partial<MaterialItem>) {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  function removeMaterial(id: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  // Totals
  const totalHours = tasks.reduce((s, t) => s + t.hours, 0)
  const totalLabor = tasks.reduce((s, t) => s + t.laborCost, 0)
  const totalMaterials = materials.reduce((s, m) => s + m.unitCost * m.quantity, 0)
  const grandTotal = totalLabor + totalMaterials

  function handleSave() {
    if (tasks.length === 0) {
      toast('Add at least one task before saving', 'error')
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
      quoteType: 'task_order',
      title: title || 'Untitled Task Order',
      contractRef,
      location,
      scopeDescription,
      tasks,
      materials,
      assumptions: [],
      totalHours,
      totalLabor,
      totalMaterials,
      grandTotal,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    quotesStore.update((prev) => [...prev, quote])
    toast('Task order quote saved')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handlePrint() {
    setShowPreview(true)
    setTimeout(() => window.print(), 300)
  }

  async function handlePDF() {
    setShowPreview(true)
    // Wait for render
    await new Promise(r => setTimeout(r, 300))
    if (printRef.current) {
      const { downloadPDF } = await import('@/utils/pdf')
      await downloadPDF(printRef.current, `${title || 'Task-Order-Quote'}.pdf`)
    }
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
        </div>
        <QuotePreview
          ref={printRef}
          company={company}
          title={title}
          contractRef={contractRef}
          location={location}
          scopeDescription={scopeDescription}
          tasks={tasks}
          materials={materials}
          totalHours={totalHours}
          totalLabor={totalLabor}
          totalMaterials={totalMaterials}
          grandTotal={grandTotal}
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
          <h1 className="text-2xl font-bold text-text-primary">Task Order Quote</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={handleSave} disabled={tasks.length === 0}>
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={tasks.length === 0}
          >
            <Printer className="w-4 h-4" />
            Preview & Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Quote info */}
          <GlassCard title="Quote Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-tertiary mb-1">Quote Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency Floor Strip & Refinish — Bldg 101"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Contract / PO Reference</label>
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
                  placeholder="Federal Building, 123 Main St"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-tertiary mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  placeholder="Brief description of the work to be performed..."
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
            </div>
          </GlassCard>

          {/* Tasks */}
          <GlassCard
            title="Labor Tasks"
            subtitle="Select tasks and enter square footage or quantity"
          >
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary text-sm">
                No tasks added yet
              </div>
            ) : (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-text-tertiary">
                    <th className="text-left px-2 py-2 font-medium">Task</th>
                    <th className="text-right px-2 py-2 font-medium w-24">Sq Ft / Qty</th>
                    <th className="text-right px-2 py-2 font-medium w-20">Rate</th>
                    <th className="text-right px-2 py-2 font-medium w-16">Hours</th>
                    <th className="text-right px-2 py-2 font-medium w-20">Cost</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t border-border-subtle">
                      <td className="px-2 py-2">
                        <select
                          value={task.rateItemId ?? ''}
                          onChange={(e) => handleRateSelect(task.id, e.target.value)}
                          className="!text-xs"
                        >
                          {library.rates.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.task} — {r.equipment}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          className="!text-right !text-xs"
                          value={task.sqft || ''}
                          onChange={(e) =>
                            updateTaskField(task.id, { sqft: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-text-tertiary">
                        {task.sqftPerHour < 100
                          ? `${task.sqftPerHour}/hr`
                          : `${(task.sqftPerHour / 1000).toFixed(1)}K/hr`}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-text-secondary">
                        {task.hours.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-accent">
                        ${task.laborCost.toFixed(2)}
                      </td>
                      <td className="px-1 py-2">
                        <button
                          className="p-1 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                          onClick={() => removeTask(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="btn btn-ghost !text-xs" onClick={addTask}>
              <Plus className="w-3 h-3" /> Add Task
            </button>
          </GlassCard>

          {/* Materials */}
          <GlassCard title="Materials" subtitle="Optional — add supply costs">
            {materials.length > 0 && (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-text-tertiary">
                    <th className="text-left px-2 py-2 font-medium">Item</th>
                    <th className="text-right px-2 py-2 font-medium w-20">Unit Cost</th>
                    <th className="text-right px-2 py-2 font-medium w-16">Qty</th>
                    <th className="text-left px-2 py-2 font-medium w-16">Unit</th>
                    <th className="text-right px-2 py-2 font-medium w-20">Total</th>
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
                          placeholder="Floor finish, stripper, etc."
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="!text-right !text-xs"
                          value={m.unitCost || ''}
                          onChange={(e) =>
                            updateMaterial(m.id, { unitCost: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          className="!text-right !text-xs"
                          value={m.quantity || ''}
                          onChange={(e) =>
                            updateMaterial(m.id, { quantity: Number(e.target.value) })
                          }
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
        </div>

        {/* Right: Cost summary */}
        <div>
          <GlassCard title="Cost Summary" className="sticky top-8">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Total Hours</span>
                <span className="font-mono text-text-secondary">{totalHours.toFixed(2)}</span>
              </div>
              {burdenRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Burden Rate</span>
                  <span className="font-mono text-text-secondary">${burdenRate.toFixed(2)}/hr</span>
                </div>
              )}
              <div className="border-t border-border-subtle my-1" />
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Labor</span>
                <span className="font-mono text-text-primary font-medium">${totalLabor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Materials</span>
                <span className="font-mono text-text-primary font-medium">${totalMaterials.toFixed(2)}</span>
              </div>
              <div className="border-t border-border-subtle my-1" />
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Grand Total
                </span>
                <span className="text-xl font-bold text-accent font-mono">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
