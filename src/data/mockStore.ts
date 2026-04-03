import type { Company, BurdenProfile, Quote, RateLibrary } from '@/types'
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
  } catch {
    // ignore parse errors, use default
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

// ---- Quotes ----
export const quotesStore = createStore<Quote[]>('quotes', [])

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
    }>
  }>
  totalAnnualHours: number
  burdenProfileId: string
}

export const workloadDraftStore = createStore<WorkloadDraft | null>('workloadDraft', null)

// React hook helper
export function useStore<T>(store: {
  get: () => T
  subscribe: (fn: Listener) => () => void
}): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
