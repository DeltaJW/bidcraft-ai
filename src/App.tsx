import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import Dashboard from '@/pages/Dashboard'
import CompanyProfile from '@/pages/CompanyProfile'
import RateLibrary from '@/pages/RateLibrary'
import BurdenBuilder from '@/pages/BurdenBuilder'
import Workloading from '@/pages/Workloading'
import TaskOrderQuote from '@/pages/TaskOrderQuote'
import Proposal from '@/pages/Proposal'
import Landing from '@/pages/Landing'
import SavedQuotes from '@/pages/SavedQuotes'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'
import AIAssistant from '@/pages/AIAssistant'
import SCALookup from '@/pages/SCALookup'
import ToastContainer from '@/components/Toast'
import { themeStore, useStore } from '@/data/mockStore'

function App() {
  const theme = useStore(themeStore)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        {/* Marketing landing page */}
        <Route path="landing" element={<Landing />} />
        {/* App */}
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="company" element={<CompanyProfile />} />
          <Route path="rates" element={<RateLibrary />} />
          <Route path="burden" element={<BurdenBuilder />} />
          <Route path="workload" element={<Workloading />} />
          <Route path="quote" element={<TaskOrderQuote />} />
          <Route path="proposal" element={<Proposal />} />
          <Route path="saved" element={<SavedQuotes />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="sca" element={<SCALookup />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <ToastContainer />
    </HashRouter>
  )
}

export default App
