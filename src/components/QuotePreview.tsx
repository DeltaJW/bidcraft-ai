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
    <div ref={ref} className="print-quote max-w-3xl mx-auto bg-white p-10 rounded-lg shadow-lg">
      {/* Letterhead Header */}
      <div className="quote-header">
        <div className="flex items-center gap-4">
          {company.logoUrl && (
            <img src={company.logoUrl} alt="" style={{ height: '44pt', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '18pt', fontWeight: 700, color: '#17355E', margin: 0 }}>
              {company.name || 'Your Company Name'}
            </h1>
            {company.setAside && (
              <span style={{ display: 'inline-block', background: '#17355E', color: 'white', padding: '2pt 8pt', borderRadius: '3pt', fontSize: '8pt', fontWeight: 600, marginTop: '4pt' }}>
                {company.setAside}
              </span>
            )}
          </div>
        </div>
        <div className="company-info">
          {company.address && <div>{company.address}</div>}
          {company.cageCode && <div>CAGE: {company.cageCode}</div>}
          {company.uei && <div>UEI: {company.uei}</div>}
          {company.contactPhone && <div>{company.contactPhone}</div>}
          {company.contactEmail && <div>{company.contactEmail}</div>}
        </div>
      </div>

      {/* Document Title */}
      <h2>COST ESTIMATE / QUOTE</h2>

      {/* Contract Info Grid */}
      <div className="info-grid">
        <span className="info-label">Date:</span>
        <span className="info-value">{today}</span>
        {contractRef && (
          <>
            <span className="info-label">Contract/PO Ref:</span>
            <span className="info-value">{contractRef}</span>
          </>
        )}
        {location && (
          <>
            <span className="info-label">Location:</span>
            <span className="info-value">{location}</span>
          </>
        )}
        {burdenProfileName && (
          <>
            <span className="info-label">Rate Profile:</span>
            <span className="info-value">{burdenProfileName}</span>
          </>
        )}
      </div>

      {/* Quote Title */}
      <p style={{ fontSize: '12pt', fontWeight: 700, color: '#17355E', marginBottom: '8pt' }}>
        {title || 'Task Order Quote'}
      </p>

      {/* Scope */}
      {scopeDescription && (
        <div style={{ marginBottom: '14pt' }}>
          <h3>SCOPE OF WORK</h3>
          <p>{scopeDescription}</p>
        </div>
      )}

      {/* Labor Table */}
      <h3>LABOR</h3>
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Equipment</th>
            <th className="numeric" style={{ textAlign: 'right' }}>Area (SF)</th>
            <th className="numeric" style={{ textAlign: 'right' }}>Hours</th>
            <th className="numeric" style={{ textAlign: 'right' }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.taskName}</td>
              <td style={{ color: '#666' }}>{t.equipment}</td>
              <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.sqft.toLocaleString()}</td>
              <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.hours.toFixed(2)}</td>
              <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${t.laborCost.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="subtotal-row">
            <td colSpan={3}>Labor Subtotal</td>
            <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{totalHours.toFixed(2)}</td>
            <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${totalLabor.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Materials Table */}
      {materials.length > 0 && (
        <>
          <h3>MATERIALS & SUPPLIES</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="numeric" style={{ textAlign: 'right' }}>Unit Cost</th>
                <th className="numeric" style={{ textAlign: 'right' }}>Qty</th>
                <th className="numeric" style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${m.unitCost.toFixed(2)}</td>
                  <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.quantity} {m.unit}</td>
                  <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${(m.unitCost * m.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={3}>Materials Subtotal</td>
                <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${totalMaterials.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Grand Total */}
      <table style={{ marginTop: '10pt' }}>
        <tbody>
          <tr className="total-row">
            <td>TOTAL QUOTE</td>
            <td className="numeric" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Terms */}
      <div style={{ marginTop: '16pt' }}>
        <h3>TERMS & CONDITIONS</h3>
        <ul style={{ fontSize: '9pt', color: '#444', paddingLeft: '14pt', margin: 0 }}>
          <li style={{ marginBottom: '3pt' }}>Quote valid for 30 days from date of issue</li>
          <li style={{ marginBottom: '3pt' }}>Prices based on standard business hours; overtime rates may apply</li>
          <li style={{ marginBottom: '3pt' }}>Materials pricing subject to supplier availability</li>
          <li style={{ marginBottom: '3pt' }}>Additional work beyond stated scope will be quoted separately</li>
        </ul>
      </div>

      {/* Signature blocks */}
      <div className="signatures">
        <div>
          <div className="sig-line" />
          <div className="sig-name">Authorized Signature — Contractor</div>
          {company.contactName && (
            <div style={{ fontSize: '9pt', color: '#333', marginTop: '4pt' }}>
              {company.contactName}{company.contactTitle && `, ${company.contactTitle}`}
            </div>
          )}
          <div style={{ fontSize: '8.5pt', color: '#666', marginTop: '4pt' }}>Date: _______________</div>
        </div>
        <div>
          <div className="sig-line" />
          <div className="sig-name">Authorized Signature — Client</div>
          <div style={{ fontSize: '8.5pt', color: '#666', marginTop: '4pt' }}>Name: _______________</div>
          <div style={{ fontSize: '8.5pt', color: '#666', marginTop: '4pt' }}>Date: _______________</div>
        </div>
      </div>

      {/* Footer */}
      <div className="doc-footer">
        {company.name || 'Your Company'}
        {company.contactPhone && ` | ${company.contactPhone}`}
        {company.contactEmail && ` | ${company.contactEmail}`}
        <br />
        Generated by BidCraft AI
      </div>
    </div>
  )
})

export default QuotePreview
