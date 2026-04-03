import type { RateItem } from '@/types'

// Rates below this threshold are per-unit, not per-sqft
const PER_UNIT_THRESHOLD = 100

export function isPerUnit(rate: { sqftPerHour: number; category?: string }): boolean {
  return rate.sqftPerHour < PER_UNIT_THRESHOLD
}

export function getUnitLabel(rate: { sqftPerHour: number; category?: string; task?: string }): string {
  if (!isPerUnit(rate)) return 'Sq Ft'
  const cat = rate.category?.toLowerCase() ?? ''
  const task = rate.task?.toLowerCase() ?? ''
  if (cat.includes('restroom')) return 'Units'
  if (task.includes('restroom')) return 'Restrooms'
  if (task.includes('trash')) return 'Cans'
  if (task.includes('entrance') || task.includes('glass') || task.includes('door')) return 'Doors'
  if (task.includes('mat')) return 'Mats'
  if (task.includes('stairwell') || task.includes('flight')) return 'Flights'
  if (task.includes('elevator') || task.includes('cab')) return 'Cabs'
  if (task.includes('break room') || task.includes('room')) return 'Rooms'
  if (task.includes('fixture')) return 'Fixtures'
  return 'Units'
}

export function formatRate(rate: { sqftPerHour: number }): string {
  if (rate.sqftPerHour < PER_UNIT_THRESHOLD) return `${rate.sqftPerHour}/hr`
  if (rate.sqftPerHour >= 10000) return `${(rate.sqftPerHour / 1000).toFixed(0)}K sf/hr`
  return `${rate.sqftPerHour.toLocaleString()} sf/hr`
}
