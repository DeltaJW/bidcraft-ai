export interface SAMEntity {
  uei: string
  cage: string
  legalBusinessName: string
  dbaName: string | null
  address: {
    line1: string
    line2: string | null
    city: string
    state: string
    zip: string
    country: string
  }
  naicsCodes: string[]
  setAsideTypes: string[]
  entityType: string
  registrationStatus: string
  activationDate: string
  expirationDate: string
  congressionalDistrict: string
  businessTypes: string[]
}

const SAM_API = 'https://api.sam.gov/entity-information/v3/entities'

export async function searchSAM(query: string, apiKey?: string): Promise<SAMEntity[]> {
  // SAM.gov entity API requires a free API key from api.data.gov
  // For MVP, we'll try without a key first (limited), then with key
  const params = new URLSearchParams({
    api_key: apiKey || 'DEMO_KEY',
    qterms: query,
    registrationStatus: 'A',
    purposeOfRegistrationCode: 'Z2',
    includeSections: 'entityRegistration,coreData',
  })

  try {
    const res = await fetch(`${SAM_API}?${params}`)
    if (!res.ok) {
      // Fallback: try the simpler search endpoint
      return await searchSAMFallback(query)
    }

    const data = await res.json()
    if (!data.entityData || data.entityData.length === 0) {
      return []
    }

    return data.entityData.map(parseEntity).filter(Boolean) as SAMEntity[]
  } catch {
    // API may be blocked by CORS in browser — use fallback
    return await searchSAMFallback(query)
  }
}

export async function lookupByUEI(uei: string, apiKey?: string): Promise<SAMEntity | null> {
  const params = new URLSearchParams({
    api_key: apiKey || 'DEMO_KEY',
    ueiSAM: uei,
    registrationStatus: 'A',
    includeSections: 'entityRegistration,coreData',
  })

  try {
    const res = await fetch(`${SAM_API}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.entityData || data.entityData.length === 0) return null
    return parseEntity(data.entityData[0])
  } catch {
    return null
  }
}

function parseEntity(raw: Record<string, unknown>): SAMEntity | null {
  try {
    const reg = raw.entityRegistration as Record<string, unknown> || {}
    const core = raw.coreData as Record<string, unknown> || {}
    const physAddr = (core.physicalAddress as Record<string, unknown>) || {}
    const genInfo = (core.generalInformation as Record<string, unknown>) || {}

    return {
      uei: (reg.ueiSAM as string) || '',
      cage: (reg.cageCode as string) || '',
      legalBusinessName: (reg.legalBusinessName as string) || '',
      dbaName: (reg.dbaName as string) || null,
      address: {
        line1: (physAddr.addressLine1 as string) || '',
        line2: (physAddr.addressLine2 as string) || null,
        city: (physAddr.city as string) || '',
        state: (physAddr.stateOrProvinceCode as string) || '',
        zip: (physAddr.zipCode as string) || '',
        country: (physAddr.countryCode as string) || 'USA',
      },
      naicsCodes: ((core.naicsCode as Record<string, unknown>[]) || []).map((n) => (n.naicsCode as string) || ''),
      setAsideTypes: [],
      entityType: (genInfo.entityStructureDesc as string) || '',
      registrationStatus: (reg.registrationStatus as string) || '',
      activationDate: (reg.activationDate as string) || '',
      expirationDate: (reg.registrationExpirationDate as string) || '',
      congressionalDistrict: (physAddr.congressionalDistrict as string) || '',
      businessTypes: ((reg.businessTypes as string[]) || []),
    }
  } catch {
    return null
  }
}

// Fallback: use the simpler opportunities API or construct manually
async function searchSAMFallback(_query: string): Promise<SAMEntity[]> {
  // If the main API fails (CORS), return empty and let user enter manually
  // In production, this would go through a backend proxy
  console.warn('SAM.gov API unavailable in browser (CORS). Use a backend proxy in production.')
  return []
}

// Map common business types to set-aside categories
export function inferSetAside(businessTypes: string[]): string {
  const types = businessTypes.join(' ').toLowerCase()
  if (types.includes('8(a)')) return '8(a)'
  if (types.includes('hubzone')) return 'HUBZone'
  if (types.includes('service-disabled') || types.includes('sdvosb')) return 'SDVOSB'
  if (types.includes('veteran') || types.includes('vosb')) return 'VOSB'
  if (types.includes('women-owned') || types.includes('wosb')) return 'WOSB'
  if (types.includes('small business') || types.includes('small disadvantaged')) return 'Small Business'
  if (types.includes('abilityone')) return 'AbilityOne'
  return ''
}
