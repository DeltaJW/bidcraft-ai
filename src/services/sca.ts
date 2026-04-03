export interface WageRate {
  occupation: string
  code: string
  rate: number
}

export interface WageDetermination {
  wdNumber: string
  revision: number
  active: boolean
  publishDate: string
  locationText: string
  rates: WageRate[]
  hwRate: number | null
  vacationText: string
  holidaysText: string
  rawText: string
}

const WD_API = 'https://sam.gov/api/prod/wdol/v1/wd'

export async function fetchWageDetermination(wdNumber: string, revision?: number): Promise<WageDetermination> {
  // Try to fetch the WD. If no revision given, try common recent revisions
  const revisions = revision ? [revision] : Array.from({ length: 50 }, (_, i) => 50 - i)

  let lastError = ''
  for (const rev of revisions) {
    try {
      const res = await fetch(`${WD_API}/${wdNumber}/${rev}`, {
        headers: { 'Accept': 'application/hal+json' },
      })
      if (res.status === 404) continue
      if (!res.ok) {
        lastError = `API returned ${res.status}`
        continue
      }

      const data = await res.json()
      if (!data.document) {
        lastError = 'No document in response'
        continue
      }

      return parseWageDetermination(wdNumber, data)
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error'
    }
  }

  throw new Error(`Could not find WD ${wdNumber}. ${lastError}`)
}

function parseWageDetermination(wdNumber: string, data: Record<string, unknown>): WageDetermination {
  const doc = data.document as string
  const rates: WageRate[] = []

  // Parse labor categories: lines like "01011 - Accounting Clerk I                     $20.15"
  // or "11150 - Janitor                                $17.84"
  const ratePattern = /(\d{5})\s*-\s*(.+?)\s+\$(\d+\.\d{2})/g
  let match
  while ((match = ratePattern.exec(doc)) !== null) {
    rates.push({
      code: match[1],
      occupation: match[2].trim(),
      rate: parseFloat(match[3]),
    })
  }

  // Parse H&W rate: "HEALTH & WELFARE: $X.XX per hour"
  let hwRate: number | null = null
  const hwMatch = doc.match(/HEALTH\s*(?:&|AND)\s*WELFARE[:\s]*\$(\d+\.\d{2})/i)
  if (hwMatch) {
    hwRate = parseFloat(hwMatch[1])
  }

  // Extract vacation text
  let vacationText = ''
  const vacMatch = doc.match(/VACATION[:\s]*(.*?)(?=\n\s*\n|HOLIDAYS|$)/is)
  if (vacMatch) vacationText = vacMatch[1].trim().slice(0, 500)

  // Extract holidays text
  let holidaysText = ''
  const holMatch = doc.match(/HOLIDAYS[:\s]*(.*?)(?=\n\s*\n|VACATION|$)/is)
  if (holMatch) holidaysText = holMatch[1].trim().slice(0, 500)

  // Location text from the mapping
  let locationText = ''
  const location = data.location as Record<string, unknown> | undefined
  if (location?.mapping) {
    const mappings = location.mapping as Array<{ state: string; counties?: string[]; statewideFlag?: boolean }>
    locationText = mappings.map(m =>
      m.statewideFlag ? `${m.state} (Statewide)` : `${m.state}: ${m.counties?.join(', ') || ''}`
    ).join('; ')
  }

  return {
    wdNumber,
    revision: (data.revisionNumber as number) || 0,
    active: (data.active as boolean) || false,
    publishDate: (data.publishDate as string) || '',
    locationText,
    rates,
    hwRate,
    vacationText,
    holidaysText,
    rawText: doc,
  }
}

// Common janitorial/facility labor category codes
export const COMMON_CATEGORIES = [
  { code: '11150', name: 'Janitor' },
  { code: '11160', name: 'Laborer, Grounds Maintenance' },
  { code: '11060', name: 'Elevator Starter' },
  { code: '11070', name: 'Fireman/Maintenance' },
  { code: '11080', name: 'Guard I' },
  { code: '11081', name: 'Guard II' },
  { code: '11090', name: 'Housekeeper' },
  { code: '99030', name: 'Carpet Layer' },
  { code: '21020', name: 'Electrician, Maintenance' },
  { code: '21040', name: 'HVAC Mechanic' },
  { code: '21130', name: 'Plumber, Maintenance' },
  { code: '23120', name: 'Forklift Operator' },
  { code: '01311', name: 'Secretary I' },
  { code: '01020', name: 'Administrative Assistant' },
]
