import type { RateItem } from '@/types'

let nextId = 1000
function rate(
  category: string,
  task: string,
  equipment: string,
  method: string,
  sqftPerHour: number,
  overheadMultiplier = 1.0
): RateItem {
  return {
    id: `industry-${nextId++}`,
    category,
    task,
    equipment,
    method,
    sqftPerHour,
    overheadMultiplier,
    isCustom: false,
  }
}

// ========== SECURITY GUARD SERVICES ==========
// Rates are in "posts per hour" (1 post = 1 guard position)
// For security, sqftPerHour represents "units per hour" where unit = 1 guard post
export const SECURITY_RATES: RateItem[] = [
  // Fixed Post
  rate('Fixed Post', 'Lobby/Reception Desk', '1 guard', 'Stationary post', 1),
  rate('Fixed Post', 'Gate/Vehicle Entry', '1 guard', 'Vehicle inspection', 1),
  rate('Fixed Post', 'Loading Dock', '1 guard', 'Delivery screening', 1),
  rate('Fixed Post', 'Executive Floor', '1 guard', 'Access control', 1),
  rate('Fixed Post', 'Server Room / SCIF', '1 guard (cleared)', 'Access control', 1, 1.3),
  rate('Fixed Post', 'Parking Garage Booth', '1 guard', 'Ticket/badge check', 1),

  // Patrol
  rate('Patrol', 'Interior Foot Patrol', '1 guard', 'Walking rounds — interior', 1),
  rate('Patrol', 'Exterior Foot Patrol', '1 guard', 'Walking rounds — perimeter', 1),
  rate('Patrol', 'Vehicle Patrol', '1 guard + vehicle', 'Driving patrol route', 1, 1.15),
  rate('Patrol', 'Bike Patrol', '1 guard + bicycle', 'Bike patrol route', 1, 1.05),
  rate('Patrol', 'K-9 Patrol', '1 handler + K-9', 'K-9 patrol', 1, 1.5),

  // Access Control
  rate('Access Control', 'Badge Verification', '1 guard', 'ID/badge check', 1),
  rate('Access Control', 'Visitor Processing', '1 guard', 'Sign-in, badge issue, escort', 1),
  rate('Access Control', 'Screening (X-Ray/Mag)', '2 guards', 'X-ray + magnetometer', 0.5, 1.25),
  rate('Access Control', 'Package Inspection', '1 guard', 'Manual search', 1),

  // Event / Special
  rate('Event & Special', 'Event Security', '1 guard', 'Crowd management', 1),
  rate('Event & Special', 'VIP Protection', '1 guard (armed)', 'Close protection', 1, 1.5),
  rate('Event & Special', 'Emergency Response', '1 guard', 'On-call rapid response', 1, 1.2),

  // Monitoring
  rate('Monitoring', 'CCTV Monitoring', '1 operator', 'Control room — camera monitoring', 1),
  rate('Monitoring', 'Alarm Monitoring', '1 operator', 'Alarm response dispatch', 1),
  rate('Monitoring', 'Fire Watch', '1 guard', 'Fire watch patrol', 1),

  // Supervision
  rate('Supervision', 'Shift Supervisor', '1 supervisor', 'On-site supervision', 1, 1.25),
  rate('Supervision', 'Site Manager', '1 manager', 'Full-site management', 1, 1.5),
  rate('Supervision', 'Quality Assurance', '1 QA inspector', 'Periodic audit', 0.25),
]

export const SECURITY_CATEGORIES = [
  'Fixed Post',
  'Patrol',
  'Access Control',
  'Event & Special',
  'Monitoring',
  'Supervision',
]

// ========== LANDSCAPING / GROUNDS MAINTENANCE ==========
// Rates in square feet per hour (or units/hr for small counts)
export const LANDSCAPING_RATES: RateItem[] = [
  // Mowing
  rate('Mowing', 'Push Mowing', '21" push mower', 'Walk-behind', 8_000),
  rate('Mowing', 'Commercial Walk-Behind', '36" walk-behind', 'Self-propelled', 20_000),
  rate('Mowing', 'Zero-Turn Riding', '48" zero-turn', 'Riding mower', 45_000),
  rate('Mowing', 'Zero-Turn Riding', '60" zero-turn', 'Riding mower', 65_000),
  rate('Mowing', 'Tractor Mowing', '72" deck tractor', 'PTO driven', 90_000),
  rate('Mowing', 'Slope Mowing', 'Slope mower', 'Remote / tracked', 15_000, 1.3),

  // Trimming & Edging
  rate('Trimming & Edging', 'String Trimming', 'Gas string trimmer', 'Line trimming', 3_500),
  rate('Trimming & Edging', 'Edging — Sidewalks', 'Stick edger', 'Mechanical edge', 2_000),
  rate('Trimming & Edging', 'Hedge Trimming', 'Gas hedge trimmer', 'Power shearing', 500),
  rate('Trimming & Edging', 'Shrub Pruning', 'Hand pruners/loppers', 'Manual pruning', 15),

  // Leaf & Debris
  rate('Leaf & Debris', 'Backpack Blowing', 'Backpack blower', 'Debris clearing', 25_000),
  rate('Leaf & Debris', 'Walk-Behind Blowing', 'Wheeled blower', 'Parking lot clearing', 40_000),
  rate('Leaf & Debris', 'Leaf Vacuum', 'Truck-mount vacuum', 'Leaf collection', 15_000, 1.15),
  rate('Leaf & Debris', 'Policing / Hand Pickup', 'Trash grabber', 'Manual litter pick-up', 10_000),

  // Irrigation
  rate('Irrigation', 'Irrigation Inspection', 'Visual + controller', 'Monthly system check', 10),
  rate('Irrigation', 'Head Adjustment', 'Tools', 'Seasonal head adjustment', 30),
  rate('Irrigation', 'Winterization', 'Compressor', 'Blow-out per zone', 12),
  rate('Irrigation', 'Spring Startup', 'Tools + controller', 'Zone check and activation', 10),

  // Turf Care
  rate('Turf Care', 'Fertilizer Application', 'Broadcast spreader', 'Granular application', 20_000),
  rate('Turf Care', 'Herbicide Application', 'Backpack sprayer', 'Spot treatment', 8_000),
  rate('Turf Care', 'Aeration', 'Core aerator', 'Mechanical aeration', 10_000),
  rate('Turf Care', 'Overseeding', 'Slit seeder', 'Mechanical seeding', 8_000),
  rate('Turf Care', 'Sod Installation', 'Manual', 'Sod laying + rolling', 500),

  // Seasonal
  rate('Seasonal', 'Snow Plowing — Lot', 'Truck plow', 'Per pass', 40_000),
  rate('Seasonal', 'Snow Plowing — Sidewalk', 'Skid steer + blade', 'Mechanical clearing', 5_000),
  rate('Seasonal', 'Snow Shoveling', 'Manual shovel', 'Walk/entrance clearing', 1_500),
  rate('Seasonal', 'De-Icing — Lot', 'Spreader', 'Salt/mag chloride application', 30_000),
  rate('Seasonal', 'De-Icing — Sidewalk', 'Hand spreader', 'Manual application', 5_000),

  // Mulch & Beds
  rate('Mulch & Beds', 'Mulch Installation', 'Wheelbarrow', 'Manual spreading — 3" depth', 200),
  rate('Mulch & Beds', 'Bed Edging', 'Bed edger', 'Mechanical cut edge', 1_000),
  rate('Mulch & Beds', 'Weeding', 'Hand tools', 'Manual weed removal', 500),
  rate('Mulch & Beds', 'Annual Planting', 'Hand tools', 'Dig + plant + water', 30),
]

export const LANDSCAPING_CATEGORIES = [
  'Mowing',
  'Trimming & Edging',
  'Leaf & Debris',
  'Irrigation',
  'Turf Care',
  'Seasonal',
  'Mulch & Beds',
]

// ========== FACILITIES MAINTENANCE ==========
// Rates in units per hour (fixtures, calls, inspections)
export const MAINTENANCE_RATES: RateItem[] = [
  // HVAC
  rate('HVAC', 'Filter Replacement', 'Ladder + filters', 'Replace air filters', 12),
  rate('HVAC', 'Thermostat Calibration', 'Digital meter', 'Calibrate/reprogram', 4),
  rate('HVAC', 'Coil Cleaning', 'Coil cleaner + hose', 'Chemical clean', 3, 1.1),
  rate('HVAC', 'Belt Inspection/Replace', 'Hand tools', 'Check tension, replace', 6),
  rate('HVAC', 'PM — Rooftop Unit', 'Full toolkit', 'Quarterly PM checklist', 2, 1.15),
  rate('HVAC', 'PM — Split System', 'Full toolkit', 'Quarterly PM checklist', 3, 1.1),

  // Electrical
  rate('Electrical', 'Light Bulb/Tube Replace', 'Ladder + bulbs', 'Replace burned lamps', 15),
  rate('Electrical', 'Ballast Replacement', 'Tools + ballast', 'Fluorescent fixture repair', 3),
  rate('Electrical', 'LED Retrofit', 'LED kit', 'Fixture conversion', 4),
  rate('Electrical', 'Outlet/Switch Replace', 'Electrician tools', 'Replace receptacle or switch', 4),
  rate('Electrical', 'Circuit Breaker Reset', 'Panel access', 'Troubleshoot + reset', 6),
  rate('Electrical', 'Emergency Light Test', 'Test button', 'Monthly 30-second test', 30),

  // Plumbing
  rate('Plumbing', 'Faucet Repair/Replace', 'Plumbing tools', 'Washer, cartridge, or full', 3),
  rate('Plumbing', 'Toilet Repair', 'Plumbing tools', 'Flapper, fill valve, handle', 4),
  rate('Plumbing', 'Drain Clearing', 'Snake/auger', 'Mechanical clearing', 2),
  rate('Plumbing', 'Water Heater Flush', 'Hose + valve', 'Annual sediment flush', 2),
  rate('Plumbing', 'Backflow Test', 'Test kit (certified)', 'Annual backflow prevention test', 4, 1.2),

  // General Maintenance
  rate('General Maintenance', 'Door Hardware Repair', 'Tools + parts', 'Closer, lock, hinge', 3),
  rate('General Maintenance', 'Drywall Patch', 'Patch kit + compound', 'Small hole repair', 2),
  rate('General Maintenance', 'Paint Touch-Up', 'Brush + roller', 'Per wall section', 400),
  rate('General Maintenance', 'Ceiling Tile Replace', 'Ladder', 'Drop ceiling tile swap', 20),
  rate('General Maintenance', 'Caulking/Sealant', 'Caulk gun', 'Window, door, fixture seal', 50),
  rate('General Maintenance', 'Carpet Spot Repair', 'Patch kit + adhesive', 'Section repair/stretch', 2),

  // Fire & Life Safety
  rate('Fire & Life Safety', 'Fire Extinguisher Inspection', 'Checklist', 'Monthly visual + tag', 20),
  rate('Fire & Life Safety', 'Exit Sign Inspection', 'Visual', 'Monthly check — illumination + battery', 30),
  rate('Fire & Life Safety', 'Sprinkler Visual Inspection', 'Visual', 'Quarterly check', 50),
  rate('Fire & Life Safety', 'AED Check', 'Checklist', 'Monthly pad/battery check', 10),

  // Preventive Maintenance
  rate('Preventive Maintenance', 'Building Walk-Through', 'Clipboard/tablet', 'Facility condition assessment', 5_000),
  rate('Preventive Maintenance', 'Roof Inspection', 'Safety harness', 'Quarterly visual + drain check', 10_000),
  rate('Preventive Maintenance', 'Generator Test', 'Generator controls', 'Monthly load test', 1),
  rate('Preventive Maintenance', 'Elevator Callback', 'Phone test', 'Monthly phone + alarm test', 4),
]

export const MAINTENANCE_CATEGORIES = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'General Maintenance',
  'Fire & Life Safety',
  'Preventive Maintenance',
]

// ========== INDUSTRY REGISTRY ==========
export type IndustryType = 'janitorial' | 'security' | 'landscaping' | 'maintenance'

export const INDUSTRIES: Record<IndustryType, {
  label: string
  description: string
  rateUnit: string
}> = {
  janitorial: {
    label: 'Janitorial / Custodial',
    description: 'Cleaning production rates by task, equipment, and method',
    rateUnit: 'sf/hr',
  },
  security: {
    label: 'Security Guard Services',
    description: 'Guard posts, patrols, access control, and monitoring',
    rateUnit: 'posts/hr',
  },
  landscaping: {
    label: 'Landscaping & Grounds',
    description: 'Mowing, trimming, turf care, snow removal, and irrigation',
    rateUnit: 'sf/hr',
  },
  maintenance: {
    label: 'Facilities Maintenance',
    description: 'HVAC, electrical, plumbing, and preventive maintenance',
    rateUnit: 'units/hr',
  },
}

export function getRatesForIndustry(industry: IndustryType): RateItem[] {
  switch (industry) {
    case 'security': return SECURITY_RATES
    case 'landscaping': return LANDSCAPING_RATES
    case 'maintenance': return MAINTENANCE_RATES
    default: return [] // janitorial uses DEFAULT_RATES from defaultRates.ts
  }
}

export function getCategoriesForIndustry(industry: IndustryType): string[] {
  switch (industry) {
    case 'security': return SECURITY_CATEGORIES
    case 'landscaping': return LANDSCAPING_CATEGORIES
    case 'maintenance': return MAINTENANCE_CATEGORIES
    default: return [] // janitorial uses RATE_CATEGORIES from defaultRates.ts
  }
}
