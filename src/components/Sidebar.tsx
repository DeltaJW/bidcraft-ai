import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
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
  Sparkles,
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
  Radar,
  MapPin,
  Receipt,
  UserMinus,
  ClipboardCheck,
  PenTool,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/estimate', icon: Zap, label: 'Quick Estimate' },
    ],
  },
  {
    title: 'Setup',
    items: [
      { to: '/company', icon: Building2, label: 'Company Profile' },
      { to: '/clients', icon: Briefcase, label: 'Clients' },
      { to: '/rates', icon: BookOpen, label: 'Rate Library' },
      { to: '/burden', icon: Calculator, label: 'Burden Builder' },
      { to: '/labor', icon: Users, label: 'Labor Categories' },
      { to: '/crew', icon: UserCog, label: 'Crew Scheduler' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/sca', icon: Shield, label: 'SCA Wage Lookup' },
      { to: '/rfp', icon: FileSearch, label: 'RFP Parser' },
      { to: '/bid-decision', icon: Scale, label: 'Bid / No-Bid' },
      { to: '/intel', icon: Eye, label: 'Competitive Intel' },
      { to: '/recompete', icon: Radar, label: 'Recompete Radar' },
      { to: '/ai', icon: Bot, label: 'AI Assistant' },
    ],
  },
  {
    title: 'Proposals',
    items: [
      { to: '/workload', icon: ClipboardList, label: 'Workloading' },
      { to: '/quote', icon: FileText, label: 'Task Order Quote' },
      { to: '/proposal', icon: FileStack, label: 'Full Proposal' },
      { to: '/multi', icon: Building2, label: 'Multi-Building' },
      { to: '/saved', icon: FolderOpen, label: 'Saved Quotes' },
      { to: '/narrative', icon: PenTool, label: 'Narrative Writer' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/optimizer', icon: Target, label: 'Profit Optimizer' },
      { to: '/scenarios', icon: GitCompare, label: 'What-If Scenarios' },
      { to: '/escalation', icon: TrendingUp, label: 'Price Escalation' },
      { to: '/turnover', icon: UserMinus, label: 'Turnover Calculator' },
      { to: '/inspections', icon: ClipboardCheck, label: 'QC Inspections' },
      { to: '/calendar', icon: Calendar, label: 'Contract Calendar' },
      { to: '/pl-tracker', icon: Receipt, label: 'P&L Tracker' },
      { to: '/regional', icon: MapPin, label: 'Regional Cost' },
    ],
  },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  // Auto-expand sections that contain the active page
  const activeSectionIdx = NAV_SECTIONS.findIndex((s) =>
    s.items.some((item) => item.to === location.pathname || (item.to === '/' && location.pathname === '/'))
  )

  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    const initial = new Set<number>([0]) // Always show Dashboard section
    if (activeSectionIdx >= 0) initial.add(activeSectionIdx)
    return initial
  })

  function toggleSection(idx: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <aside className="no-print fixed left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-border-default flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h1 className="text-base font-bold text-text-primary tracking-tight">
            BidCraft <span className="text-accent">AI</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
        {NAV_SECTIONS.map((section, sIdx) => {
          const isExpanded = expandedSections.has(sIdx)
          const hasActiveItem = section.items.some(
            (item) => item.to === location.pathname || (item.to === '/' && location.pathname === '/')
          )

          return (
            <div key={sIdx}>
              {/* Section header (skip for first section — Dashboard/Quick Estimate) */}
              {section.title && (
                <button
                  onClick={() => toggleSection(sIdx)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 mt-2 mb-0.5 text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent border-none ${
                    hasActiveItem ? 'text-accent' : 'text-text-disabled hover:text-text-tertiary'
                  } transition-colors`}
                >
                  {section.title}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}

              {/* Items */}
              {(isExpanded || !section.title) &&
                section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-accent-muted text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </NavLink>
                ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border-default">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              isActive
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
            }`
          }
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
