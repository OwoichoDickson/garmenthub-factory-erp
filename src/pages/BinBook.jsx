import { useMemo, useState } from 'react'
import { BookOpen, Plus, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import FormModal from '../components/FormModal'
import { table } from '../api/db'
import { useCollection } from '../hooks/useCollection'
import { opts } from '../api/schema'
import { titleCase } from '../lib/format'

const PAGE_SIZE = 20
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const ITEM_FIELDS = [
  { name: 'name', label: 'Item name', type: 'text', required: true },
  { name: 'category', label: 'Category', type: 'select', options: opts.binCategory },
  { name: 'store', label: 'Store', type: 'select', options: opts.store, required: true },
  { name: 'unit', label: 'Unit', type: 'select', options: opts.binUnit },
  { name: 'opening_stock', label: 'Opening stock', type: 'number' },
  { name: 'current_stock', label: 'Current stock', type: 'number' },
  { name: 'reorder_level', label: 'Reorder level', type: 'number' },
]
const ITEM_COLS = [
  { key: 'name', label: 'Item', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'store', label: 'Store', type: 'text' },
  { key: 'current_stock', label: 'Current', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'reorder_level', label: 'Reorder', type: 'number' },
]
const ENTRY_COLS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'item_name', label: 'Item', type: 'text' },
  { key: 'store', label: 'Store', type: 'text' },
  { key: 'quantity_issued', label: 'Issued', type: 'number' },
  { key: 'issued_to', label: 'Issued to', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'text' },
]

function EntryForm({ open, onClose, onSave, items, saving }) {
  const [itemId, setItemId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [qty, setQty] = useState(1)
  const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')
  useMemo(() => { if (open) { setItemId(''); setDate(new Date().toISOString().slice(0, 10)); setQty(1); setTo(''); setNotes('') } }, [open])

  const item = items.find((i) => i.id === itemId)
  const save = () => {
    if (!item) return
    const d = new Date(date)
    onSave(item, {
      item_id: item.id, item_name: item.name, store: item.store, date,
      month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      quantity_issued: Number(qty), issued_to: to || null, notes: notes || null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Issuance"
      footer={<>
        <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={saving || !item}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Item</label>
          <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Select item…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.store} (have {i.current_stock} {i.unit})</option>)}
          </select>
        </div>
        <div><label className="label">Date</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="label">Quantity issued</label><input type="number" className="input" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div><label className="label">Issued to</label><input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Team A" /></div>
        <div><label className="label">Notes</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      {item && (
        <p className="mt-3 text-xs text-slate-400">
          New stock after issue: <span className="font-semibold text-slate-200">{Number(item.current_stock) - Number(qty || 0)} {item.unit}</span>
        </p>
      )}
    </Modal>
  )
}

export default function BinBook() {
  const itemsCol = useCollection('bin_items')
  const entriesCol = useCollection('bin_entries')
  const [tab, setTab] = useState('items')
  const [store, setStore] = useState('')
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [itemModal, setItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [entryModal, setEntryModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const itemsFiltered = useMemo(() => itemsCol.rows.filter((r) =>
    (!store || r.store === store) && (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  ), [itemsCol.rows, store, search])

  const entriesFiltered = useMemo(() => entriesCol.rows.filter((r) =>
    (!store || r.store === store) &&
    (!month || r.month === month) &&
    (!search || String(r.item_name || '').toLowerCase().includes(search.toLowerCase()))
  ), [entriesCol.rows, store, month, search])

  const list = tab === 'items' ? itemsFiltered : entriesFiltered
  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const entryMonths = [...new Set(entriesCol.rows.map((r) => r.month).filter(Boolean))]

  const saveItem = async (values) => {
    setSaving(true)
    try {
      if (editingItem) await itemsCol.update(editingItem.id, values)
      else await itemsCol.create(values)
      setItemModal(false); setEditingItem(null)
    } finally { setSaving(false) }
  }

  // Create the entry, then decrement the item's current stock.
  const saveEntry = async (item, payload) => {
    setSaving(true)
    try {
      await entriesCol.create(payload)
      const newStock = Number(item.current_stock || 0) - Number(payload.quantity_issued || 0)
      await table('bin_items').update(item.id, { current_stock: newStock })
      await itemsCol.reload()
      setEntryModal(false)
    } finally { setSaving(false) }
  }

  // Delete an issuance and add its quantity back to the item's stock.
  const deleteEntry = async (entry) => {
    const item = itemsCol.rows.find((i) => i.id === entry.item_id)
    if (item) {
      const restored = Number(item.current_stock || 0) + Number(entry.quantity_issued || 0)
      await table('bin_items').update(item.id, { current_stock: restored })
    }
    await entriesCol.remove(entry.id)
    await itemsCol.reload()
  }

  return (
    <div className="fade-in">
      <PageHeader title="Bin Book" icon={BookOpen} subtitle="Consumables inventory & daily issuances"
        actions={tab === 'items'
          ? <button className="btn-primary" onClick={() => { setEditingItem(null); setItemModal(true) }}><Plus size={16} /> New Item</button>
          : <button className="btn-primary" onClick={() => setEntryModal(true)}><Plus size={16} /> Log Issuance</button>} />

      <div className="mb-5 flex rounded-lg bg-slate-900/60 p-1 text-sm sm:w-72">
        {[['items', 'Items'], ['entries', 'Entries']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1) }}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${tab === k ? 'bg-accent text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-auto" value={store} onChange={(e) => { setStore(e.target.value); setPage(1) }}>
          <option value="">All stores</option>
          {opts.store.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {tab === 'entries' && (
          <select className="input w-auto" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1) }}>
            <option value="">All months</option>
            {entryMonths.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {tab === 'items' ? (
        <DataTable columns={ITEM_COLS} rows={paged} loading={itemsCol.loading}
          rowAccent={(r) => Number(r.current_stock) <= Number(r.reorder_level)}
          onEdit={(r) => { setEditingItem(r); setItemModal(true) }}
          onDelete={(r) => setDeleting({ kind: 'item', row: r })} />
      ) : (
        <DataTable columns={ENTRY_COLS} rows={paged} loading={entriesCol.loading}
          onDelete={(r) => setDeleting({ kind: 'entry', row: r })} />
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={list.length} onPage={setPage} />

      <FormModal open={itemModal} onClose={() => { setItemModal(false); setEditingItem(null) }}
        onSubmit={saveItem} saving={saving} title={editingItem ? 'Edit Item' : 'New Bin Item'}
        fields={ITEM_FIELDS} record={editingItem} />

      <EntryForm open={entryModal} onClose={() => setEntryModal(false)} onSave={saveEntry} items={itemsCol.rows} saving={saving} />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete?" size="sm"
        footer={<>
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={async () => {
            if (deleting.kind === 'item') await itemsCol.remove(deleting.row.id)
            else await deleteEntry(deleting.row)
            setDeleting(null)
          }}>Delete</button>
        </>}>
        <p className="text-sm text-slate-300">Remove this {deleting?.kind}?</p>
      </Modal>
    </div>
  )
}
