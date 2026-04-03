import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { rateLibraryStore, useStore } from '@/data/mockStore'
import { RATE_CATEGORIES } from '@/data/defaultRates'
import type { RateItem } from '@/types'

export default function RateLibrary() {
  const library = useStore(rateLibraryStore)
  const [search, setSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(RATE_CATEGORIES))
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = library.rates.filter(
    (r) =>
      r.task.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  )

  const byCategory = RATE_CATEGORIES.reduce(
    (acc, cat) => {
      const items = filtered.filter((r) => r.category === cat)
      if (items.length > 0) acc[cat] = items
      return acc
    },
    {} as Record<string, RateItem[]>
  )

  // Also include custom categories not in defaults
  const customCats = [...new Set(filtered.map((r) => r.category))].filter(
    (c) => !RATE_CATEGORIES.includes(c)
  )
  customCats.forEach((cat) => {
    byCategory[cat] = filtered.filter((r) => r.category === cat)
  })

  function toggleCategory(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function updateRate(id: string, field: keyof RateItem, value: string | number) {
    rateLibraryStore.update((lib) => ({
      ...lib,
      rates: lib.rates.map((r) =>
        r.id === id ? { ...r, [field]: value, isCustom: true } : r
      ),
    }))
  }

  function deleteRate(id: string) {
    rateLibraryStore.update((lib) => ({
      ...lib,
      rates: lib.rates.filter((r) => r.id !== id),
    }))
  }

  function addCustomRate() {
    const newRate: RateItem = {
      id: `custom-${Date.now()}`,
      category: 'Other Tasks',
      task: 'New Custom Task',
      equipment: 'Standard',
      method: 'Manual',
      sqftPerHour: 1000,
      overheadMultiplier: 1.0,
      isCustom: true,
    }
    rateLibraryStore.update((lib) => ({
      ...lib,
      rates: [...lib.rates, newRate],
    }))
    setEditingId(newRate.id)
  }

  function formatRate(r: RateItem): string {
    // Restrooms and per-unit items have low sqft values — show as "units/hr"
    if (r.sqftPerHour < 100) return `${r.sqftPerHour} units/hr`
    if (r.sqftPerHour >= 10000) return `${(r.sqftPerHour / 1000).toFixed(0)}K sf/hr`
    return `${r.sqftPerHour.toLocaleString()} sf/hr`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-white">Rate Library</h1>
        </div>
        <button className="btn btn-primary" onClick={addCustomRate}>
          <Plus className="w-4 h-4" />
          Add Custom Rate
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
        <input
          className="pl-10"
          placeholder="Search tasks, equipment, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-xs text-navy-500 mb-4">
        Industry-standard field-validated cleaning production rates. All rates are editable.
      </p>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        {Object.entries(byCategory).map(([cat, rates]) => (
          <GlassCard key={cat} className="!p-0 overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-navy-800/30 transition-colors cursor-pointer border-none bg-transparent text-white"
            >
              <div className="flex items-center gap-2">
                {expandedCats.has(cat) ? (
                  <ChevronDown className="w-4 h-4 text-navy-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-navy-400" />
                )}
                <span className="font-semibold text-sm">{cat}</span>
                <span className="text-xs text-navy-500 ml-2">{rates.length} rates</span>
              </div>
            </button>

            {/* Rates table */}
            <AnimatePresence>
              {expandedCats.has(cat) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-navy-700/30 text-xs text-navy-500">
                        <th className="text-left px-4 py-2 font-medium">Task</th>
                        <th className="text-left px-4 py-2 font-medium">Equipment</th>
                        <th className="text-left px-4 py-2 font-medium">Method</th>
                        <th className="text-right px-4 py-2 font-medium">Production Rate</th>
                        <th className="text-right px-4 py-2 font-medium w-16">OH</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((r) => (
                        <tr
                          key={r.id}
                          className={`border-t border-navy-700/20 hover:bg-navy-800/20 transition-colors ${
                            r.isCustom ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="px-4 py-2">
                            {editingId === r.id ? (
                              <input
                                className="!p-1 !text-xs"
                                value={r.task}
                                onChange={(e) => updateRate(r.id, 'task', e.target.value)}
                                onBlur={() => setEditingId(null)}
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-accent transition-colors"
                                onClick={() => setEditingId(r.id)}
                              >
                                {r.task}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-navy-300">{r.equipment}</td>
                          <td className="px-4 py-2 text-navy-400">{r.method}</td>
                          <td className="px-4 py-2 text-right font-mono text-accent">
                            {editingId === r.id ? (
                              <input
                                type="number"
                                className="!p-1 !text-xs !text-right !w-24 ml-auto"
                                value={r.sqftPerHour}
                                onChange={(e) =>
                                  updateRate(r.id, 'sqftPerHour', Number(e.target.value))
                                }
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-white transition-colors"
                                onClick={() => setEditingId(r.id)}
                              >
                                {formatRate(r)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-navy-400 font-mono text-xs">
                            {r.overheadMultiplier > 1
                              ? `${((r.overheadMultiplier - 1) * 100).toFixed(0)}%`
                              : '—'}
                          </td>
                          <td className="px-2 py-2">
                            {r.isCustom && (
                              <button
                                onClick={() => deleteRate(r.id)}
                                className="p-1 text-navy-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  )
}
