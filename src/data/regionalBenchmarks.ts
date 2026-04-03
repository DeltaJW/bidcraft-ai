/**
 * Embedded BLS benchmark data for janitorial wages (SOC 37-2011 Janitors and Cleaners)
 * NAICS 561720 — Janitorial Services
 *
 * Source reference: BLS Occupational Employment and Wage Statistics (OEWS), May 2025
 * Cost of Living Index: BEA Regional Price Parities / C2ER COLI, 100 = national average
 */

export interface MetroBenchmark {
  metro: string
  state: string
  medianWage: number        // BLS median hourly
  percentile25: number      // 25th percentile hourly
  percentile75: number      // 75th percentile hourly
  percentile90: number      // 90th percentile hourly
  costOfLivingIndex: number // 100 = national average
}

export const NATIONAL_MEDIAN = 15.15 // BLS national median for SOC 37-2011

export const METRO_BENCHMARKS: MetroBenchmark[] = [
  {
    metro: 'Washington-Arlington-Alexandria',
    state: 'DC-VA-MD',
    medianWage: 17.50,
    percentile25: 15.25,
    percentile75: 20.10,
    percentile90: 23.50,
    costOfLivingIndex: 130,
  },
  {
    metro: 'New York-Newark-Jersey City',
    state: 'NY-NJ-PA',
    medianWage: 19.00,
    percentile25: 16.50,
    percentile75: 22.00,
    percentile90: 25.80,
    costOfLivingIndex: 135,
  },
  {
    metro: 'Los Angeles-Long Beach-Anaheim',
    state: 'CA',
    medianWage: 17.00,
    percentile25: 16.00,
    percentile75: 19.50,
    percentile90: 22.00,
    costOfLivingIndex: 125,
  },
  {
    metro: 'San Francisco-Oakland-Berkeley',
    state: 'CA',
    medianWage: 19.50,
    percentile25: 17.00,
    percentile75: 23.00,
    percentile90: 27.00,
    costOfLivingIndex: 145,
  },
  {
    metro: 'Chicago-Naperville-Elgin',
    state: 'IL-IN-WI',
    medianWage: 16.00,
    percentile25: 14.00,
    percentile75: 18.50,
    percentile90: 21.00,
    costOfLivingIndex: 107,
  },
  {
    metro: 'Houston-The Woodlands-Sugar Land',
    state: 'TX',
    medianWage: 13.50,
    percentile25: 11.50,
    percentile75: 15.75,
    percentile90: 18.00,
    costOfLivingIndex: 96,
  },
  {
    metro: 'Dallas-Fort Worth-Arlington',
    state: 'TX',
    medianWage: 13.00,
    percentile25: 11.00,
    percentile75: 15.50,
    percentile90: 17.80,
    costOfLivingIndex: 98,
  },
  {
    metro: 'Atlanta-Sandy Springs-Alpharetta',
    state: 'GA',
    medianWage: 13.50,
    percentile25: 11.75,
    percentile75: 15.50,
    percentile90: 17.50,
    costOfLivingIndex: 100,
  },
  {
    metro: 'Boston-Cambridge-Nashua',
    state: 'MA-NH',
    medianWage: 18.00,
    percentile25: 15.75,
    percentile75: 21.00,
    percentile90: 24.50,
    costOfLivingIndex: 128,
  },
  {
    metro: 'Seattle-Tacoma-Bellevue',
    state: 'WA',
    medianWage: 18.50,
    percentile25: 16.50,
    percentile75: 21.50,
    percentile90: 24.00,
    costOfLivingIndex: 130,
  },
  {
    metro: 'Denver-Aurora-Lakewood',
    state: 'CO',
    medianWage: 16.50,
    percentile25: 14.50,
    percentile75: 19.00,
    percentile90: 21.50,
    costOfLivingIndex: 113,
  },
  {
    metro: 'Phoenix-Mesa-Chandler',
    state: 'AZ',
    medianWage: 14.50,
    percentile25: 12.50,
    percentile75: 16.50,
    percentile90: 18.50,
    costOfLivingIndex: 100,
  },
  {
    metro: 'Philadelphia-Camden-Wilmington',
    state: 'PA-NJ-DE-MD',
    medianWage: 15.50,
    percentile25: 13.50,
    percentile75: 18.00,
    percentile90: 20.50,
    costOfLivingIndex: 110,
  },
  {
    metro: 'Minneapolis-St. Paul-Bloomington',
    state: 'MN-WI',
    medianWage: 15.00,
    percentile25: 13.25,
    percentile75: 17.25,
    percentile90: 19.50,
    costOfLivingIndex: 105,
  },
  {
    metro: 'San Diego-Chula Vista-Carlsbad',
    state: 'CA',
    medianWage: 16.50,
    percentile25: 16.00,
    percentile75: 19.00,
    percentile90: 21.50,
    costOfLivingIndex: 120,
  },
  {
    metro: 'Miami-Fort Lauderdale-Pompano Beach',
    state: 'FL',
    medianWage: 14.00,
    percentile25: 12.50,
    percentile75: 16.00,
    percentile90: 18.00,
    costOfLivingIndex: 108,
  },
  {
    metro: 'Virginia Beach-Norfolk-Newport News',
    state: 'VA-NC',
    medianWage: 14.50,
    percentile25: 12.25,
    percentile75: 16.50,
    percentile90: 18.50,
    costOfLivingIndex: 98,
  },
  {
    metro: 'Richmond',
    state: 'VA',
    medianWage: 14.00,
    percentile25: 12.00,
    percentile75: 16.00,
    percentile90: 18.00,
    costOfLivingIndex: 97,
  },
  {
    metro: 'San Antonio-New Braunfels',
    state: 'TX',
    medianWage: 12.50,
    percentile25: 10.75,
    percentile75: 14.50,
    percentile90: 16.50,
    costOfLivingIndex: 90,
  },
  {
    metro: 'Nashville-Davidson-Murfreesboro-Franklin',
    state: 'TN',
    medianWage: 14.00,
    percentile25: 12.00,
    percentile75: 16.25,
    percentile90: 18.50,
    costOfLivingIndex: 100,
  },
]
