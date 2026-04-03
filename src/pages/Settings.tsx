import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Database,
  Info,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import {
  companyStore,
  rateLibraryStore,
  burdenProfilesStore,
  quotesStore,
  templatesStore,
  useStore,
} from '@/data/mockStore'
import { DEFAULT_RATES } from '@/data/defaultRates'

export default function Settings() {
  const company = useStore(companyStore)
  const rateLibrary = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const quotes = useStore(quotesStore)
  const templates = useStore(templatesStore)

  const [exportMsg, setExportMsg] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'BidCraft AI',
      company: companyStore.get(),
      rateLibrary: rateLibraryStore.get(),
      burdenProfiles: burdenProfilesStore.get(),
      quotes: quotesStore.get(),
      templates: templatesStore.get(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bidcraft-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('Backup exported successfully')
    setTimeout(() => setExportMsg(''), 3000)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.app !== 'BidCraft AI') {
          setImportMsg('Error: Not a BidCraft AI backup file')
          setTimeout(() => setImportMsg(''), 3000)
          return
        }
        if (data.company) companyStore.set(data.company)
        if (data.rateLibrary) rateLibraryStore.set(data.rateLibrary)
        if (data.burdenProfiles) burdenProfilesStore.set(data.burdenProfiles)
        if (data.quotes) quotesStore.set(data.quotes)
        if (data.templates) templatesStore.set(data.templates)
        setImportMsg('Data imported successfully')
        setTimeout(() => setImportMsg(''), 3000)
      } catch {
        setImportMsg('Error: Invalid backup file')
        setTimeout(() => setImportMsg(''), 3000)
      }
    }
    reader.readAsText(file)
    // Reset file input
    e.target.value = ''
  }

  function handleClearAll() {
    companyStore.set({
      id: 'demo-company',
      name: '',
      address: '',
      cageCode: '',
      uei: '',
      setAside: '',
      contactName: '',
      contactTitle: '',
      contactEmail: '',
      contactPhone: '',
      logoUrl: null,
    })
    rateLibraryStore.set({
      id: 'default-library',
      name: 'Default',
      rates: [...DEFAULT_RATES],
    })
    burdenProfilesStore.set([])
    quotesStore.set([])
    templatesStore.set([])
    setShowClearConfirm(false)
  }

  // Storage stats
  const storageKeys = ['company', 'rateLibrary', 'burdenProfiles', 'quotes', 'buildingTemplates', 'workloadDraft']
  const storageUsed = storageKeys.reduce((total, key) => {
    const item = localStorage.getItem(`bidcraft:${key}`)
    return total + (item ? new Blob([item]).size : 0)
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Data Summary */}
        <GlassCard title="Data Summary" subtitle="What's stored in your browser">
          <div className="grid grid-cols-2 gap-3">
            <DataRow icon={Database} label="Company Profile" value={company.name ? 'Configured' : 'Not set'} />
            <DataRow icon={Database} label="Rate Library" value={`${rateLibrary.rates.length} rates`} />
            <DataRow icon={Database} label="Burden Profiles" value={`${burdenProfiles.length} saved`} />
            <DataRow icon={Database} label="Saved Quotes" value={`${quotes.length} quotes`} />
            <DataRow icon={Database} label="Building Templates" value={`${templates.length} templates`} />
            <DataRow icon={Database} label="Storage Used" value={formatBytes(storageUsed)} />
          </div>
        </GlassCard>

        {/* Export / Import */}
        <GlassCard title="Backup & Restore" subtitle="Export your data as JSON or restore from a backup">
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export Backup
            </button>
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Import Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {exportMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-3 text-sm text-emerald-400"
            >
              <CheckCircle className="w-4 h-4" />
              {exportMsg}
            </motion.div>
          )}
          {importMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 mt-3 text-sm ${
                importMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {importMsg.includes('Error') ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {importMsg}
            </motion.div>
          )}
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="!border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-navy-400 mb-4">
            This will permanently delete all your data including company profile, rate library customizations,
            burden profiles, saved quotes, and building templates. This cannot be undone.
          </p>
          {showClearConfirm ? (
            <div className="flex items-center gap-3">
              <button className="btn btn-danger" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4" />
                Yes, Delete Everything
              </button>
              <button className="btn btn-ghost" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          )}
        </GlassCard>

        {/* About */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">About BidCraft AI</h2>
          </div>
          <div className="text-sm text-navy-400 space-y-1">
            <p>Version: 1.0.0-beta (Phase 1 MVP)</p>
            <p>All data is stored locally in your browser. No data is sent to any server.</p>
            <p>Production rates are industry-standard field-validated cleaning production rates.</p>
            <p className="text-navy-500 mt-2">
              Future versions will include Azure cloud storage, team collaboration, and AI document parsing.
            </p>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}

function DataRow({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-navy-800/20">
      <Icon className="w-4 h-4 text-navy-500" />
      <span className="text-sm text-navy-300 flex-1">{label}</span>
      <span className="text-sm font-mono text-navy-400">{value}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
