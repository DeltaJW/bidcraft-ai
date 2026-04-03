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
  Upload,
  FileOutput,
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
      { to: '/documents', icon: Upload, label: 'Document Hub' },
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
      { to: '/gov-export', icon: FileOutput, label: 'Gov Format Export' },
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

  const activeSectionIdx = NAV_SECTIONS.findIndex((s) =>
    s.items.some((item) => item.to === location.pathname || (item.to === '/' && location.pathname === '/'))
  )

  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    const initial = new Set<number>([0])
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
    <aside className="no-print fixed left-0 top-0 bottom-0 w-60 bg-surface-1 border-r border-border-subtle flex flex-col z-50">
      {/* Logo — BC monogram matching landing page */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-brand-navy flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold font-mono leading-none">BC</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight leading-none">
              BidCraft <span className="text-accent font-normal">AI</span>
            </h1>
            <p className="text-[9px] text-text-disabled tracking-wide uppercase mt-0.5">Bid Pricing Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {NAV_SECTIONS.map((section, sIdx) => {
          const isExpanded = expandedSections.has(sIdx)
          const hasActiveItem = section.items.some(
            (item) => item.to === location.pathname || (item.to === '/' && location.pathname === '/')
          )

          return (
            <div key={sIdx}>
              {/* Section header */}
              {section.title && (
                <>
                  <div className="h-px bg-border-subtle mx-2 mt-2 mb-1" />
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest cursor-pointer bg-transparent border-none ${
                      hasActiveItem ? 'text-accent' : 'text-text-disabled hover:text-text-tertiary'
                    } transition-colors`}
                  >
                    {section.title}
                    <ChevronDown
                      className={`w-2.5 h-2.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                    />
                  </button>
                </>
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
                      `flex items-center gap-2 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all relative ${
                        isActive
                          ? 'text-accent bg-accent-muted'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator — left accent bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent" />
                        )}
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border-subtle">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all relative ${
              isActive
                ? 'text-accent bg-accent-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent" />
              )}
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Settings</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/landing"
          onClick={onNavigate}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[12px] font-medium text-text-disabled hover:text-text-tertiary transition-all"
        >
          <span className="text-[9px] font-mono tracking-wide">v1.0</span>
          <span className="text-[10px]">· View Site</span>
        </NavLink>
      </div>
    </aside>
  )
}
