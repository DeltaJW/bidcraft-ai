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

const fmt = (n: number) =>
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
    <div ref={ref} className="print-quote max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div style={{ padding: '40pt 34pt' }}>
        {/* Letterhead Header */}
        <div className="quote-header">
          <div className="flex items-center gap-4">
            {company.logoUrl && (
              <img src={company.logoUrl} alt="" style={{ height: '44pt', objectFit: 'contain' }} />
            )}
            <div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20pt', fontWeight: 700, color: '#17355E', margin: 0 }}>
                {company.name || 'Your Company Name'}
              </h1>
              <div style={{ display: 'flex', gap: '12pt', marginTop: '4pt', fontSize: '8.5pt', color: '#666' }}>
                {company.cageCode && <span>CAGE: {company.cageCode}</span>}
                {company.uei && <span>UEI: {company.uei}</span>}
                {company.setAside && (
                  <span style={{ background: '#17355E', color: 'white', padding: '1pt 6pt', borderRadius: '2pt', fontWeight: 600 }}>
                    {company.setAside}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="company-info">
            {company.address && <div>{company.address}</div>}
            {company.contactPhone && <div>{company.contactPhone}</div>}
            {company.contactEmail && <div>{company.contactEmail}</div>}
          </div>
        </div>

        {/* Document Title */}
        <h2>PROPOSAL</h2>

        {/* Contract Info */}
        <div className="info-grid">
          <span className="info-label">Date:</span>
          <span className="info-value">{today}</span>
          {contractRef && (
            <>
              <span className="info-label">Contract Ref:</span>
              <span className="info-value">{contractRef}</span>
            </>
          )}
          {location && (
            <>
              <span className="info-label">Location:</span>
              <span className="info-value">{location}</span>
            </>
          )}
          {company.contactName && (
            <>
              <span className="info-label">Prepared By:</span>
              <span className="info-value">
                {company.contactName}{company.contactTitle && `, ${company.contactTitle}`}
              </span>
            </>
          )}
          {burdenProfileName && (
            <>
              <span className="info-label">Rate Profile:</span>
              <span className="info-value">{burdenProfileName}</span>
            </>
          )}
        </div>

        {/* Proposal Title */}
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', fontWeight: 700, color: '#17355E', marginBottom: '10pt' }}>
          {title || 'Annual Janitorial Services Proposal'}
        </p>

        {/* Scope of Work */}
        {scopeDescription && (
          <div style={{ marginBottom: '16pt' }}>
            <h3>SCOPE OF WORK</h3>
            <p style={{ color: '#333', lineHeight: 1.6 }}>{scopeDescription}</p>
          </div>
        )}

        {/* Labor by Zone */}
        <h3>LABOR — DETAILED BREAKDOWN BY ZONE</h3>

        {zones.map((zone) => {
          const zoneHours = zone.tasks.reduce((s, t) => s + t.annualHours, 0)
          const zoneCost = zone.tasks.reduce((s, t) => s + t.laborCost, 0)
          return (
            <div key={zone.id} style={{ marginBottom: '12pt' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5pt 10pt', background: '#DCE4F0', borderRadius: '3pt', marginBottom: '4pt'
              }}>
                <span style={{ fontWeight: 700, fontSize: '10pt', color: '#17355E' }}>{zone.name}</span>
                <span style={{ fontSize: '8.5pt', color: '#555' }}>
                  {zoneHours.toFixed(1)} hrs/yr | {fmt(zoneCost)}
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Equipment</th>
                    <th style={{ textAlign: 'right' }}>Area (SF)</th>
                    <th>Frequency</th>
                    <th style={{ textAlign: 'right' }}>Hrs/Yr</th>
                    <th style={{ textAlign: 'right' }}>Annual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.taskName}</td>
                      <td style={{ color: '#666' }}>{t.equipment}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.sqft.toLocaleString()}</td>
                      <td style={{ color: '#666' }}>{t.frequency.replace('_', 'x/')}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.annualHours.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(t.laborCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Labor Total */}
        <table>
          <tbody>
            <tr className="subtotal-row">
              <td>Total Labor</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {totalAnnualHours.toFixed(1)} hrs/yr
              </td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalLabor)}</td>
            </tr>
          </tbody>
        </table>

        {/* Materials */}
        {materials.length > 0 && (
          <div style={{ marginTop: '16pt' }}>
            <h3>MATERIALS & SUPPLIES</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Qty/Year</th>
                  <th style={{ textAlign: 'right' }}>Annual Cost</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(m.unitCost)}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.quantity} {m.unit}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(m.unitCost * m.quantity)}</td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td colSpan={3}>Materials Subtotal</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalMaterials)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Cost Summary Box */}
        <div style={{ marginTop: '16pt', border: '2pt solid #17355E', borderRadius: '4pt', overflow: 'hidden' }}>
          <div style={{ background: '#17355E', color: 'white', padding: '8pt 12pt', fontSize: '11pt', fontWeight: 700 }}>
            Cost Summary
          </div>
          <div style={{ padding: '12pt 16pt' }}>
            <table style={{ width: '100%', marginBottom: 0 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4pt 0', color: '#333', border: 'none' }}>Annual Labor</td>
                  <td style={{ padding: '4pt 0', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', border: 'none' }}>{fmt(totalLabor)}</td>
                </tr>
                {totalMaterials > 0 && (
                  <tr>
                    <td style={{ padding: '4pt 0', color: '#333', border: 'none' }}>Annual Materials</td>
                    <td style={{ padding: '4pt 0', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', border: 'none' }}>{fmt(totalMaterials)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ borderTop: '2pt solid #17355E', marginTop: '6pt', paddingTop: '8pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12pt', fontWeight: 700, color: '#17355E' }}>Annual Total</span>
              <span style={{ fontSize: '14pt', fontWeight: 700, color: '#17355E', fontVariantNumeric: 'tabular-nums' }}>{fmt(grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4pt' }}>
              <span style={{ fontSize: '9pt', color: '#666' }}>Monthly Equivalent</span>
              <span style={{ fontSize: '9pt', color: '#444', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthlyTotal)}</span>
            </div>
          </div>
        </div>

        {/* Assumptions */}
        {assumptions.length > 0 && (
          <div style={{ marginTop: '16pt' }}>
            <h3>ASSUMPTIONS & CONDITIONS</h3>
            <ol style={{ fontSize: '9pt', color: '#444', paddingLeft: '14pt', margin: 0, lineHeight: 1.6 }}>
              {assumptions.map((a, i) => (
                <li key={i} style={{ marginBottom: '3pt' }}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Signature blocks */}
        <div className="signatures">
          <div>
            <div className="sig-line" />
            <div className="sig-name">Authorized Representative — Contractor</div>
            {company.contactName && (
              <div style={{ fontSize: '9pt', color: '#333', marginTop: '4pt' }}>
                {company.contactName}{company.contactTitle && `, ${company.contactTitle}`}
              </div>
            )}
            <div style={{ fontSize: '8.5pt', color: '#666', marginTop: '4pt' }}>Date: _______________</div>
          </div>
          <div>
            <div className="sig-line" />
            <div className="sig-name">Authorized Representative — Client</div>
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
    </div>
  )
})

export default ProposalPreview
