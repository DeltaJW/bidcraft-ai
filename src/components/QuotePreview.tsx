import { forwardRef } from 'react'
import type { Company, QuoteTask, MaterialItem } from '@/types'

interface Props {
  company: Company
  title: string
  contractRef: string
  location: string
  scopeDescription: string
  tasks: QuoteTask[]
  materials: MaterialItem[]
  totalHours: number
  totalLabor: number
  totalMaterials: number
  grandTotal: number
  burdenRate: number
  burdenProfileName: string
}

const QuotePreview = forwardRef<HTMLDivElement, Props>(function QuotePreview(
  {
    company,
    title,
    contractRef,
    location,
    scopeDescription,
    tasks,
    materials,
    totalHours,
    totalLabor,
    totalMaterials,
    grandTotal,
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
      className="max-w-3xl mx-auto bg-white text-gray-900 p-10 rounded-lg shadow-lg"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', lineHeight: '1.5' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-navy-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {company.logoUrl && (
            <img src={company.logoUrl} alt="" className="w-16 h-16 object-contain" />
          )}
          <div>
            <h1 className="text-xl font-bold text-navy-900">
              {company.name || 'Your Company Name'}
            </h1>
            {company.address && (
              <p className="text-gray-500 text-xs">{company.address}</p>
            )}
            {(company.cageCode || company.uei) && (
              <p className="text-gray-500 text-xs mt-0.5">
                {company.cageCode && `CAGE: ${company.cageCode}`}
                {company.cageCode && company.uei && ' | '}
                {company.uei && `UEI: ${company.uei}`}
              </p>
            )}
            {company.setAside && (
              <p className="text-xs mt-0.5">
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
                  {company.setAside}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-navy-900">QUOTE</h2>
          <p className="text-gray-500 text-xs">Date: {today}</p>
          {contractRef && (
            <p className="text-gray-500 text-xs">Ref: {contractRef}</p>
          )}
        </div>
      </div>

      {/* Quote Title */}
      <h3 className="text-base font-bold text-navy-900 mb-1">{title || 'Task Order Quote'}</h3>
      {location && <p className="text-gray-600 text-xs mb-3">Location: {location}</p>}

      {/* Scope */}
      {scopeDescription && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Scope of Work
          </h4>
          <p className="text-gray-600">{scopeDescription}</p>
        </div>
      )}

      {/* Labor Table */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Labor
        </h4>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Task</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Equipment</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Sq Ft</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Hours</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Cost</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-1.5 border border-gray-200">{t.taskName}</td>
                <td className="px-3 py-1.5 border border-gray-200 text-gray-500">{t.equipment}</td>
                <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">{t.sqft.toLocaleString()}</td>
                <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">{t.hours.toFixed(2)}</td>
                <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">${t.laborCost.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={3} className="px-3 py-2 border border-gray-200">Labor Subtotal</td>
              <td className="px-3 py-2 border border-gray-200 text-right font-mono">{totalHours.toFixed(2)}</td>
              <td className="px-3 py-2 border border-gray-200 text-right font-mono">${totalLabor.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Materials Table */}
      {materials.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Materials
          </h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Item</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Unit Cost</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Qty</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200">Total</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-1.5 border border-gray-200">{m.name}</td>
                  <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">${m.unitCost.toFixed(2)}</td>
                  <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">{m.quantity} {m.unit}</td>
                  <td className="px-3 py-1.5 border border-gray-200 text-right font-mono">${(m.unitCost * m.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={3} className="px-3 py-2 border border-gray-200">Materials Subtotal</td>
                <td className="px-3 py-2 border border-gray-200 text-right font-mono">${totalMaterials.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Grand Total */}
      <div className="bg-navy-900 text-white rounded-lg p-4 flex justify-between items-center mb-6"
        style={{ backgroundColor: '#0f1f38' }}
      >
        <span className="font-bold text-base">TOTAL QUOTE</span>
        <span className="text-2xl font-bold font-mono">${grandTotal.toFixed(2)}</span>
      </div>

      {/* Burden footnote */}
      {burdenProfileName && (
        <p className="text-xs text-gray-400 mb-4">
          * Labor rates based on burden profile: {burdenProfileName}
        </p>
      )}

      {/* Assumptions */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Terms & Conditions
        </h4>
        <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
          <li>Quote valid for 30 days from date of issue</li>
          <li>Prices based on standard business hours; overtime rates may apply</li>
          <li>Materials pricing subject to supplier availability</li>
          <li>Additional work beyond stated scope will be quoted separately</li>
        </ul>
      </div>

      {/* Signature blocks */}
      <div className="grid grid-cols-2 gap-8 mt-10">
        <div>
          <div className="border-b border-gray-300 mb-1 h-10" />
          <p className="text-xs text-gray-500">Authorized Signature — Contractor</p>
          {company.contactName && (
            <p className="text-xs text-gray-700 mt-1">{company.contactName}, {company.contactTitle}</p>
          )}
        </div>
        <div>
          <div className="border-b border-gray-300 mb-1 h-10" />
          <p className="text-xs text-gray-500">Authorized Signature — Client</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          {company.name || 'Your Company'}{' '}
          {company.contactPhone && `| ${company.contactPhone}`}{' '}
          {company.contactEmail && `| ${company.contactEmail}`}
        </p>
        <p className="text-xs text-gray-300 mt-1">Generated by BidCraft AI</p>
      </div>
    </div>
  )
})

export default QuotePreview
