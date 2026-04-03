import { useState, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import BidWizard from '@/components/BidWizard'
import CommandPalette from '@/components/CommandPalette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { userModeStore, useStore } from '@/data/mockStore'

// Pages where the bid wizard is relevant
const WIZARD_PAGES = ['/', '/company', '/rates', '/burden', '/workload', '/quote', '/proposal', '/multi']

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const location = useLocation()
  const userMode = useStore(userModeStore)

  const showWizard = userMode === 'guided' && WIZARD_PAGES.includes(location.pathname)

  const shortcuts = useMemo(
    () => ({
      'ctrl+k': () => setShowPalette((prev) => !prev),
      'ctrl+s': () => {
        /* no-op — prevent browser save dialog */
      },
    }),
    []
  )
  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-[60] lg:hidden p-2 rounded-lg bg-surface-1 border border-border-default text-text-secondary cursor-pointer no-print"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-50 lg:relative lg:translate-x-0 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className="flex-1 lg:ml-60 p-4 lg:p-8 pt-16 lg:pt-8">
        {showWizard && <BidWizard />}
        <Outlet />
      </main>

      <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} />
    </div>
  )
}
