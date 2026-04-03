import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { rateLibraryStore } from '@/data/mockStore'
import type { RateItem } from '@/types'

// BidCraft fields that can be mapped
const BIDCRAFT_FIELDS = [
  { key: 'task', label: 'Task Name', required: true },
  { key: 'sqftPerHour', label: 'Production Rate (sf/hr)', required: true },
  { key: 'equipment', label: 'Equipment', required: false },
  { key: 'method', label: 'Method', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'overheadMultiplier', label: 'Overhead Multiplier', required: false },
] as const

type BidCraftFieldKey = (typeof BIDCRAFT_FIELDS)[number]['key']
type ColumnMapping = Record<string, BidCraftFieldKey | ''>
type ImportMode = 'replace' | 'add'

interface Props {
  open: boolean
  onClose: () => void
}

// Step transition variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export default function RateImportWizard({ open, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1 state
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])

  // Step 2 state
  const [mapping, setMapping] = useState<ColumnMapping>({})

  // Step 3 state
  const [importMode, setImportMode] = useState<ImportMode>('add')
  const [importing, setImporting] = useState(false)

  function reset() {
    setStep(1)
    setDirection(1)
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setImportMode('add')
    setImporting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function goToStep(target: number) {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  // --- Step 1: File parsing ---

  const handleFile = useCallback((file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ]
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      toast('Please upload an .xlsx, .xls, or .csv file', 'error')
      return
    }

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })

        if (jsonData.length < 2) {
          toast('File appears to be empty or has no data rows', 'error')
          return
        }

        const parsedHeaders = jsonData[0].map((h) => String(h).trim())
        const parsedRows = jsonData.slice(1).filter((row) =>
          row.some((cell) => String(cell).trim() !== '')
        ).map((row) => row.map((cell) => String(cell).trim()))

        setHeaders(parsedHeaders)
        setRows(parsedRows)

        // Auto-map columns by guessing
        const autoMapping: ColumnMapping = {}
        parsedHeaders.forEach((header) => {
          const h = header.toLowerCase()
          if (h.includes('task') || h.includes('name') || h.includes('description') || h.includes('service')) {
            if (!Object.values(autoMapping).includes('task')) autoMapping[header] = 'task'
          } else if (h.includes('rate') || h.includes('sf/hr') || h.includes('sqft') || h.includes('production') || h.includes('sq ft')) {
            if (!Object.values(autoMapping).includes('sqftPerHour')) autoMapping[header] = 'sqftPerHour'
          } else if (h.includes('equip')) {
            if (!Object.values(autoMapping).includes('equipment')) autoMapping[header] = 'equipment'
          } else if (h.includes('method') || h.includes('technique')) {
            if (!Object.values(autoMapping).includes('method')) autoMapping[header] = 'method'
          } else if (h.includes('categ') || h.includes('group') || h.includes('type')) {
            if (!Object.values(autoMapping).includes('category')) autoMapping[header] = 'category'
          } else if (h.includes('overhead') || h.includes('oh') || h.includes('multiplier')) {
            if (!Object.values(autoMapping).includes('overheadMultiplier')) autoMapping[header] = 'overheadMultiplier'
          }
        })
        setMapping(autoMapping)

        toast(`Parsed ${parsedRows.length} rows from "${file.name}"`)
      } catch {
        toast('Failed to parse file. Please check the format.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // --- Step 2: Mapping ---

  function updateMapping(header: string, field: BidCraftFieldKey | '') {
    setMapping((prev) => {
      const next = { ...prev }
      // Clear any existing mapping to this field (prevent dupes)
      if (field) {
        Object.keys(next).forEach((k) => {
          if (next[k] === field) next[k] = ''
        })
      }
      next[header] = field
      return next
    })
  }

  const mappedFields = new Set(Object.values(mapping).filter(Boolean))
  const hasRequiredFields = mappedFields.has('task') && mappedFields.has('sqftPerHour')

  function buildPreviewRow(row: string[]): Partial<Record<BidCraftFieldKey, string>> {
    const result: Partial<Record<BidCraftFieldKey, string>> = {}
    headers.forEach((header, idx) => {
      const field = mapping[header]
      if (field && idx < row.length) {
        result[field] = row[idx]
      }
    })
    return result
  }

  // --- Step 3: Import ---

  function buildRateItems(): RateItem[] {
    const results: RateItem[] = []
    rows.forEach((row, i) => {
      const mapped = buildPreviewRow(row)
      const task = mapped.task?.trim()
      const rateVal = parseFloat(mapped.sqftPerHour || '0')
      if (!task || isNaN(rateVal) || rateVal <= 0) return
      results.push({
        id: `import-${Date.now()}-${i}`,
        category: mapped.category?.trim() || 'Imported',
        task,
        equipment: mapped.equipment?.trim() || 'Standard',
        method: mapped.method?.trim() || 'Standard',
        sqftPerHour: rateVal,
        overheadMultiplier: parseFloat(mapped.overheadMultiplier || '1') || 1.0,
        isCustom: true,
      })
    })
    return results
  }

  const importableRates = step === 3 ? buildRateItems() : []

  function handleImport() {
    setImporting(true)
    const rates = buildRateItems()

    if (rates.length === 0) {
      toast('No valid rates found to import', 'error')
      setImporting(false)
      return
    }

    if (importMode === 'replace') {
      rateLibraryStore.update((lib) => ({
        ...lib,
        rates,
      }))
    } else {
      rateLibraryStore.update((lib) => ({
        ...lib,
        rates: [...lib.rates, ...rates],
      }))
    }

    toast(`Imported ${rates.length} production rates`)
    setImporting(false)
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <GlassCard className="!p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Import Rates from Excel/CSV</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border-subtle bg-surface-1/50">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Map Columns' },
              { num: 3, label: 'Import' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-border-subtle" />}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    step === s.num
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : step > s.num
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-text-tertiary border border-border-subtle'
                  }`}
                >
                  {step > s.num ? <Check className="w-3 h-3" /> : <span>{s.num}</span>}
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="p-6 min-h-[340px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-border-subtle rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
                  >
                    <Upload className="w-10 h-10 text-text-tertiary" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-primary">
                        {fileName ? fileName : 'Drop your spreadsheet here'}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        or click to browse -- accepts .xlsx, .xls, .csv
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>

                  {/* Preview table */}
                  {headers.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs text-text-tertiary mb-2">
                        Preview ({Math.min(5, rows.length)} of {rows.length} rows)
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-border-subtle">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-surface-2">
                              {headers.map((h, i) => (
                                <th key={i} className="text-left px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 5).map((row, ri) => (
                              <tr key={ri} className="border-t border-border-subtle">
                                {headers.map((_, ci) => (
                                  <td key={ci} className="px-3 py-1.5 text-text-tertiary whitespace-nowrap">
                                    {row[ci] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <p className="text-sm text-text-secondary mb-4">
                    Map each spreadsheet column to a BidCraft field. <span className="text-accent">*</span> = required.
                  </p>

                  {/* Column mapping */}
                  <div className="flex flex-col gap-2 mb-6">
                    {headers.map((header) => (
                      <div key={header} className="flex items-center gap-3">
                        <span className="text-sm text-text-primary w-40 truncate font-mono" title={header}>
                          {header}
                        </span>
                        <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0" />
                        <select
                          value={mapping[header] || ''}
                          onChange={(e) => updateMapping(header, e.target.value as BidCraftFieldKey | '')}
                          className="flex-1 text-sm"
                        >
                          <option value="">-- Skip --</option>
                          {BIDCRAFT_FIELDS.map((f) => (
                            <option
                              key={f.key}
                              value={f.key}
                              disabled={mappedFields.has(f.key) && mapping[header] !== f.key}
                            >
                              {f.label}{f.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {!hasRequiredFields && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Map both <strong>Task Name</strong> and <strong>Production Rate</strong> to continue.</span>
                    </div>
                  )}

                  {/* Live preview */}
                  {hasRequiredFields && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Import preview (first 3 rows)</p>
                      <div className="overflow-x-auto rounded-lg border border-border-subtle">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-surface-2">
                              {BIDCRAFT_FIELDS.filter((f) => mappedFields.has(f.key)).map((f) => (
                                <th key={f.key} className="text-left px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                                  {f.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 3).map((row, ri) => {
                              const preview = buildPreviewRow(row)
                              return (
                                <tr key={ri} className="border-t border-border-subtle">
                                  {BIDCRAFT_FIELDS.filter((f) => mappedFields.has(f.key)).map((f) => (
                                    <td key={f.key} className="px-3 py-1.5 text-text-tertiary whitespace-nowrap">
                                      {preview[f.key] ?? ''}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {/* Summary */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 mb-3">
                      <FileSpreadsheet className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {importableRates.length} rate{importableRates.length !== 1 ? 's' : ''} ready to import
                    </h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      from {fileName}
                    </p>
                    {rows.length - importableRates.length > 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        {rows.length - importableRates.length} row{rows.length - importableRates.length !== 1 ? 's' : ''} skipped (missing task name or invalid rate)
                      </p>
                    )}
                  </div>

                  {/* Import mode */}
                  <div className="flex flex-col gap-2 mb-6">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Import Mode</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setImportMode('add')}
                        className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          importMode === 'add'
                            ? 'bg-accent/15 border-accent/30 text-accent'
                            : 'bg-transparent border-border-subtle text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        Add to existing rates
                        <p className="text-xs opacity-70 mt-0.5 font-normal">Keep current library and append imported rates</p>
                      </button>
                      <button
                        onClick={() => setImportMode('replace')}
                        className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : 'bg-transparent border-border-subtle text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        Replace existing rates
                        <p className="text-xs opacity-70 mt-0.5 font-normal">Remove all current rates and use only imported</p>
                      </button>
                    </div>
                  </div>

                  {/* Preview of categories */}
                  {importableRates.length > 0 && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set(importableRates.map((r) => r.category))].map((cat) => (
                          <span key={cat} className="px-2 py-1 rounded-md bg-surface-2 border border-border-subtle text-xs text-text-secondary">
                            {cat} ({importableRates.filter((r) => r.category === cat).length})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface-1/30">
            <div>
              {step > 1 && (
                <button className="btn btn-ghost" onClick={() => goToStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              {step === 1 && (
                <button
                  className="btn btn-primary"
                  disabled={headers.length === 0}
                  onClick={() => goToStep(2)}
                >
                  Map Columns
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {step === 2 && (
                <button
                  className="btn btn-primary"
                  disabled={!hasRequiredFields}
                  onClick={() => goToStep(3)}
                >
                  Review Import
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {step === 3 && (
                <button
                  className="btn btn-primary"
                  disabled={importableRates.length === 0 || importing}
                  onClick={handleImport}
                >
                  <Check className="w-4 h-4" />
                  {importing ? 'Importing...' : `Import ${importableRates.length} Rates`}
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
