import { forwardRef } from 'react'
import type { Company } from '@/types'

interface Props {
  company: Company
  title: string
  contractRef: string
  location: string
  submittedTo: string
  date: string
}

const ProposalCoverPage = forwardRef<HTMLDivElement, Props>(function ProposalCoverPage(
  { company, title, contractRef, location, submittedTo, date },
  ref
) {
  return (
    <div
      ref={ref}
      className="print-quote"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          padding: '60pt 50pt',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '9in',
          boxSizing: 'border-box',
          justifyContent: 'center',
        }}
      >
        {/* Company Logo */}
        {company.logoUrl && (
          <img
            src={company.logoUrl}
            alt={company.name}
            style={{
              maxHeight: '80pt',
              maxWidth: '280pt',
              objectFit: 'contain',
              marginBottom: '16pt',
            }}
          />
        )}

        {/* Company Name */}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '24pt',
            fontWeight: 700,
            color: '#17355E',
            letterSpacing: '0.02em',
            marginBottom: '6pt',
          }}
        >
          {company.name || 'Your Company Name'}
        </div>

        {/* Address */}
        {company.address && (
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '10pt',
              color: '#444',
              marginBottom: '4pt',
            }}
          >
            {company.address}
          </div>
        )}

        {/* CAGE / UEI */}
        {(company.cageCode || company.uei) && (
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '9.5pt',
              color: '#555',
              marginBottom: '6pt',
            }}
          >
            {company.cageCode && `CAGE: ${company.cageCode}`}
            {company.cageCode && company.uei && ' | '}
            {company.uei && `UEI: ${company.uei}`}
          </div>
        )}

        {/* Set-aside badge */}
        {company.setAside && (
          <div
            style={{
              display: 'inline-block',
              background: '#17355E',
              color: 'white',
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '8.5pt',
              fontWeight: 700,
              padding: '3pt 12pt',
              borderRadius: '3pt',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8pt',
            }}
          >
            {company.setAside}
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '2pt',
            background: '#17355E',
            margin: '20pt 0',
          }}
        />

        {/* Document Type */}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '18pt',
            fontWeight: 700,
            color: '#17355E',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '28pt',
          }}
        >
          Cost / Price Proposal
        </div>

        {/* In Response To */}
        {contractRef && (
          <div style={{ marginBottom: '20pt' }}>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9pt',
                fontWeight: 700,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4pt',
              }}
            >
              In Response To:
            </div>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '12pt',
                color: '#1A1A1A',
                fontWeight: 600,
              }}
            >
              {contractRef}
            </div>
          </div>
        )}

        {/* For */}
        <div style={{ marginBottom: '20pt' }}>
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '9pt',
              fontWeight: 700,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4pt',
            }}
          >
            For:
          </div>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '13pt',
              color: '#17355E',
              fontWeight: 700,
            }}
          >
            {title || 'Annual Janitorial Services Proposal'}
          </div>
        </div>

        {/* Location */}
        {location && (
          <div style={{ marginBottom: '20pt' }}>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9pt',
                fontWeight: 700,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4pt',
              }}
            >
              Location:
            </div>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '11pt',
                color: '#1A1A1A',
              }}
            >
              {location}
            </div>
          </div>
        )}

        {/* Submitted To */}
        {submittedTo && (
          <div style={{ marginBottom: '20pt' }}>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9pt',
                fontWeight: 700,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4pt',
              }}
            >
              Submitted To:
            </div>
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '11pt',
                color: '#1A1A1A',
                fontWeight: 600,
              }}
            >
              {submittedTo}
            </div>
          </div>
        )}

        {/* Submitted By */}
        <div style={{ marginBottom: '24pt' }}>
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '9pt',
              fontWeight: 700,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4pt',
            }}
          >
            Submitted By:
          </div>
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '11pt',
              color: '#1A1A1A',
              fontWeight: 600,
              marginBottom: '2pt',
            }}
          >
            {company.name || 'Your Company Name'}
          </div>
          {company.contactName && (
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '10pt',
                color: '#444',
              }}
            >
              {company.contactName}
              {company.contactTitle && `, ${company.contactTitle}`}
            </div>
          )}
          {(company.contactPhone || company.contactEmail) && (
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9.5pt',
                color: '#555',
                marginTop: '2pt',
              }}
            >
              {company.contactPhone}
              {company.contactPhone && company.contactEmail && ' | '}
              {company.contactEmail}
            </div>
          )}
        </div>

        {/* Date */}
        <div
          style={{
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '10.5pt',
            color: '#1A1A1A',
            fontWeight: 600,
            marginBottom: '24pt',
          }}
        >
          Date: {date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1pt',
            background: '#17355E',
            margin: '0 0 20pt 0',
          }}
        />

        {/* Proprietary Notice */}
        <div
          style={{
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '8pt',
            fontWeight: 700,
            color: '#17355E',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6pt',
          }}
        >
          Proprietary Notice
        </div>
        <div
          style={{
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '7.5pt',
            color: '#666',
            lineHeight: 1.5,
            maxWidth: '420pt',
          }}
        >
          This proposal contains proprietary information. It shall not be disclosed outside
          the Government and shall not be duplicated, used, or disclosed for any purpose
          other than evaluation of this proposal.
        </div>
      </div>
    </div>
  )
})

export default ProposalCoverPage
