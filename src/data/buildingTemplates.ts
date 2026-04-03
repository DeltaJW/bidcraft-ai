import type { Zone, Frequency } from '@/types'

export interface PrebuiltTemplate {
  id: string
  name: string
  description: string
  industry: string
  sqft: number
  floors: number
  zones: Zone[]
}

let taskId = 5000

function zt(
  rateItemId: string,
  taskName: string,
  sqft: number,
  frequency: Frequency,
  equipment: string,
  sqftPerHour: number
) {
  return {
    id: `tmpl-zt-${taskId++}`,
    rateItemId,
    taskName,
    sqft,
    frequency,
    equipment,
    sqftPerHour,
  }
}

function zone(name: string, tasks: ReturnType<typeof zt>[]): Zone {
  return { id: `tmpl-zone-${taskId++}`, name, tasks }
}

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  {
    id: 'small-office',
    name: 'Small Office Building',
    description: '5,000 SF single-story office with lobby, open office area, 2 restrooms, and break room',
    industry: 'janitorial',
    sqft: 5000,
    floors: 1,
    zones: [
      zone('Lobby & Reception', [
        zt('default-1', 'Dust Mopping', 400, '5x_week', '24" dust mop', 6500),
        zt('default-4', 'Wet Mopping', 400, '3x_week', 'String mop — dual bucket', 2500),
        zt('default-39', 'Entrance Glass', 4, '5x_week', 'Squeegee + cloth', 15),
        zt('default-37', 'Trash Collection', 3, '5x_week', 'Liner change', 80),
      ]),
      zone('Open Office Area', [
        zt('default-1', 'Dust Mopping', 2800, '5x_week', '36" dust mop', 10000),
        zt('default-24', 'Vacuuming — Upright', 800, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 15, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 2800, 'weekly', 'Microfiber cloth', 5000),
      ]),
      zone('Restrooms (2)', [
        zt('default-33', 'Full Restroom Service', 2, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 2, '5x_week', 'Supply cart', 30),
      ]),
      zone('Break Room', [
        zt('default-4', 'Wet Mopping', 200, '5x_week', 'String mop — dual bucket', 2500),
        zt('default-42', 'Break Room Service', 1, '5x_week', 'Standard service', 6),
        zt('default-37', 'Trash Collection', 2, '5x_week', 'Liner change', 80),
      ]),
    ],
  },
  {
    id: 'mid-office',
    name: 'Mid-Size Federal Office',
    description: '25,000 SF two-story federal building with lobby, offices, conference rooms, restrooms, and elevator',
    industry: 'janitorial',
    sqft: 25000,
    floors: 2,
    zones: [
      zone('Main Lobby & Corridors', [
        zt('default-2', 'Dust Mopping', 3000, '5x_week', '36" dust mop', 10000),
        zt('default-6', 'Wet Mopping', 3000, '3x_week', 'Flat mop — 18"', 3500),
        zt('default-39', 'Entrance Glass', 8, '5x_week', 'Squeegee + cloth', 15),
        zt('default-37', 'Trash Collection', 6, '5x_week', 'Liner change', 80),
        zt('default-41', 'Elevator Cab Cleaning', 2, '5x_week', 'Interior wipe-down', 4),
      ]),
      zone('Office Suites (Floor 1)', [
        zt('default-24', 'Vacuuming — Upright', 6000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 30, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 6000, 'weekly', 'Microfiber cloth', 5000),
        zt('default-36', 'Surface Wipe/Disinfect', 6000, '3x_week', 'Spray + cloth', 4000),
      ]),
      zone('Office Suites (Floor 2)', [
        zt('default-24', 'Vacuuming — Upright', 6000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 30, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 6000, 'weekly', 'Microfiber cloth', 5000),
        zt('default-36', 'Surface Wipe/Disinfect', 6000, '3x_week', 'Spray + cloth', 4000),
      ]),
      zone('Conference Rooms (4)', [
        zt('default-24', 'Vacuuming — Upright', 2000, '5x_week', '14" upright vacuum', 2500),
        zt('default-36', 'Surface Wipe/Disinfect', 2000, '5x_week', 'Spray + cloth', 4000),
        zt('default-37', 'Trash Collection', 4, '5x_week', 'Liner change', 80),
      ]),
      zone('Restrooms (8)', [
        zt('default-33', 'Full Restroom Service', 8, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 8, '5x_week', 'Supply cart', 30),
      ]),
      zone('Stairwells (2)', [
        zt('default-40', 'Stairwell Cleaning', 4, 'weekly', 'Broom + mop', 8),
      ]),
    ],
  },
  {
    id: 'large-federal',
    name: 'Large Federal Building',
    description: '100,000 SF five-story federal complex with courtrooms, offices, lobby, cafeteria, restrooms',
    industry: 'janitorial',
    sqft: 100000,
    floors: 5,
    zones: [
      zone('Main Lobby & Atrium', [
        zt('default-2', 'Dust Mopping', 5000, '5x_week', '48" dust mop', 15000),
        zt('default-8', 'Machine Scrubbing', 5000, 'weekly', 'Autoscrubber 20"', 10000),
        zt('default-39', 'Entrance Glass', 12, '5x_week', 'Squeegee + cloth', 15),
        zt('default-37', 'Trash Collection', 10, '5x_week', 'Liner change', 80),
      ]),
      zone('Office Floors (2-5)', [
        zt('default-24', 'Vacuuming — Upright', 60000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 200, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 60000, 'weekly', 'Microfiber cloth', 5000),
        zt('default-36', 'Surface Wipe/Disinfect', 60000, '3x_week', 'Spray + cloth', 4000),
      ]),
      zone('Courtrooms / Hearing Rooms (4)', [
        zt('default-24', 'Vacuuming — Upright', 8000, '5x_week', '14" upright vacuum', 2500),
        zt('default-38', 'Dusting — Low', 8000, 'weekly', 'Microfiber cloth', 5000),
      ]),
      zone('Cafeteria', [
        zt('default-8', 'Machine Scrubbing', 3000, '5x_week', 'Autoscrubber 20"', 10000),
        zt('default-37', 'Trash Collection', 15, '5x_week', 'Liner change', 80),
        zt('default-42', 'Break Room Service', 3, '5x_week', 'Standard service', 6),
      ]),
      zone('Restrooms (20)', [
        zt('default-33', 'Full Restroom Service', 20, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 20, '5x_week', 'Supply cart', 30),
      ]),
      zone('Corridors & Elevators', [
        zt('default-2', 'Dust Mopping', 15000, '5x_week', '36" dust mop', 10000),
        zt('default-41', 'Elevator Cab Cleaning', 6, '5x_week', 'Interior wipe-down', 4),
        zt('default-40', 'Stairwell Cleaning', 10, 'weekly', 'Broom + mop', 8),
      ]),
    ],
  },
  {
    id: 'medical-clinic',
    name: 'Medical Clinic / VA Outpatient',
    description: '15,000 SF medical clinic with waiting room, exam rooms, lab, admin offices, restrooms',
    industry: 'janitorial',
    sqft: 15000,
    floors: 1,
    zones: [
      zone('Waiting Room & Reception', [
        zt('default-24', 'Vacuuming — Upright', 2000, '5x_week', '14" upright vacuum', 2500),
        zt('default-36', 'Surface Wipe/Disinfect', 2000, '5x_week', 'Spray + cloth', 4000),
        zt('default-39', 'Entrance Glass', 4, '5x_week', 'Squeegee + cloth', 15),
        zt('default-37', 'Trash Collection', 5, '5x_week', 'Liner change', 80),
      ]),
      zone('Exam Rooms (12)', [
        zt('default-6', 'Wet Mopping', 3600, '5x_week', 'Flat mop — 18"', 3500),
        zt('default-36', 'Surface Wipe/Disinfect', 3600, '5x_week', 'Spray + cloth', 4000),
        zt('default-37', 'Trash Collection', 12, '5x_week', 'Liner change', 80),
      ]),
      zone('Lab & Procedure Room', [
        zt('default-6', 'Wet Mopping', 1500, '5x_week', 'Flat mop — 18"', 3500),
        zt('default-36', 'Surface Wipe/Disinfect', 1500, '5x_week', 'Spray + cloth', 4000),
      ]),
      zone('Admin Offices', [
        zt('default-24', 'Vacuuming — Upright', 4000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 10, '5x_week', 'Liner change', 80),
      ]),
      zone('Restrooms (6)', [
        zt('default-33', 'Full Restroom Service', 6, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 6, '5x_week', 'Supply cart', 30),
      ]),
    ],
  },
  {
    id: 'school-k12',
    name: 'K-12 School Building',
    description: '40,000 SF school with classrooms, gym, cafeteria, admin, restrooms, and hallways',
    industry: 'janitorial',
    sqft: 40000,
    floors: 2,
    zones: [
      zone('Classrooms (20)', [
        zt('default-24', 'Vacuuming — Upright', 15000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 20, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 15000, 'weekly', 'Microfiber cloth', 5000),
      ]),
      zone('Gymnasium', [
        zt('default-2', 'Dust Mopping', 6000, '5x_week', '48" dust mop', 15000),
        zt('default-8', 'Machine Scrubbing', 6000, 'weekly', 'Autoscrubber 20"', 10000),
      ]),
      zone('Cafeteria', [
        zt('default-8', 'Machine Scrubbing', 3000, '5x_week', 'Autoscrubber 20"', 10000),
        zt('default-37', 'Trash Collection', 10, '5x_week', 'Liner change', 80),
      ]),
      zone('Hallways & Common Areas', [
        zt('default-2', 'Dust Mopping', 8000, '5x_week', '36" dust mop', 10000),
        zt('default-6', 'Wet Mopping', 8000, '3x_week', 'Flat mop — 18"', 3500),
      ]),
      zone('Admin & Front Office', [
        zt('default-24', 'Vacuuming — Upright', 2000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 5, '5x_week', 'Liner change', 80),
      ]),
      zone('Restrooms (10)', [
        zt('default-33', 'Full Restroom Service', 10, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 10, '5x_week', 'Supply cart', 30),
      ]),
    ],
  },
  {
    id: 'warehouse',
    name: 'Warehouse / Distribution Center',
    description: '50,000 SF warehouse with office area, break room, loading dock, and restrooms',
    industry: 'janitorial',
    sqft: 50000,
    floors: 1,
    zones: [
      zone('Office Area', [
        zt('default-24', 'Vacuuming — Upright', 3000, '5x_week', '14" upright vacuum', 2500),
        zt('default-37', 'Trash Collection', 10, '5x_week', 'Liner change', 80),
        zt('default-38', 'Dusting — Low', 3000, 'weekly', 'Microfiber cloth', 5000),
      ]),
      zone('Warehouse Floor', [
        zt('default-2', 'Dust Mopping', 40000, '3x_week', '48" dust mop', 15000),
        zt('default-8', 'Machine Scrubbing', 40000, 'monthly', 'Autoscrubber 28"', 15000),
      ]),
      zone('Break Room & Loading Dock', [
        zt('default-6', 'Wet Mopping', 1500, '5x_week', 'Flat mop — 18"', 3500),
        zt('default-37', 'Trash Collection', 5, '5x_week', 'Liner change', 80),
        zt('default-42', 'Break Room Service', 1, '5x_week', 'Standard service', 6),
      ]),
      zone('Restrooms (4)', [
        zt('default-33', 'Full Restroom Service', 4, '5x_week', 'Full service kit', 12),
        zt('default-35', 'Restroom Restock', 4, '5x_week', 'Supply cart', 30),
      ]),
    ],
  },
  {
    id: 'security-office',
    name: 'Security — Federal Office Complex',
    description: '3 entry points, lobby, parking garage, 2 floors of offices. 24/7 coverage.',
    industry: 'security',
    sqft: 75000,
    floors: 2,
    zones: [
      zone('Main Entry Screening', [
        zt('industry-1013', 'Screening (X-Ray/Mag)', 1, '5x_week', '2 guards', 0.5),
        zt('industry-1011', 'Badge Verification', 1, '5x_week', '1 guard', 1),
      ]),
      zone('Lobby Desk', [
        zt('industry-1000', 'Lobby/Reception Desk', 1, '5x_week', '1 guard', 1),
        zt('industry-1012', 'Visitor Processing', 1, '5x_week', '1 guard', 1),
      ]),
      zone('Parking Garage', [
        zt('industry-1001', 'Gate/Vehicle Entry', 1, '5x_week', '1 guard', 1),
        zt('industry-1005', 'Parking Garage Booth', 1, '5x_week', '1 guard', 1),
      ]),
      zone('Interior Patrol', [
        zt('industry-1006', 'Interior Foot Patrol', 1, '5x_week', '1 guard', 1),
      ]),
      zone('Exterior Patrol', [
        zt('industry-1007', 'Exterior Foot Patrol', 1, '5x_week', '1 guard', 1),
      ]),
      zone('Monitoring', [
        zt('industry-1018', 'CCTV Monitoring', 1, '5x_week', '1 operator', 1),
      ]),
      zone('Supervision', [
        zt('industry-1021', 'Shift Supervisor', 1, '5x_week', '1 supervisor', 1),
      ]),
    ],
  },
  {
    id: 'landscape-campus',
    name: 'Landscaping — Corporate Campus',
    description: '10-acre corporate campus with turf, parking lots, building entries, irrigation, seasonal snow',
    industry: 'landscaping',
    sqft: 435600,
    floors: 0,
    zones: [
      zone('Turf — Main Lawn', [
        zt('industry-1026', 'Zero-Turn Riding', 200000, 'weekly', '60" zero-turn', 65000),
        zt('industry-1030', 'String Trimming', 5000, 'weekly', 'Gas string trimmer', 3500),
        zt('industry-1031', 'Edging — Sidewalks', 3000, 'biweekly', 'Stick edger', 2000),
      ]),
      zone('Building Entries (4)', [
        zt('industry-1037', 'Policing / Hand Pickup', 20000, '5x_week', 'Trash grabber', 10000),
        zt('industry-1034', 'Backpack Blowing', 15000, '5x_week', 'Backpack blower', 25000),
      ]),
      zone('Parking Lots', [
        zt('industry-1035', 'Walk-Behind Blowing', 100000, 'weekly', 'Wheeled blower', 40000),
        zt('industry-1037', 'Policing / Hand Pickup', 100000, 'weekly', 'Trash grabber', 10000),
      ]),
      zone('Beds & Planting', [
        zt('industry-1058', 'Mulch Installation', 5000, 'annually', 'Wheelbarrow', 200),
        zt('industry-1060', 'Weeding', 5000, 'biweekly', 'Hand tools', 500),
        zt('industry-1059', 'Bed Edging', 2000, 'monthly', 'Bed edger', 1000),
      ]),
      zone('Irrigation', [
        zt('industry-1038', 'Irrigation Inspection', 12, 'monthly', 'Visual + controller', 10),
      ]),
      zone('Snow & Ice (Seasonal)', [
        zt('industry-1049', 'Snow Plowing — Lot', 200000, 'annually', 'Truck plow', 40000),
        zt('industry-1052', 'De-Icing — Lot', 200000, 'annually', 'Spreader', 30000),
        zt('industry-1051', 'Snow Shoveling', 5000, 'annually', 'Manual shovel', 1500),
      ]),
    ],
  },
]

export const TEMPLATE_CATEGORIES = [
  { label: 'Janitorial', filter: 'janitorial' },
  { label: 'Security', filter: 'security' },
  { label: 'Landscaping', filter: 'landscaping' },
]
