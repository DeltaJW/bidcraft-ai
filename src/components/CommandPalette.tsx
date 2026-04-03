import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Building2,
  Briefcase,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  FolderOpen,
  FileStack,
  Settings,
  Bot,
  Shield,
  BarChart3,
  Calendar,
  FileSearch,
  Users,
  Zap,
  Target,
  GitCompare,
  TrendingUp,
  UserCog,
  Scale,
  Eye,
  UserMinus,
  ClipboardCheck,
  Plus,
  Download,
  Moon,
  Sun,
  Database,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react'
import { quotesStore, themeStore, useStore } from '@/data/mockStore'
import { loadDemoData } from '@/data/demoData'
import { toast } from '@/components/Toast'
import {
  companyStore,
  rateLibraryStore,
  burdenProfilesStore,
  templatesStore,
} from '@/data/mockStore'

// ---------- Types ----------

interface CommandItem {
  id: string
  label: string
  category: 'Navigate' | 'Actions' | 'Quotes'
  icon: LucideIcon
  keywords?: string
  action: () => void
}

// ---------- Fuzzy match ----------

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

// ---------- Backup export (same logic as Settings.tsx) ----------

function handleExportBackup() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'BidCraft AI',
    company: companyStore.get(),
    rateLibrary: rateLibraryStore.get(),
    burdenProfiles: burdenProfilesStore.get(),
    quotes: quotesStore.get(),
    templates: templatesStore.get(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bidcraft-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Backup exported successfully')
}

// ---------- Navigation items (mirrors Sidebar) ----------

interface NavDef {
  path: string
  icon: LucideIcon
  label: string
  keywords?: string
}

const NAV_ITEMS: NavDef[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', keywords: 'home overview' },
  { path: '/estimate', icon: Zap, label: 'Quick Estimate', keywords: 'fast calculator' },
  { path: '/company', icon: Building2, label: 'Company Profile', keywords: 'organization setup' },
  { path: '/clients', icon: Briefcase, label: 'Clients', keywords: 'customers accounts' },
  { path: '/rates', icon: BookOpen, label: 'Rate Library', keywords: 'production cleaning rates' },
  { path: '/burden', icon: Calculator, label: 'Burden Builder', keywords: 'labor cost overhead' },
  { path: '/labor', icon: Users, label: 'Labor Categories', keywords: 'workers employees' },
  { path: '/crew', icon: UserCog, label: 'Crew Scheduler', keywords: 'staff scheduling' },
  { path: '/sca', icon: Shield, label: 'SCA Wage Lookup', keywords: 'service contract act prevailing' },
  { path: '/rfp', icon: FileSearch, label: 'RFP Parser', keywords: 'solicitation parse requirements' },
  { path: '/bid-decision', icon: Scale, label: 'Bid / No-Bid', keywords: 'go decision evaluate' },
  { path: '/intel', icon: Eye, label: 'Competitive Intel', keywords: 'intelligence competitors' },
  { path: '/ai', icon: Bot, label: 'AI Assistant', keywords: 'chat help' },
  { path: '/workload', icon: ClipboardList, label: 'Workloading', keywords: 'zone task frequency' },
  { path: '/quote', icon: FileText, label: 'Task Order Quote', keywords: 'pricing task order' },
  { path: '/proposal', icon: FileStack, label: 'Full Proposal', keywords: 'annual contract' },
  { path: '/multi', icon: Building2, label: 'Multi-Building', keywords: 'campus multiple' },
  { path: '/saved', icon: FolderOpen, label: 'Saved Quotes', keywords: 'history list' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', keywords: 'reports charts data' },
  { path: '/optimizer', icon: Target, label: 'Profit Optimizer', keywords: 'margin maximize' },
  { path: '/scenarios', icon: GitCompare, label: 'What-If Scenarios', keywords: 'compare simulate' },
  { path: '/escalation', icon: TrendingUp, label: 'Price Escalation', keywords: 'inflation increase' },
  { path: '/turnover', icon: UserMinus, label: 'Turnover Calculator', keywords: 'attrition retention' },
  { path: '/inspections', icon: ClipboardCheck, label: 'QC Inspections', keywords: 'quality control check' },
  { path: '/calendar', icon: Calendar, label: 'Contract Calendar', keywords: 'dates timeline schedule' },
  { path: '/settings', icon: Settings, label: 'Settings', keywords: 'preferences configuration api' },
]

// ---------- Component ----------

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const quotes = useStore(quotesStore)
  const theme = useStore(themeStore)

  // Build command list
  const allItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = []

    // Navigate
    for (const nav of NAV_ITEMS) {
      items.push({
        id: `nav:${nav.path}`,
        label: nav.label,
        category: 'Navigate',
        icon: nav.icon,
        keywords: nav.keywords,
        action: () => {
          navigate(nav.path)
          onClose()
        },
      })
    }

    // Actions
    items.push({
      id: 'action:new-quote',
      label: 'New Task Order Quote',
      category: 'Actions',
      icon: Plus,
      keywords: 'create new pricing',
      action: () => {
        navigate('/quote')
        onClose()
      },
    })
    items.push({
      id: 'action:new-proposal',
      label: 'New Proposal',
      category: 'Actions',
      icon: Plus,
      keywords: 'create new annual',
      action: () => {
        navigate('/proposal')
        onClose()
      },
    })
    items.push({
      id: 'action:new-burden',
      label: 'New Burden Profile',
      category: 'Actions',
      icon: Plus,
      keywords: 'create new labor cost',
      action: () => {
        navigate('/burden')
        onClose()
      },
    })
    items.push({
      id: 'action:demo-data',
      label: 'Load Demo Data',
      category: 'Actions',
      icon: Database,
      keywords: 'sample seed example',
      action: () => {
        loadDemoData()
        onClose()
      },
    })
    items.push({
      id: 'action:export-backup',
      label: 'Export Backup',
      category: 'Actions',
      icon: Download,
      keywords: 'download json save',
      action: () => {
        handleExportBackup()
        onClose()
      },
    })
    items.push({
      id: 'action:toggle-theme',
      label: `Toggle Theme (currently ${theme})`,
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      keywords: 'dark light mode switch',
      action: () => {
        themeStore.set(theme === 'dark' ? 'light' : 'dark')
        onClose()
      },
    })

    // Saved Quotes
    for (const q of quotes) {
      items.push({
        id: `quote:${q.id}`,
        label: q.title || 'Untitled Quote',
        category: 'Quotes',
        icon: FileText,
        keywords: `${q.contractRef ?? ''} ${q.location ?? ''} ${q.quoteType ?? ''}`,
        action: () => {
          navigate('/saved')
          onClose()
        },
      })
    }

    return items
  }, [navigate, onClose, quotes, theme])

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems
    return allItems.filter((item) => {
      const haystack = `${item.label} ${item.keywords ?? ''}`
      return fuzzyMatch(haystack, query)
    })
  }, [allItems, query])

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = []
    const catOrder: CommandItem['category'][] = ['Actions', 'Navigate', 'Quotes']
    for (const cat of catOrder) {
      const items = filtered.filter((i) => i.category === cat)
      if (items.length > 0) groups.push({ category: cat, items })
    }
    return groups
  }, [filtered])

  // Flat list for keyboard nav
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Focus input after animation
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Clamp active index when results change
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, flatItems.length - 1)))
  }, [flatItems.length])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % Math.max(1, flatItems.length))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length))
          break
        case 'Enter':
          e.preventDefault()
          if (flatItems[activeIndex]) {
            flatItems[activeIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [flatItems, activeIndex, onClose]
  )

  // Detect Mac for keyboard hint
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="w-full max-w-lg mx-4 glass border border-border-default rounded-xl shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                <Search className="w-4 h-4 text-text-tertiary shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActiveIndex(0)
                  }}
                  placeholder="Search commands, pages, quotes..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-disabled"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-text-disabled bg-surface-3 border border-border-subtle">
                  {isMac ? '\u2318' : 'Ctrl'}K
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                {flatItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  grouped.map((group) => {
                    return (
                      <div key={group.category}>
                        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
                          {group.category}
                        </div>
                        {group.items.map((item) => {
                          const idx = flatItems.indexOf(item)
                          const isActive = idx === activeIndex
                          const Icon = item.icon
                          return (
                            <button
                              key={item.id}
                              data-active={isActive}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm cursor-pointer transition-colors border-none ${
                                isActive
                                  ? 'bg-accent-muted text-accent'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
                              }`}
                              onClick={() => item.action()}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="flex-1 truncate">{item.label}</span>
                              {isActive && (
                                <CornerDownLeft className="w-3 h-3 text-text-disabled shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-border-subtle text-[10px] text-text-disabled">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border-subtle font-mono">&uarr;&darr;</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border-subtle font-mono">Enter</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border-subtle font-mono">Esc</kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
