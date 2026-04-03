import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Calculator } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { laborCategoriesStore, burdenProfilesStore, useStore } from '@/data/mockStore'
import type { LaborCategory } from '@/types'

const DEFAULT_CATEGORIES = [
  { name: 'Janitor', headcount: 1 },
  { name: 'Lead / Foreman', headcount: 1 },
  { name: 'Supervisor', headcount: 1 },
  { name: 'Project Manager', headcount: 1 },
]

export default function LaborCategories() {
  const categories = useStore(laborCategoriesStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const [editing, setEditing] = useState<LaborCategory | null>(null)

  function addCategory(name = 'New Category') {
    const cat: LaborCategory = {
      id: `lc-${Date.now()}`,
      name,
      burdenProfileId: '',
      headcount: 1,
    }
    laborCategoriesStore.update((prev) => [...prev, cat])
    setEditing(cat)
  }

  function updateCategory(id: string, updates: Partial<LaborCategory>) {
    laborCategoriesStore.update((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  function removeCategory(id: string) {
    laborCategoriesStore.update((prev) => prev.filter((c) => c.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  function loadDefaults() {
    const newCats = DEFAULT_CATEGORIES.map((d, i) => ({
      id: `lc-${Date.now()}-${i}`,
      name: d.name,
      burdenProfileId: '',
      headcount: d.headcount,
    }))
    laborCategoriesStore.set(newCats)
    toast('Loaded default labor categories')
  }

  function getBurdenRate(profileId: string): number | null {
    const bp = burdenProfiles.find((p) => p.id === profileId)
    return bp?.computedRate ?? null
  }

  const totalHeadcount = categories.reduce((s, c) => s + c.headcount, 0)
  const blendedRate = categories.length > 0
    ? categories.reduce((sum, c) => {
        const rate = getBurdenRate(c.burdenProfileId)
        return sum + (rate ?? 0) * c.headcount
      }, 0) / (totalHeadcount || 1)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label">Setup</p>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Labor Categories</h1>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button className="btn btn-ghost" onClick={loadDefaults}>
              Load Defaults
            </button>
          )}
          <button className="btn btn-primary" onClick={() => addCategory()}>
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <p className="text-sm text-text-tertiary mb-6">
        Define labor categories for your contracts. Each category links to a burden profile with its own base wage and rates.
        Use these in workloading to calculate costs by role.
      </p>

      {burdenProfiles.length === 0 && (
        <div className="glass p-4 mb-6 text-sm text-warning border-warning/20">
          Create burden profiles first (in Burden Builder) before assigning them to categories.
        </div>
      )}

      {/* Blended rate summary */}
      {categories.length > 0 && (
        <GlassCard variant="brand" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Blended Burdened Rate</h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                Weighted average across {categories.length} categories, {totalHeadcount} total headcount
              </p>
            </div>
            <div className="text-2xl font-bold font-mono text-accent">
              ${blendedRate.toFixed(2)}/hr
            </div>
          </div>
        </GlassCard>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Users className="w-12 h-12 text-text-disabled mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No labor categories defined</h3>
          <p className="text-sm text-text-tertiary mb-1 max-w-md mx-auto">
            Add categories like Janitor, Lead, Supervisor, and Project Manager to price work with different labor rates.
          </p>
          {burdenProfiles.length === 0 && (
            <p className="text-xs text-amber-400/80 mb-4 max-w-md mx-auto">
              You'll need at least one burden profile to assign rates to categories.{' '}
              <Link to="/burden" className="text-accent hover:text-accent-hover no-underline font-medium">
                Build one in Burden Builder →
              </Link>
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button className="btn btn-primary" onClick={loadDefaults}>
              <Plus className="w-4 h-4" />
              Load Default Categories
            </button>
            {burdenProfiles.length === 0 && (
              <Link to="/burden" className="btn btn-ghost no-underline">
                <Calculator className="w-4 h-4" />
                Build Burden Profile
              </Link>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const rate = getBurdenRate(cat.burdenProfileId)
            const profileName = burdenProfiles.find((p) => p.id === cat.burdenProfileId)?.name
            return (
              <GlassCard key={cat.id} className="glass-hover !p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Name */}
                  <div className="col-span-3">
                    <label className="label">Category Name</label>
                    <input
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                      className="!text-sm"
                    />
                  </div>

                  {/* Burden Profile */}
                  <div className="col-span-4">
                    <label className="label">Burden Profile</label>
                    <select
                      value={cat.burdenProfileId}
                      onChange={(e) => updateCategory(cat.id, { burdenProfileId: e.target.value })}
                      className="!text-sm"
                    >
                      <option value="">— Select Profile —</option>
                      {burdenProfiles.map((bp) => (
                        <option key={bp.id} value={bp.id}>
                          {bp.name} (${bp.computedRate?.toFixed(2)}/hr)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Headcount */}
                  <div className="col-span-2">
                    <label className="label">Headcount</label>
                    <input
                      type="number"
                      min="1"
                      value={cat.headcount}
                      onChange={(e) => updateCategory(cat.id, { headcount: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="!text-sm"
                    />
                  </div>

                  {/* Rate display */}
                  <div className="col-span-2 text-right">
                    <label className="label">Burdened Rate</label>
                    <div className="text-lg font-bold font-mono text-accent">
                      {rate ? `$${rate.toFixed(2)}` : '—'}
                    </div>
                    {profileName && (
                      <p className="text-xs text-text-disabled">{profileName}</p>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      className="p-2 text-text-disabled hover:text-error-light transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => removeCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
