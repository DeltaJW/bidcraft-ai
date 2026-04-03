import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-[60] lg:hidden p-2 rounded-lg bg-navy-900/80 backdrop-blur border border-navy-700/30 text-navy-300 cursor-pointer no-print"
        onClick={() => setMobileOpen(!mobileOpen)}
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

      {/* Sidebar — always visible on lg+, toggleable on mobile */}
      <div
        className={`fixed z-50 lg:relative lg:translate-x-0 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
