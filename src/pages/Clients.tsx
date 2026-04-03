import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { toast } from '@/components/Toast'
import { clientsStore, quotesStore, useStore } from '@/data/mockStore'
import type { Client } from '@/types'

const AGENCIES = [
  'GSA',
  'Army',
  'Navy',
  'Air Force',
  'NPS',
  'VA',
  'DHS',
  'DoD',
  'State/Local',
  'Commercial',
  'Other',
]

const AGENCY_COLORS: Record<string, string> = {
  GSA: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Army: 'bg-green-600/20 text-green-300 border-green-600/30',
  Navy: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Air Force': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  NPS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  VA: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DHS: 'bg-red-500/20 text-red-300 border-red-500/30',
  DoD: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'State/Local': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  Commercial: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

function AgencyBadge({ agency }: { agency: string }) {
  const colors = AGENCY_COLORS[agency] || AGENCY_COLORS['Other']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {agency}
    </span>
  )
}

function emptyClient(): Omit<Client, 'id' | 'createdAt'> {
  return {
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    agency: '',
    notes: '',
  }
}

export default function Clients() {
  const clients = useStore(clientsStore)
  const quotes = useStore(quotesStore)

  const [search, setSearch] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyClient())

  // Client quote stats
  const clientQuoteStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    for (const q of quotes) {
      if (q.clientId) {
        if (!map[q.clientId]) map[q.clientId] = { count: 0, total: 0 }
        map[q.clientId].count++
        map[q.clientId].total += q.grandTotal
      }
    }
    return map
  }, [quotes])

  // Filter clients
  const filtered = useMemo(() => {
    let list = [...clients]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.agency.toLowerCase().includes(q)
      )
    }
    if (agencyFilter) {
      list = list.filter((c) => c.agency === agencyFilter)
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [clients, search, agencyFilter])

  function openAddForm() {
    setForm(emptyClient())
    setEditingId(null)
    setShowForm(true)
  }

  function openEditForm(client: Client) {
    setForm({
      name: client.name,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
      agency: client.agency,
      notes: client.notes,
    })
    setEditingId(client.id)
    setShowForm(true)
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast('Client name is required', 'error')
      return
    }
    if (editingId) {
      clientsStore.update((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, ...form } : c
        )
      )
      toast('Client updated')
    } else {
      const newClient: Client = {
        ...form,
        id: `client-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      clientsStore.update((prev) => [...prev, newClient])
      toast('Client added')
    }
    setShowForm(false)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    const client = clients.find((c) => c.id === id)
    if (!client) return
    const stats = clientQuoteStats[id]
    if (stats && stats.count > 0) {
      if (!window.confirm(`"${client.name}" has ${stats.count} quote(s). Delete anyway? Quotes will keep their data but lose the client link.`)) return
    } else {
      if (!window.confirm(`Delete "${client.name}"?`)) return
    }
    clientsStore.update((prev) => prev.filter((c) => c.id !== id))
    if (expandedId === id) setExpandedId(null)
    toast('Client deleted')
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // Quotes for a specific client
  function getClientQuotes(clientId: string) {
    return quotes.filter((q) => q.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // Active agencies for the filter dropdown
  const activeAgencies = useMemo(() => {
    const set = new Set(clients.map((c) => c.agency).filter(Boolean))
    return Array.from(set).sort()
  }, [clients])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label">Setup</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Clients</h1>
            {clients.length > 0 && (
              <span className="text-sm text-text-tertiary">({clients.length})</span>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search / Filter */}
      {clients.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
            <input
              className="!pl-9"
              placeholder="Search by name, contact, or agency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {activeAgencies.length > 1 && (
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="w-44"
            >
              <option value="">All Agencies</option>
              {activeAgencies.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Client list */}
      {filtered.length === 0 ? (
        <GlassCard>
          <div className="text-center py-16">
            <Users className="w-14 h-14 text-text-disabled mx-auto mb-4" />
            {clients.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No clients yet</h3>
                <p className="text-sm text-text-tertiary max-w-md mx-auto mb-5">
                  Add your customers and contracting agencies here. Link them to quotes to track revenue by client and build a history of your bids.
                </p>
                <button className="btn btn-primary" onClick={openAddForm}>
                  <Plus className="w-4 h-4" />
                  Add Your First Client
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No matches</h3>
                <p className="text-sm text-text-tertiary">
                  Try adjusting your search or filter.
                </p>
              </>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => {
            const stats = clientQuoteStats[client.id] || { count: 0, total: 0 }
            const isExpanded = expandedId === client.id
            const clientQuotes = isExpanded ? getClientQuotes(client.id) : []

            return (
              <motion.div
                key={client.id}
                layout
                className="glass"
              >
                {/* Main row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpand(client.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        )}
                        <h3 className="text-base font-semibold text-text-primary">{client.name}</h3>
                        {client.agency && <AgencyBadge agency={client.agency} />}
                      </div>
                      <div className="ml-7 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-tertiary">
                        {client.contactName && (
                          <span>{client.contactName}</span>
                        )}
                        {client.contactEmail && (
                          <span>{client.contactEmail}</span>
                        )}
                        {client.contactPhone && (
                          <span>{client.contactPhone}</span>
                        )}
                        {client.address && (
                          <span>{client.address}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats + actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-text-tertiary">{stats.count} quote{stats.count !== 1 ? 's' : ''}</div>
                        {stats.total > 0 && (
                          <div className="text-sm font-mono text-accent font-medium">
                            ${stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 text-text-disabled hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                          onClick={() => openEditForm(client)}
                          title="Edit client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 text-text-disabled hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                          onClick={() => handleDelete(client.id)}
                          title="Delete client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {client.notes && !isExpanded && (
                    <p className="ml-7 mt-2 text-xs text-text-tertiary italic line-clamp-1">
                      {client.notes}
                    </p>
                  )}
                </div>

                {/* Expanded: quote history */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border-subtle px-5 pb-5 pt-4">
                        {client.notes && (
                          <p className="text-xs text-text-tertiary italic mb-4">{client.notes}</p>
                        )}
                        {clientQuotes.length === 0 ? (
                          <p className="text-xs text-text-disabled">No quotes linked to this client yet. Assign this client when creating a quote.</p>
                        ) : (
                          <div>
                            <p className="text-xs font-medium text-text-secondary mb-2">Quote History</p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-text-tertiary">
                                  <th className="text-left px-2 py-1.5 font-medium">Title</th>
                                  <th className="text-left px-2 py-1.5 font-medium">Type</th>
                                  <th className="text-left px-2 py-1.5 font-medium">Status</th>
                                  <th className="text-right px-2 py-1.5 font-medium">Total</th>
                                  <th className="text-right px-2 py-1.5 font-medium">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clientQuotes.map((q) => (
                                  <tr key={q.id} className="border-t border-border-subtle">
                                    <td className="px-2 py-1.5 text-text-primary">{q.title}</td>
                                    <td className="px-2 py-1.5">
                                      <span className="text-xs text-text-tertiary capitalize">
                                        {q.quoteType === 'task_order' ? 'Task Order' : q.quoteType}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <span className={`text-xs capitalize ${
                                        q.status === 'accepted' ? 'text-green-400' :
                                        q.status === 'rejected' ? 'text-red-400' :
                                        q.status === 'sent' ? 'text-blue-400' :
                                        'text-text-tertiary'
                                      }`}>
                                        {q.status}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-mono text-accent text-xs">
                                      ${q.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-2 py-1.5 text-right text-xs text-text-tertiary">
                                      {new Date(q.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {editingId ? 'Edit Client' : 'Add Client'}
                  </h2>
                  <button
                    className="p-1 text-text-disabled hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
                    onClick={() => setShowForm(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Client / Organization Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. GSA Region 4, Fort Bragg DPW"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Agency / Sector</label>
                    <select
                      value={form.agency}
                      onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    >
                      <option value="">-- Select --</option>
                      {AGENCIES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Contact Name</label>
                      <input
                        value={form.contactName}
                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Contact Phone</label>
                      <input
                        value={form.contactPhone}
                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="jsmith@agency.gov"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="123 Federal Plaza, Washington DC 20001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Contract preferences, special requirements, key dates..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button className="btn btn-primary flex-1" onClick={handleSave}>
                      {editingId ? 'Update Client' : 'Add Client'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
