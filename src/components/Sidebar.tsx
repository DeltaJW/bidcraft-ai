import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  FolderOpen,
  FileStack,
  Sparkles,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company', icon: Building2, label: 'Company Profile' },
  { to: '/rates', icon: BookOpen, label: 'Rate Library' },
  { to: '/burden', icon: Calculator, label: 'Burden Builder' },
  { to: '/workload', icon: ClipboardList, label: 'Workloading' },
  { to: '/quote', icon: FileText, label: 'Task Order Quote' },
  { to: '/proposal', icon: FileStack, label: 'Full Proposal' },
  { to: '/saved', icon: FolderOpen, label: 'Saved Quotes' },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="no-print fixed left-0 top-0 bottom-0 w-64 bg-navy-900/80 backdrop-blur-xl border-r border-navy-700/30 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-navy-700/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            BidCraft <span className="text-accent">AI</span>
          </h1>
        </div>
        <p className="text-xs text-navy-400 mt-1">Intelligent Bid Pricing</p>
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
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800/60 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-navy-700/30">
        <div className="text-xs text-navy-500">
          Phase 1 — MVP
        </div>
      </div>
    </aside>
  )
}
