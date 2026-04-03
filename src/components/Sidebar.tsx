import { NavLink } from 'react-router-dom'
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
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/estimate', icon: Zap, label: 'Quick Estimate' },
  { to: '/company', icon: Building2, label: 'Company Profile' },
  { to: '/clients', icon: Briefcase, label: 'Clients' },
  { to: '/rates', icon: BookOpen, label: 'Rate Library' },
  { to: '/burden', icon: Calculator, label: 'Burden Builder' },
  { to: '/labor', icon: Users, label: 'Labor Categories' },
  { to: '/sca', icon: Shield, label: 'SCA Wage Lookup' },
  { to: '/rfp', icon: FileSearch, label: 'RFP Parser' },
  { to: '/workload', icon: ClipboardList, label: 'Workloading' },
  { to: '/quote', icon: FileText, label: 'Task Order Quote' },
  { to: '/proposal', icon: FileStack, label: 'Full Proposal' },
  { to: '/saved', icon: FolderOpen, label: 'Saved Quotes' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/calendar', icon: Calendar, label: 'Contract Calendar' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="no-print fixed left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-border-default flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <h1 className="text-lg font-bold text-text-primary tracking-tight">
            BidCraft <span className="text-accent">AI</span>
          </h1>
        </div>
        <p className="text-xs text-text-tertiary mt-1">Intelligent Bid Pricing</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-muted text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-default">
        <div className="text-xs text-text-disabled">
          Phase 1 — MVP
        </div>
      </div>
    </aside>
  )
}
