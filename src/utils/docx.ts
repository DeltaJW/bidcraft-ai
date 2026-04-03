import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  TableLayoutType,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Company, MaterialItem } from '@/types'

/** Zone shape matching ProposalPreview's data */
export interface ProposalZone {
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

/** Everything the DOCX generator needs */
export interface ProposalData {
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

const NAVY = '17355E'
const LIGHT_BG = 'DCE4F0'
const fmt = (n: number) =>
  '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const today = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  return { top: none, bottom: none, left: none, right: none }
}

function thinBorders() {
  const b = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  return { top: b, bottom: b, left: b, right: b }
}

function headerCell(text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    borders: thinBorders(),
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18, font: 'Calibri' })],
      }),
    ],
  })
}

function dataCell(text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, bold = false) {
  return new TableCell({
    borders: thinBorders(),
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text, size: 18, font: 'Calibri', bold })],
      }),
    ],
  })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: NAVY, font: 'Georgia' }),
    ],
  })
}

function emptyParagraph(): Paragraph {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [] })
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export async function downloadDOCX(data: ProposalData, filename: string) {
  const {
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
  } = data

  const children: (Paragraph | Table)[] = []

  /* ---------- Header / Letterhead ---------- */
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: company.name || 'Your Company Name',
          bold: true,
          size: 40,
          color: NAVY,
          font: 'Georgia',
        }),
      ],
    })
  )

  if (company.address) {
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: company.address, size: 18, color: '666666', font: 'Calibri' })],
      })
    )
  }

  const idParts: string[] = []
  if (company.cageCode) idParts.push(`CAGE: ${company.cageCode}`)
  if (company.uei) idParts.push(`UEI: ${company.uei}`)
  if (company.setAside) idParts.push(company.setAside)
  if (idParts.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: idParts.join('  |  '), size: 17, color: '666666', font: 'Calibri' })],
      })
    )
  }

  /* ---------- Horizontal rule ---------- */
  children.push(
    new Paragraph({
      spacing: { before: 60, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: NAVY, space: 4 } },
      children: [],
    })
  )

  /* ---------- Document Title ---------- */
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: 'PROPOSAL', bold: true, size: 32, color: NAVY, font: 'Georgia' })],
    })
  )

  /* ---------- Proposal Title ---------- */
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: title || 'Annual Janitorial Services Proposal',
          bold: true,
          size: 26,
          color: NAVY,
          font: 'Georgia',
        }),
      ],
    })
  )

  /* ---------- Info Grid ---------- */
  const infoRows: [string, string][] = [['Date:', today()]]
  if (contractRef) infoRows.push(['Contract Ref:', contractRef])
  if (location) infoRows.push(['Location:', location])
  if (company.contactName) {
    const prep = company.contactName + (company.contactTitle ? `, ${company.contactTitle}` : '')
    infoRows.push(['Prepared By:', prep])
  }

  const infoTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: infoRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: [new TextRun({ text: label, bold: true, size: 20, color: NAVY, font: 'Calibri' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: [new TextRun({ text: value, size: 20, font: 'Calibri' })],
                }),
              ],
            }),
          ],
        })
    ),
  })
  children.push(infoTable)

  /* ---------- Scope of Work ---------- */
  if (scopeDescription) {
    children.push(sectionHeading('SCOPE OF WORK'))
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: scopeDescription, size: 20, font: 'Calibri', color: '333333' })],
      })
    )
  }

  /* ---------- Labor — Breakdown by Zone ---------- */
  children.push(sectionHeading('LABOR \u2014 BREAKDOWN BY ZONE'))

  for (const zone of zones) {
    const zoneHours = zone.tasks.reduce((s, t) => s + t.annualHours, 0)
    const zoneCost = zone.tasks.reduce((s, t) => s + t.laborCost, 0)

    // Zone header bar
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
        children: [
          new TextRun({ text: `${zone.name}`, bold: true, size: 20, color: NAVY, font: 'Calibri' }),
          new TextRun({
            text: `     ${zoneHours.toFixed(1)} hrs/yr  |  ${fmt(zoneCost)}`,
            size: 17,
            color: '555555',
            font: 'Calibri',
          }),
        ],
      })
    )

    // Zone table
    const tableRows: TableRow[] = [
      new TableRow({
        children: [
          headerCell('Task'),
          headerCell('Equipment'),
          headerCell('Sq Ft', AlignmentType.RIGHT),
          headerCell('Frequency'),
          headerCell('Hrs/Yr', AlignmentType.RIGHT),
          headerCell('Annual Cost', AlignmentType.RIGHT),
        ],
      }),
      ...zone.tasks.map(
        (t) =>
          new TableRow({
            children: [
              dataCell(t.taskName),
              dataCell(t.equipment),
              dataCell(t.sqft.toLocaleString(), AlignmentType.RIGHT),
              dataCell(t.frequency.replace('_', 'x/')),
              dataCell(t.annualHours.toFixed(1), AlignmentType.RIGHT),
              dataCell(fmt(t.laborCost), AlignmentType.RIGHT),
            ],
          })
      ),
    ]

    children.push(
      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    )
  }

  // Labor total row
  children.push(
    new Paragraph({
      spacing: { before: 80, after: 40 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Total Labor: ${totalAnnualHours.toFixed(1)} hrs/yr  —  `, size: 20, font: 'Calibri', bold: true }),
        new TextRun({ text: fmt(totalLabor), size: 20, font: 'Calibri', bold: true, color: NAVY }),
      ],
    })
  )

  /* ---------- Materials ---------- */
  if (materials.length > 0) {
    children.push(sectionHeading('MATERIALS'))

    const matRows: TableRow[] = [
      new TableRow({
        children: [
          headerCell('Item'),
          headerCell('Unit Cost', AlignmentType.RIGHT),
          headerCell('Qty/Year', AlignmentType.RIGHT),
          headerCell('Annual Cost', AlignmentType.RIGHT),
        ],
      }),
      ...materials.map(
        (m) =>
          new TableRow({
            children: [
              dataCell(m.name),
              dataCell(fmt(m.unitCost), AlignmentType.RIGHT),
              dataCell(`${m.quantity} ${m.unit}`, AlignmentType.RIGHT),
              dataCell(fmt(m.unitCost * m.quantity), AlignmentType.RIGHT),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            borders: thinBorders(),
            shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
            columnSpan: 3,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: 'Materials Subtotal', bold: true, size: 18, font: 'Calibri' })],
              }),
            ],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: fmt(totalMaterials), bold: true, size: 18, font: 'Calibri' })],
              }),
            ],
          }),
        ],
      }),
    ]

    children.push(
      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: matRows,
      })
    )
  }

  /* ---------- Cost Summary ---------- */
  children.push(sectionHeading('COST SUMMARY'))

  const summaryData: [string, string][] = [
    ['Annual Labor', fmt(totalLabor)],
  ]
  if (totalMaterials > 0) summaryData.push(['Annual Materials', fmt(totalMaterials)])
  summaryData.push(['Annual Total', fmt(grandTotal)])
  summaryData.push(['Monthly Equivalent', fmt(monthlyTotal)])

  const summaryRows = summaryData.map(
    ([label, value]) => {
      const isTotal = label === 'Annual Total'
      return new TableRow({
        children: [
          new TableCell({
            borders: thinBorders(),
            shading: isTotal ? { type: ShadingType.SOLID, color: NAVY, fill: NAVY } : undefined,
            children: [
              new Paragraph({
                spacing: { before: 50, after: 50 },
                children: [
                  new TextRun({
                    text: label,
                    bold: isTotal,
                    size: isTotal ? 24 : 20,
                    color: isTotal ? 'FFFFFF' : '333333',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: isTotal ? { type: ShadingType.SOLID, color: NAVY, fill: NAVY } : undefined,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 50, after: 50 },
                children: [
                  new TextRun({
                    text: value,
                    bold: isTotal,
                    size: isTotal ? 24 : 20,
                    color: isTotal ? 'FFFFFF' : '333333',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    }
  )

  children.push(
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 60, type: WidthType.PERCENTAGE },
      rows: summaryRows,
    })
  )

  /* ---------- Assumptions & Conditions ---------- */
  if (assumptions.length > 0) {
    children.push(sectionHeading('ASSUMPTIONS & CONDITIONS'))
    assumptions.forEach((a, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 18, font: 'Calibri', color: NAVY }),
            new TextRun({ text: a, size: 18, font: 'Calibri', color: '444444' }),
          ],
        })
      )
    })
  }

  /* ---------- Signature Blocks ---------- */
  children.push(emptyParagraph())
  children.push(emptyParagraph())

  // Contractor signature
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 20 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333', space: 1 } },
      children: [],
    })
  )
  children.push(
    new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: 'Authorized Representative \u2014 Contractor', size: 18, font: 'Calibri', color: '666666' })],
    })
  )
  if (company.contactName) {
    children.push(
      new Paragraph({
        spacing: { after: 10 },
        children: [
          new TextRun({
            text: company.contactName + (company.contactTitle ? `, ${company.contactTitle}` : ''),
            size: 18,
            font: 'Calibri',
            color: '333333',
          }),
        ],
      })
    )
  }
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: 'Date: _______________', size: 17, font: 'Calibri', color: '666666' })],
    })
  )

  // Client signature
  children.push(emptyParagraph())
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 20 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333', space: 1 } },
      children: [],
    })
  )
  children.push(
    new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: 'Authorized Representative \u2014 Client', size: 18, font: 'Calibri', color: '666666' })],
    })
  )
  children.push(
    new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: 'Name: _______________', size: 17, font: 'Calibri', color: '666666' })],
    })
  )
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: 'Date: _______________', size: 17, font: 'Calibri', color: '666666' })],
    })
  )

  /* ---------- Footer ---------- */
  const footerParts: string[] = [company.name || 'Your Company']
  if (company.contactPhone) footerParts.push(company.contactPhone)
  if (company.contactEmail) footerParts.push(company.contactEmail)

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 10 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 4 } },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: footerParts.join('  |  '), size: 16, color: '999999', font: 'Calibri' })],
    })
  )
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Generated by BidCraft AI', size: 14, color: 'AAAAAA', font: 'Calibri', italics: true })],
    })
  )

  /* ---------- Create and save document ---------- */
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
        },
      },
    },
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`)
}
