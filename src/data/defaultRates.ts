import type { RateItem } from '@/types'

let nextId = 1
function rate(
  category: string,
  task: string,
  equipment: string,
  method: string,
  sqftPerHour: number,
  overheadMultiplier = 1.0
): RateItem {
  return {
    id: `default-${nextId++}`,
    category,
    task,
    equipment,
    method,
    sqftPerHour,
    overheadMultiplier,
    isCustom: false,
  }
}

export const DEFAULT_RATES: RateItem[] = [
  // === Floor Care — Hard Surface ===
  rate('Floor Care — Hard Surface', 'Dust Mopping', '24" dust mop', 'Manual push', 6_500),
  rate('Floor Care — Hard Surface', 'Dust Mopping', '36" dust mop', 'Manual push', 10_000),
  rate('Floor Care — Hard Surface', 'Dust Mopping', '48" dust mop', 'Manual push', 15_000),
  rate('Floor Care — Hard Surface', 'Wet Mopping', 'String mop — single bucket', 'Manual wringing', 2_000),
  rate('Floor Care — Hard Surface', 'Wet Mopping', 'String mop — dual bucket', 'Wringer bucket', 2_500),
  rate('Floor Care — Hard Surface', 'Wet Mopping', 'Flat mop 18"', 'Microfiber pad', 4_000),
  rate('Floor Care — Hard Surface', 'Wet Mopping', 'Flat mop 24"', 'Microfiber pad', 5_500),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Microscrubber 13"', 'Walk-behind', 4_000),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Microscrubber 17"', 'Walk-behind', 5_500),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Autoscrubber 20"', 'Walk-behind', 10_000),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Autoscrubber 26"', 'Walk-behind', 18_000),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Autoscrubber 32"', 'Ride-on', 30_000),
  rate('Floor Care — Hard Surface', 'Machine Scrubbing', 'Autoscrubber 36"', 'Ride-on', 38_000),
  rate('Floor Care — Hard Surface', 'Burnishing', 'Electric burnisher 17" 1500 RPM', 'Walk-behind', 12_000),
  rate('Floor Care — Hard Surface', 'Burnishing', 'Electric burnisher 20" 1500 RPM', 'Walk-behind', 16_000),
  rate('Floor Care — Hard Surface', 'Burnishing', 'Electric burnisher 20" 2000 RPM', 'Walk-behind', 20_000),
  rate('Floor Care — Hard Surface', 'Spray Buff', 'Rotary 17"', 'With spray solution', 5_000),
  rate('Floor Care — Hard Surface', 'Spray Buff', 'Rotary 20"', 'With spray solution', 6_000),
  rate('Floor Care — Hard Surface', 'Scrub & Recoat', 'Rotary 17"', 'Strip pad + 2 coats', 1_500, 1.15),
  rate('Floor Care — Hard Surface', 'Scrub & Recoat', 'Rotary 20"', 'Strip pad + 2 coats', 2_000, 1.15),
  rate('Floor Care — Hard Surface', 'Strip & Refinish', 'Rotary + wet vac', 'Full strip, 4 coats', 500, 1.25),
  rate('Floor Care — Hard Surface', 'Deep Scrub Ceramic/Grout', 'Rotary w/ brush', 'Chemical + extraction', 800, 1.1),

  // === Carpet Care ===
  rate('Carpet Care', 'Vacuuming', 'Upright 12"', 'Single-motor', 3_000),
  rate('Carpet Care', 'Vacuuming', 'Upright 15"', 'Dual-motor', 4_500),
  rate('Carpet Care', 'Vacuuming', 'Upright 18"', 'Commercial', 5_500),
  rate('Carpet Care', 'Vacuuming', 'Backpack — corded', 'HEPA filter', 5_000),
  rate('Carpet Care', 'Vacuuming', 'Backpack — cordless', 'HEPA filter', 4_500),
  rate('Carpet Care', 'Vacuuming', 'Wide-area 28"', 'Walk-behind', 20_000),
  rate('Carpet Care', 'Vacuuming', 'Wide-area 36"', 'Walk-behind', 30_000),
  rate('Carpet Care', 'Bonnet/Pad Cleaning', 'Rotary 17" w/ bonnet', 'Encapsulation', 3_000, 1.05),
  rate('Carpet Care', 'Bonnet/Pad Cleaning', 'Rotary 20" w/ bonnet', 'Encapsulation', 4_000, 1.05),
  rate('Carpet Care', 'Hot Water Extraction', 'Portable extractor — 12" wand', 'Truck or portable', 800, 1.15),
  rate('Carpet Care', 'Hot Water Extraction', 'Portable extractor — 15" wand', 'Truck or portable', 1_200, 1.15),
  rate('Carpet Care', 'Spot Treatment', 'Spot kit', 'Manual application', 400),

  // === Restroom Services ===
  rate('Restroom Services', 'Full Restroom Service', 'Standard kit', 'Per restroom — avg 6 fixtures', 12),
  rate('Restroom Services', 'Per-Fixture Cleaning', 'Standard kit', 'Per fixture', 60),
  rate('Restroom Services', 'Restroom Restock', 'Supply cart', 'Refill dispensers only', 30),
  rate('Restroom Services', 'Machine Scrub Floor', 'Microscrubber 13"', 'Restroom floor only', 2_000),

  // === Other Tasks ===
  rate('Other Tasks', 'Trash Collection & Liner Change', 'Trash cart', 'Per can', 40),
  rate('Other Tasks', 'Dusting — Low', 'Microfiber duster', 'Surfaces below 6 ft', 8_000),
  rate('Other Tasks', 'Dusting — High', 'Extension duster', 'Surfaces above 6 ft', 3_500),
  rate('Other Tasks', 'Surface Wipe / Disinfect', 'Microfiber cloth', 'Spray and wipe', 3_000),
  rate('Other Tasks', 'Entrance Glass', 'Squeegee + cloth', 'Per door — both sides', 15),
  rate('Other Tasks', 'Walk-Off Mat Service', 'Vacuum + extract', 'Per mat', 20),
  rate('Other Tasks', 'Stairwell Cleaning', 'Vacuum + mop', 'Per flight', 10),
  rate('Other Tasks', 'Elevator Cab Cleaning', 'Standard kit', 'Per cab', 8),
  rate('Other Tasks', 'Break Room Service', 'Standard kit', 'Full service per room', 6),
]

export const RATE_CATEGORIES = [...new Set(DEFAULT_RATES.map((r) => r.category))]
