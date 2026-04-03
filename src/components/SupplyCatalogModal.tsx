import { useState, useMemo } from 'react'
import { Search, X, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { suppliesStore, useStore } from '@/data/mockStore'
import { SUPPLY_CATEGORIES } from '@/data/defaultSupplies'
import type { SupplyItem } from '@/data/defaultSupplies'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: SupplyItem) => void
}

export default function SupplyCatalogModal({ open, onClose, onSelect }: Props) {
  const supplies = useStore(suppliesStore)
  const [search, setSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(SUPPLY_CATEGORIES)
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return supplies
    const terms = search.toLowerCase().split(/\s+/)
    return supplies.filter((s) => {
      const haystack = `${s.name} ${s.category} ${s.notes}`.toLowerCase()
      return terms.every((t) => haystack.includes(t))
    })
  }, [supplies, search])

  const grouped = useMemo(() => {
    const map = new Map<string, SupplyItem[]>()
    for (const cat of SUPPLY_CATEGORIES) {
      const items = filtered.filter((s) => s.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filtered])

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function handleSelect(item: SupplyItem) {
    onSelect(item)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative glass w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Supply Catalog</h2>
            <span className="text-xs text-text-tertiary ml-1">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* search */}
        <div className="px-5 py-3 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
            <input
              autoFocus
              type="text"
              placeholder="Search supplies... (e.g. floor finish, liners, gloves)"
              className="!pl-10 !text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {grouped.size === 0 ? (
            <div className="text-center py-10 text-text-tertiary text-sm">
              No supplies match "{search}"
            </div>
          ) : (
            Array.from(grouped.entries()).map(([cat, items]) => {
              const expanded = expandedCats.has(cat)
              return (
                <div key={cat} className="mb-2">
                  <button
                    className="flex items-center gap-2 w-full text-left py-2 px-1 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
                    onClick={() => toggleCat(cat)}
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-text-disabled" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-disabled" />
                    )}
                    {cat}
                    <span className="text-xs text-text-disabled font-normal">
                      ({items.length})
                    </span>
                  </button>
                  {expanded && (
                    <div className="ml-6 flex flex-col">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-surface-2 transition-colors bg-transparent border-none cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-text-disabled truncate">
                              {item.notes}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-text-tertiary">{item.unit}</span>
                            <span className="font-mono text-sm text-accent font-medium w-16 text-right">
                              ${item.unitCost.toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-border-subtle flex justify-between items-center">
          <span className="text-xs text-text-disabled">
            Click a supply to add it to your materials
          </span>
          <button className="btn btn-ghost !text-xs" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
