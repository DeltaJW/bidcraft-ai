import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Database,
  Info,
  Bot,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import GlassCard from '@/components/GlassCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  companyStore,
  rateLibraryStore,
  burdenProfilesStore,
  quotesStore,
  templatesStore,
  aiSettingsStore,
  themeStore,
  userModeStore,
  useStore,
} from '@/data/mockStore'
import { DEFAULT_RATES } from '@/data/defaultRates'

export default function Settings() {
  const company = useStore(companyStore)
  const rateLibrary = useStore(rateLibraryStore)
  const burdenProfiles = useStore(burdenProfilesStore)
  const quotes = useStore(quotesStore)
  const templates = useStore(templatesStore)

  const aiSettings = useStore(aiSettingsStore)
  const theme = useStore(themeStore)
  const userMode = useStore(userModeStore)

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
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
    toast('Backup exported successfully')
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.app !== 'BidCraft AI') {
          toast('Not a BidCraft AI backup file', 'error')
          return
        }
        if (data.company) companyStore.set(data.company)
        if (data.rateLibrary) rateLibraryStore.set(data.rateLibrary)
        if (data.burdenProfiles) burdenProfilesStore.set(data.burdenProfiles)
        if (data.quotes) quotesStore.set(data.quotes)
        if (data.templates) templatesStore.set(data.templates)
        toast('Data imported successfully')
      } catch {
        toast('Invalid backup file', 'error')
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
    toast('All data cleared', 'info')
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
      <div className="mb-6">
        <p className="text-[11px] tracking-widest uppercase font-semibold text-accent mb-1">System</p>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Data Summary */}
        <GlassCard title="Data Summary" subtitle="What's stored in your browser">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataRow icon={Database} label="Company Profile" value={company.name ? 'Configured' : 'Not set'} />
            <DataRow icon={Database} label="Rate Library" value={`${rateLibrary.rates.length} rates`} />
            <DataRow icon={Database} label="Burden Profiles" value={`${burdenProfiles.length} saved`} />
            <DataRow icon={Database} label="Saved Quotes" value={`${quotes.length} quotes`} />
            <DataRow icon={Database} label="Building Templates" value={`${templates.length} templates`} />
            <DataRow icon={Database} label="Storage Used" value={formatBytes(storageUsed)} />
          </div>
        </GlassCard>

        {/* Appearance */}
        <GlassCard title="Appearance" subtitle="Customize the look and feel">
          <div>
            <label className="label">Theme</label>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-accent-muted border-accent/30 text-accent'
                    : 'bg-transparent border-border-default text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => themeStore.set('dark')}
              >
                Dark
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-accent-muted border-accent/30 text-accent'
                    : 'bg-transparent border-border-default text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => themeStore.set('light')}
              >
                Light
              </button>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Experience Mode</label>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                  userMode === 'guided'
                    ? 'bg-accent-muted border-accent/30 text-accent'
                    : 'bg-transparent border-border-default text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => userModeStore.set('guided')}
              >
                Guided
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                  userMode === 'expert'
                    ? 'bg-accent-muted border-accent/30 text-accent'
                    : 'bg-transparent border-border-default text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => userModeStore.set('expert')}
              >
                Expert
              </button>
            </div>
            <p className="helper-text mt-1">
              {userMode === 'guided'
                ? 'Shows bid progress tracker and inline help. Best for new users.'
                : 'Hides the wizard rail. All tools accessible. Best for experienced estimators.'}
            </p>
          </div>
        </GlassCard>

        {/* AI Settings */}
        <GlassCard title="AI Assistant" subtitle="Configure your Claude API key for the AI Assistant">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-accent" />
            <span className="text-sm text-text-secondary">
              {aiSettings.apiKey ? 'API key configured' : 'No API key set'}
            </span>
            {aiSettings.apiKey && (
              <span className="badge badge-green">Active</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Claude API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiSettings.apiKey}
                    onChange={(e) => aiSettingsStore.update((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-ant-..."
                    className="!pr-10"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary bg-transparent border-none cursor-pointer"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="helper-text">
                Your key stays in your browser's localStorage. It's only sent to api.anthropic.com.
              </p>
            </div>
            <div>
              <label className="label">Model</label>
              <select
                value={aiSettings.model}
                onChange={(e) => aiSettingsStore.update((prev) => ({ ...prev, model: e.target.value }))}
                className="!w-64"
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recommended)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (faster, cheaper)</option>
                <option value="claude-opus-4-20250514">Claude Opus 4 (most capable)</option>
              </select>
            </div>
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
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="!border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-text-tertiary mb-4">
            This will permanently delete all your data including company profile, rate library customizations,
            burden profiles, saved quotes, and building templates. This cannot be undone.
          </p>
          <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>

          <ConfirmDialog
            open={showClearConfirm}
            title="Clear All Data"
            message="This will permanently delete all your data including company profile, rate library customizations, burden profiles, saved quotes, and building templates. This cannot be undone."
            confirmLabel="Yes, Delete Everything"
            onConfirm={handleClearAll}
            onCancel={() => setShowClearConfirm(false)}
          />
        </GlassCard>

        {/* About */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">About BidCraft AI</h2>
          </div>
          <div className="text-sm text-text-tertiary space-y-1">
            <p>Version: 1.0.0-beta (Phase 1 MVP)</p>
            <p>All data is stored locally in your browser. No data is sent to any server.</p>
            <p>Production rates are industry-standard field-validated cleaning production rates.</p>
            <p className="text-text-tertiary mt-2">
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
    <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-0">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <span className="text-sm text-text-secondary flex-1">{label}</span>
      <span className="text-sm font-mono text-text-tertiary">{value}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
