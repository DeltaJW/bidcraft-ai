export interface Company {
  id: string
  name: string
  address: string
  cageCode: string
  uei: string
  setAside: string
  contactName: string
  contactTitle: string
  contactEmail: string
  contactPhone: string
  logoUrl: string | null
}

export interface RateItem {
  id: string
  category: string
  task: string
  equipment: string
  method: string
  sqftPerHour: number
  overheadMultiplier: number
  isCustom: boolean
}

export interface RateLibrary {
  id: string
  name: string
  rates: RateItem[]
}

export interface BurdenProfile {
  id: string
  name: string
  baseWage: number
  hwRate: number
  ficaPct: number
  suiPct: number
  wcPct: number
  futaPct: number
  vacationDays: number
  holidayDays: number
  sickDays: number
  gaPct: number
  feePct: number
  computedRate: number | null
}

export interface Zone {
  id: string
  name: string
  tasks: ZoneTask[]
}

export interface ZoneTask {
  id: string
  rateItemId: string
  taskName: string
  sqft: number
  frequency: Frequency
  equipment: string
  sqftPerHour: number
  laborCategoryId?: string
}

export type Frequency =
  | 'daily'
  | '5x_week'
  | '3x_week'
  | '2x_week'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'

export const FREQUENCY_ANNUAL_MULTIPLIER: Record<Frequency, number> = {
  daily: 365,
  '5x_week': 260,
  '3x_week': 156,
  '2x_week': 104,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily (365x/yr)',
  '5x_week': '5x/Week (260x/yr)',
  '3x_week': '3x/Week (156x/yr)',
  '2x_week': '2x/Week (104x/yr)',
  weekly: 'Weekly (52x/yr)',
  biweekly: 'Biweekly (26x/yr)',
  monthly: 'Monthly (12x/yr)',
  quarterly: 'Quarterly (4x/yr)',
  annually: 'Annually (1x/yr)',
}

export interface MaterialItem {
  id: string
  name: string
  unitCost: number
  quantity: number
  unit: string
}

export interface Quote {
  id: string
  companyId: string
  burdenProfileId: string
  clientId?: string
  quoteType: 'task_order' | 'workload' | 'proposal'
  title: string
  contractRef: string
  location: string
  scopeDescription: string
  tasks: QuoteTask[]
  materials: MaterialItem[]
  assumptions: string[]
  totalHours: number
  totalLabor: number
  totalMaterials: number
  grandTotal: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  createdAt: string
  version?: number
  parentQuoteId?: string
}

export interface QuoteTask {
  id: string
  rateItemId?: string
  taskName: string
  equipment: string
  sqft: number
  sqftPerHour: number
  hours: number
  laborCost: number
}

export interface LaborCategory {
  id: string
  name: string
  burdenProfileId: string
  headcount: number // how many workers in this category
}

export interface BuildingTemplate {
  id: string
  name: string
  description: string
  zones: Zone[]
  createdAt: string
}

export interface Client {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  agency: string  // e.g. "GSA", "Army", "NPS", "Commercial"
  notes: string
  createdAt: string
}

export interface Contract {
  id: string
  name: string
  contractNumber: string
  clientName: string
  startDate: string  // ISO date
  endDate: string    // ISO date
  optionYears: number
  currentOptionYear: number
  wdNumber: string
  wdExpirationDate: string  // ISO date
  annualValue: number
  status: 'active' | 'expiring' | 'expired' | 'pending'
  notes: string
  createdAt: string
}

export interface InspectionItem {
  id: string
  zone: string
  task: string
  frequency: string
  rating: number  // 1-5
  pass: boolean
  notes: string
}

export interface InspectionRecord {
  id: string
  quoteId: string
  quoteTitle: string
  inspectorName: string
  inspectionDate: string
  items: InspectionItem[]
  overallScore: number
  notes: string
  createdAt: string
}
