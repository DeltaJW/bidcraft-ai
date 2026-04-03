import type { Company, BurdenProfile, Quote, RateLibrary, BuildingTemplate, LaborCategory, Client, Contract, InspectionRecord, ContractPL, AIConversation } from '@/types'
import type { SupplyItem } from './defaultSupplies'
import { DEFAULT_SUPPLIES } from './defaultSupplies'
import { DEFAULT_RATES } from './defaultRates'
import { useSyncExternalStore } from 'react'

// Persistent reactive store — saves to localStorage, will be replaced with Azure later
type Listener = () => void

function createStore<T>(key: string, initial: T) {
  // Load from localStorage on init
  let state: T = initial
  try {
    const saved = localStorage.getItem(`bidcraft:${key}`)
    if (saved) state = JSON.parse(saved)
  } catch (err) {
    console.warn(`BidCraft: failed to load "${key}" from storage, using defaults`, err)
    localStorage.removeItem(`bidcraft:${key}`)
  }

  const listeners = new Set<Listener>()

  function persist() {
    try {
      localStorage.setItem(`bidcraft:${key}`, JSON.stringify(state))
    } catch {
      // storage full or unavailable
    }
  }

  return {
    get: () => state,
    set: (next: T) => {
      state = next
      persist()
      listeners.forEach((fn) => fn())
    },
    update: (fn: (prev: T) => T) => {
      state = fn(state)
      persist()
      listeners.forEach((fn) => fn())
    },
    subscribe: (fn: Listener) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

// ---- Company ----
const defaultCompany: Company = {
  id: 'demo-company',
  name: '',
  address: '',
  cageCode: '',
  uei: '',
  setAside: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  logoUrl: null,
}

export const companyStore = createStore<Company>('company', defaultCompany)

// ---- Rate Library ----
const defaultLibrary: RateLibrary = {
  id: 'default-library',
  name: 'Default',
  rates: [...DEFAULT_RATES],
}

export const rateLibraryStore = createStore<RateLibrary>('rateLibrary', defaultLibrary)

// ---- Burden Profiles ----
export const burdenProfilesStore = createStore<BurdenProfile[]>('burdenProfiles', [])

// ---- Labor Categories ----
export const laborCategoriesStore = createStore<LaborCategory[]>('laborCategories', [])

// ---- Quotes ----
export const quotesStore = createStore<Quote[]>('quotes', [])

// ---- Clients ----
export const clientsStore = createStore<Client[]>('clients', [])

// ---- Contracts ----
export const contractsStore = createStore<Contract[]>('contracts', [])

// ---- Inspections ----
export const inspectionsStore = createStore<InspectionRecord[]>('inspections', [])

// ---- Contract P&L Tracking ----
export const contractPLStore = createStore<ContractPL[]>('contractPL', [])

// ---- Supplies Catalog ----
export const suppliesStore = createStore<SupplyItem[]>('supplies', [...DEFAULT_SUPPLIES])

// ---- Building Templates ----
export const templatesStore = createStore<BuildingTemplate[]>('buildingTemplates', [])

// ---- Workload Draft (for Send to Quote flow) ----
export interface WorkloadDraft {
  buildingName: string
  zones: Array<{
    name: string
    tasks: Array<{
      taskName: string
      equipment: string
      sqft: number
      sqftPerHour: number
      frequency: string
      annualHours: number
      laborCategoryId?: string
    }>
  }>
  totalAnnualHours: number
  burdenProfileId: string
}

export const workloadDraftStore = createStore<WorkloadDraft | null>('workloadDraft', null)

// ---- Last SCA Lookup ----
export interface LastSCALookup {
  wdNumber: string
  revision: number
  janitorRate: number | null
  hwRate: number | null
}
export const lastSCALookupStore = createStore<LastSCALookup | null>('lastSCALookup', null)

// ---- Onboarding Dismissed ----
export const onboardingDismissedStore = createStore<boolean>('onboardingDismissed', false)

// ---- Theme ----
export const themeStore = createStore<'dark' | 'light'>('theme', 'dark')

// ---- User Mode ----
export const userModeStore = createStore<'guided' | 'expert'>('userMode', 'guided')

// ---- Bid Decisions ----
import type { BidDecision } from '@/pages/BidNoBid'
export const bidDecisionsStore = createStore<BidDecision[]>('bidDecisions', [])

// ---- AI Settings ----
export interface AISettings {
  apiKey: string
  model: string
}

export const aiSettingsStore = createStore<AISettings>('aiSettings', {
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
})

// ---- AI Conversations ----
export const aiConversationsStore = createStore<AIConversation[]>('aiConversations', [])

// React hook helper
export function useStore<T>(store: {
  get: () => T
  subscribe: (fn: Listener) => () => void
}): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
