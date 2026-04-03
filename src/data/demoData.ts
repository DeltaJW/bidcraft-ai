import type { Company, BurdenProfile, Quote } from '@/types'
import { companyStore, burdenProfilesStore, quotesStore } from './mockStore'
import { toast } from '@/components/Toast'

const DEMO_COMPANY: Company = {
  id: 'demo-company',
  name: 'Patriot Facility Services LLC',
  address: '1420 K Street NW, Suite 300, Washington, DC 20005',
  cageCode: '8F4K2',
  uei: 'J7KMHG3N4LP1',
  setAside: 'SDVOSB',
  contactName: 'Sarah Mitchell',
  contactTitle: 'Director of Operations',
  contactEmail: 'sarah@patriotfacility.com',
  contactPhone: '(202) 555-0147',
  logoUrl: null,
}

const DEMO_BURDEN_GSA: BurdenProfile = {
  id: 'demo-burden-gsa',
  name: 'GSA — Mid-Atlantic Region',
  baseWage: 17.75,
  hwRate: 4.60,
  ficaPct: 7.65,
  suiPct: 2.7,
  wcPct: 5.2,
  futaPct: 0.6,
  vacationDays: 10,
  holidayDays: 11,
  sickDays: 5,
  gaPct: 14,
  feePct: 8,
  computedRate: null,
}

const DEMO_BURDEN_COMMERCIAL: BurdenProfile = {
  id: 'demo-burden-comm',
  name: 'Commercial — Default',
  baseWage: 15.50,
  hwRate: 2.80,
  ficaPct: 7.65,
  suiPct: 2.7,
  wcPct: 4.8,
  futaPct: 0.6,
  vacationDays: 5,
  holidayDays: 7,
  sickDays: 3,
  gaPct: 10,
  feePct: 15,
  computedRate: null,
}

function computeBurdenRate(bp: BurdenProfile): number {
  const basePlusHW = bp.baseWage + bp.hwRate
  const fica = bp.baseWage * (bp.ficaPct / 100)
  const sui = bp.baseWage * (bp.suiPct / 100)
  const wc = bp.baseWage * (bp.wcPct / 100)
  const futa = bp.baseWage * (bp.futaPct / 100)
  const taxTotal = fica + sui + wc + futa
  const totalPaidDays = bp.vacationDays + bp.holidayDays + bp.sickDays
  const effectiveWorkDays = 260 - totalPaidDays
  const leavePct = effectiveWorkDays > 0 ? (totalPaidDays / effectiveWorkDays) * 100 : 0
  const leaveDollar = (basePlusHW + taxTotal) * (leavePct / 100)
  const subtotal = basePlusHW + taxTotal + leaveDollar
  const ga = subtotal * (bp.gaPct / 100)
  const preProfit = subtotal + ga
  const fee = preProfit * (bp.feePct / 100)
  return preProfit + fee
}

const DEMO_QUOTE: Quote = {
  id: 'demo-quote-1',
  companyId: 'demo-company',
  burdenProfileId: 'demo-burden-gsa',
  quoteType: 'task_order',
  title: 'Emergency Strip & Refinish — GSA Building 101',
  contractRef: 'GS-07P-18-BF-C-0042',
  location: 'GSA Federal Building, 1800 F Street NW, Washington DC',
  scopeDescription: 'Strip and refinish all VCT flooring in the main lobby, east corridor, and west corridor. Four coats of high-traffic floor finish. Work to be performed after hours (6 PM - 6 AM).',
  tasks: [
    { id: 'dt-1', rateItemId: 'default-21', taskName: 'Strip & Refinish', equipment: 'Rotary + wet vac', sqft: 12000, sqftPerHour: 500, hours: 24, laborCost: 0 },
    { id: 'dt-2', rateItemId: 'default-4', taskName: 'Dust Mopping', equipment: '36" dust mop', sqft: 12000, sqftPerHour: 10000, hours: 1.2, laborCost: 0 },
  ],
  materials: [
    { id: 'dm-1', name: 'Floor stripper concentrate', unitCost: 45, quantity: 3, unit: 'gal' },
    { id: 'dm-2', name: 'High-traffic floor finish', unitCost: 65, quantity: 5, unit: 'gal' },
    { id: 'dm-3', name: 'Stripping pads (black)', unitCost: 12, quantity: 6, unit: 'ea' },
  ],
  assumptions: [
    'Work performed outside normal business hours (6 PM - 6 AM)',
    'All furniture will be moved by client prior to start date',
    'Pricing based on current SCA Wage Determination',
  ],
  totalHours: 25.2,
  totalLabor: 0,
  totalMaterials: 537,
  grandTotal: 0,
  status: 'sent',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
}

export function loadDemoData() {
  // Company
  companyStore.set(DEMO_COMPANY)

  // Burden profiles with computed rates
  const gsa = { ...DEMO_BURDEN_GSA, computedRate: computeBurdenRate(DEMO_BURDEN_GSA) }
  const comm = { ...DEMO_BURDEN_COMMERCIAL, computedRate: computeBurdenRate(DEMO_BURDEN_COMMERCIAL) }
  burdenProfilesStore.set([gsa, comm])

  // Quote with computed labor costs
  const quote = { ...DEMO_QUOTE }
  quote.tasks = quote.tasks.map((t) => ({
    ...t,
    laborCost: t.hours * gsa.computedRate!,
  }))
  quote.totalLabor = quote.tasks.reduce((s, t) => s + t.laborCost, 0)
  quote.grandTotal = quote.totalLabor + quote.totalMaterials
  quotesStore.set([quote])

  toast('Demo data loaded — explore the app!')
}
