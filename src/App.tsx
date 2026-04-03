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
import Inspections from '@/pages/Inspections'
import ContractCalendar from '@/pages/ContractCalendar'
import PriceEscalation from '@/pages/PriceEscalation'
import Clients from '@/pages/Clients'
import Settings from '@/pages/Settings'
import AIAssistant from '@/pages/AIAssistant'
import SCALookup from '@/pages/SCALookup'
import RFPParser from '@/pages/RFPParser'
import LaborCategories from '@/pages/LaborCategories'
import CrewScheduler from '@/pages/CrewScheduler'
import QuickEstimate from '@/pages/QuickEstimate'
import ProfitOptimizer from '@/pages/ProfitOptimizer'
import CompetitiveIntel from '@/pages/CompetitiveIntel'
import TurnoverCalc from '@/pages/TurnoverCalc'
import MultiBuilding from '@/pages/MultiBuilding'
import ScenarioCompare from '@/pages/ScenarioCompare'
import BidNoBid from '@/pages/BidNoBid'
import RecompeteRadar from '@/pages/RecompeteRadar'
import NarrativeWriter from '@/pages/NarrativeWriter'
import ContractPL from '@/pages/ContractPL'
import RegionalCost from '@/pages/RegionalCost'
import ToastContainer from '@/components/Toast'
import Onboarding from '@/components/Onboarding'
import {
  themeStore,
  companyStore,
  burdenProfilesStore,
  quotesStore,
  onboardingDismissedStore,
  useStore,
} from '@/data/mockStore'

function App() {
  const theme = useStore(themeStore)
  const company = useStore(companyStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const quotes = useStore(quotesStore)
  const onboardingDismissed = useStore(onboardingDismissedStore)

  const showOnboarding =
    !onboardingDismissed &&
    !company.name &&
    burdenProfiles.length === 0 &&
    quotes.length === 0

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
          <Route path="clients" element={<Clients />} />
          <Route path="rates" element={<RateLibrary />} />
          <Route path="burden" element={<BurdenBuilder />} />
          <Route path="workload" element={<Workloading />} />
          <Route path="quote" element={<TaskOrderQuote />} />
          <Route path="proposal" element={<Proposal />} />
          <Route path="saved" element={<SavedQuotes />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="calendar" element={<ContractCalendar />} />
          <Route path="escalation" element={<PriceEscalation />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="sca" element={<SCALookup />} />
          <Route path="labor" element={<LaborCategories />} />
          <Route path="crew" element={<CrewScheduler />} />
          <Route path="rfp" element={<RFPParser />} />
          <Route path="estimate" element={<QuickEstimate />} />
          <Route path="optimizer" element={<ProfitOptimizer />} />
          <Route path="multi" element={<MultiBuilding />} />
          <Route path="scenarios" element={<ScenarioCompare />} />
          <Route path="intel" element={<CompetitiveIntel />} />
          <Route path="turnover" element={<TurnoverCalc />} />
          <Route path="bid-decision" element={<BidNoBid />} />
          <Route path="recompete" element={<RecompeteRadar />} />
          <Route path="narrative" element={<NarrativeWriter />} />
          <Route path="pl-tracker" element={<ContractPL />} />
          <Route path="regional" element={<RegionalCost />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      {showOnboarding && <Onboarding />}
      <ToastContainer />
    </HashRouter>
  )
}

export default App
