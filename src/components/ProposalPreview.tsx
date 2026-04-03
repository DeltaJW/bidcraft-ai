import { forwardRef } from 'react'
import type { Company, MaterialItem } from '@/types'

interface ProposalZone {
  id: string
  name: string
  tasks: Array<{
    id: string
    taskName: string
    equipment: string
    sqft: number
    frequency: string
    annualHours: number
    laborCost: number
  }>
}

interface Props {
  company: Company
  title: string
  contractRef: string
  location: string
  scopeDescription: string
  zones: ProposalZone[]
  materials: MaterialItem[]
  assumptions: string[]
  totalAnnualHours: number
  totalLabor: number
  totalMaterials: number
  grandTotal: number
  monthlyTotal: number
  burdenRate: number
  burdenProfileName: string
}

const $ = (n: number) =>
  '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ProposalPreview = forwardRef<HTMLDivElement, Props>(function ProposalPreview(
  {
    company,
    title,
    contractRef,
    location,
    scopeDescription,
    zones,
    materials,
    assumptions,
    totalAnnualHours,
    totalLabor,
    totalMaterials,
    grandTotal,
    monthlyTotal,
    burdenProfileName,
  },
  ref
) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      ref={ref}
      className="max-w-4xl mx-auto bg-white text-gray-900 rounded-lg shadow-lg"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', lineHeight: '1.5' }}
    >
      {/* Page 1: Cover & Scope */}
      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 pb-4 mb-8" style={{ borderColor: '#0f1f38' }}>
          <div className="flex items-center gap-4">
            {company.logoUrl && (
              <img src={company.logoUrl} alt="" className="w-20 h-20 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0f1f38' }}>
                {company.name || 'Your Company Name'}
              </h1>
              {company.address && <p className="text-gray-500 text-sm">{company.address}</p>}
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                {company.cageCode && <span>CAGE: {company.cageCode}</span>}
                {company.uei && <span>UEI: {company.uei}</span>}
                {company.setAside && (
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                    {company.setAside}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold" style={{ color: '#0f1f38' }}>PROPOSAL</h2>
            <p className="text-gray-500 text-sm">{today}</p>
            {contractRef && <p className="text-gray-500 text-sm">Ref: {contractRef}</p>}
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-1" style={{ color: '#0f1f38' }}>
            {title || 'Annual Janitorial Services Proposal'}
          </h3>
          {location && <p className="text-gray-600 text-sm">Location: {location}</p>}
          {company.contactName && (
            <p className="text-gray-600 text-sm mt-1">
              Prepared by: {company.contactName}
              {company.contactTitle && `, ${company.contactTitle}`}
            </p>
          )}
        </div>

        {/* Scope of Work */}
        {scopeDescription && (
          <div className="mb-8">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#0f1f38' }}>
              Scope of Work
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{scopeDescription}</p>
          </div>
        )}

        {/* Labor by Zone */}
        <div className="mb-8">
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#0f1f38' }}>
            Labor — Detailed Breakdown by Zone
          </h4>

          {zones.map((zone) => {
            const zoneHours = zone.tasks.reduce((s, t) => s + t.annualHours, 0)
            const zoneCost = zone.tasks.reduce((s, t) => s + t.laborCost, 0)
            return (
              <div key={zone.id} className="mb-4">
                <div className="flex justify-between items-center mb-1 px-2 py-1 rounded" style={{ backgroundColor: '#f0f4f8' }}>
                  <span className="font-semibold text-sm" style={{ color: '#0f1f38' }}>{zone.name}</span>
                  <span className="text-xs text-gray-500">
                    {zoneHours.toFixed(1)} hrs/yr | {$(zoneCost)}
                  </span>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Task</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Equipment/Method</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Area (SF)</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Frequency</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Hrs/Yr</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Annual Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zone.tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-2 py-1 border border-gray-200 text-xs">{t.taskName}</td>
                        <td className="px-2 py-1 border border-gray-200 text-xs text-gray-500">{t.equipment}</td>
                        <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{t.sqft.toLocaleString()}</td>
                        <td className="px-2 py-1 border border-gray-200 text-xs text-gray-500">{t.frequency.replace('_', 'x/')}</td>
                        <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{t.annualHours.toFixed(1)}</td>
                        <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{$(t.laborCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Labor subtotal */}
          <div className="flex justify-between px-2 py-2 font-semibold text-sm border-t-2" style={{ borderColor: '#0f1f38' }}>
            <span>Total Labor</span>
            <span>
              {totalAnnualHours.toFixed(1)} hrs/yr | {$(totalLabor)}
            </span>
          </div>
        </div>

        {/* Materials */}
        {materials.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#0f1f38' }}>
              Materials & Supplies
            </h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Item</th>
                  <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Unit Cost</th>
                  <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Qty/Year</th>
                  <th className="text-right px-2 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">Annual Cost</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="px-2 py-1 border border-gray-200 text-xs">{m.name}</td>
                    <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{$(m.unitCost)}</td>
                    <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{m.quantity} {m.unit}</td>
                    <td className="px-2 py-1 border border-gray-200 text-xs text-right font-mono">{$(m.unitCost * m.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-gray-50">
                  <td colSpan={3} className="px-2 py-1.5 border border-gray-200 text-xs">Materials Subtotal</td>
                  <td className="px-2 py-1.5 border border-gray-200 text-xs text-right font-mono">{$(totalMaterials)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Cost Summary */}
        <div className="mb-8 rounded-lg overflow-hidden" style={{ border: '2px solid #0f1f38' }}>
          <div className="px-4 py-2 text-white text-sm font-bold" style={{ backgroundColor: '#0f1f38' }}>
            Cost Summary
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-700">Annual Labor</td>
                  <td className="py-1 text-right font-mono font-semibold">{$(totalLabor)}</td>
                </tr>
                {totalMaterials > 0 && (
                  <tr>
                    <td className="py-1 text-gray-700">Annual Materials</td>
                    <td className="py-1 text-right font-mono font-semibold">{$(totalMaterials)}</td>
                  </tr>
                )}
                <tr className="border-t-2" style={{ borderColor: '#0f1f38' }}>
                  <td className="py-2 font-bold text-base" style={{ color: '#0f1f38' }}>Annual Total</td>
                  <td className="py-2 text-right font-mono font-bold text-lg" style={{ color: '#0f1f38' }}>
                    {$(grandTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-500">Monthly Equivalent</td>
                  <td className="py-1 text-right font-mono text-gray-600">{$(monthlyTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Burden footnote */}
        {burdenProfileName && (
          <p className="text-xs text-gray-400 mb-4">
            * Labor rates computed from burden profile: "{burdenProfileName}"
          </p>
        )}

        {/* Assumptions */}
        {assumptions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#0f1f38' }}>
              Assumptions & Conditions
            </h4>
            <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
              {assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-10 mt-12">
          <div>
            <div className="border-b border-gray-400 mb-1 h-12" />
            <p className="text-xs text-gray-600 font-semibold">Authorized Representative — Contractor</p>
            {company.contactName && (
              <p className="text-xs text-gray-500 mt-1">
                {company.contactName}{company.contactTitle && `, ${company.contactTitle}`}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-12" />
            <p className="text-xs text-gray-600 font-semibold">Authorized Representative — Client</p>
            <p className="text-xs text-gray-400 mt-1">Name: _______________</p>
            <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {company.name || 'Your Company'}{' '}
            {company.contactPhone && `| ${company.contactPhone}`}{' '}
            {company.contactEmail && `| ${company.contactEmail}`}
          </div>
          <div className="text-xs text-gray-300">Generated by BidCraft AI</div>
        </div>
      </div>
    </div>
  )
})

export default ProposalPreview
