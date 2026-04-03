import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Save, Upload } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { companyStore, useStore } from '@/data/mockStore'
import type { Company } from '@/types'

const SET_ASIDE_OPTIONS = [
  '',
  '8(a)',
  'HUBZone',
  'SDVOSB',
  'WOSB',
  'EDWOSB',
  'AbilityOne',
  'Small Business',
  'Other',
]

export default function CompanyProfile() {
  const company = useStore(companyStore)
  const [form, setForm] = useState<Company>({ ...company })

  function update(field: keyof Company, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast('Company name is required', 'error')
      return
    }
    companyStore.set({ ...form })
    toast('Company profile saved')
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast('Logo must be under 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setForm((prev) => ({ ...prev, logoUrl: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Company Profile</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Logo & Company Info */}
        <GlassCard title="Company Information" subtitle="Used on all generated quotes and proposals">
          <div className="grid grid-cols-2 gap-4">
            {/* Logo upload */}
            <div className="col-span-2 flex items-center gap-4 mb-2">
              <div className="w-20 h-20 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center overflow-hidden">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-text-disabled" />
                )}
              </div>
              <div>
                <label className="btn btn-ghost cursor-pointer text-sm">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-text-tertiary mt-1">PNG or SVG, max 2MB</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-tertiary mb-1">Company Name</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Acme Cleaning Services LLC"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Set-Aside Status</label>
              <select value={form.setAside} onChange={(e) => update('setAside', e.target.value)}>
                {SET_ASIDE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || '— Select —'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-text-tertiary mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="123 Main St, Suite 100, Washington, DC 20001"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">CAGE Code</label>
              <input
                value={form.cageCode}
                onChange={(e) => update('cageCode', e.target.value)}
                placeholder="1ABC2"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">UEI (SAM.gov)</label>
              <input
                value={form.uei}
                onChange={(e) => update('uei', e.target.value)}
                placeholder="XXXXXXXXXX"
              />
            </div>
          </div>
        </GlassCard>

        {/* Contact Info */}
        <GlassCard title="Primary Contact" subtitle="Shown on quotes as the point of contact">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Full Name</label>
              <input
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Title</label>
              <input
                value={form.contactTitle}
                onChange={(e) => update('contactTitle', e.target.value)}
                placeholder="Operations Manager"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                placeholder="jane@acmecleaning.com"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Phone</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder="(202) 555-0100"
              />
            </div>
          </div>
        </GlassCard>

        {/* Save button */}
        <button className="btn btn-primary" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Profile
        </button>
      </div>
    </motion.div>
  )
}
