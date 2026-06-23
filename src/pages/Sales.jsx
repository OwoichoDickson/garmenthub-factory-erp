import { useMemo, useState } from 'react'
import { ShoppingCart, Plus, Trash2, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import KPICard from '../components/KPICard'
import { useCollection } from '../hooks/useCollection'
import { opts } from '../api/schema'
import { naira, titleCase, yearsRange } from '../lib/format'

const PAGE_SIZE = 25
const COLUMNS = [
  { key: 'invoice_number', label: 'Invoice', type: 'text' },
  { key: 'customer_name', label: 'Customer', type: 'text' },
  { key: 'order_type', label: 'Type', type: 'badge' },
  { key: 'total_amount', label: 'Total', type: 'currency' },
  { key: 'amount_paid', label: 'Paid', type: 'currency' },
  { key: 'payment_status', label: 'Payment', type: 'badge' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'created_at', label: 'Date', type: 'date' },
]

const emptyItem = () => ({ product: '', sku: '', qty: 1, price: 0, total: 0 })

function blankOrder() {
  return {
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    customer_name: '', order_type: 'retail', items: [emptyItem()],
    discount_percent: 0, vat_percent: 16, payment_status: 'unpaid',
    payment_method: 'cash', amount_paid: 0, status: 'pending', notes: '',
  }
}

function InvoiceModal({ open, onClose, onSave, record, saving }) {
  const [o, setO] = useState(record || blankOrder())
  // re-seed when opening with a different record
  useMemo(() => setO(record || blankOrder()), [record, open]) // eslint-disable-line

  const set = (k, v) => setO((p) => ({ ...p, [k]: v }))
  const setItem = (i, k, v) =>
    setO((p) => {
      const items = p.items.map((it, idx) => {
        if (idx !== i) return it
        const next = { ...it, [k]: v }
        next.total = Number(next.qty || 0) * Number(next.price || 0)
        return next
      })
      return { ...p, items }
    })

  const subtotal = (o.items || []).reduce((s, it) => s + Number(it.total || 0), 0)
  const discount = subtotal * (Number(o.discount_percent || 0) / 100)
  const vatAmount = (subtotal - discount) * (Number(o.vat_percent || 0) / 100)
  const total = subtotal - discount + vatAmount

  const save = () => {
    onSave({
      ...o,
      qty: undefined,
      subtotal,
      vat_amount: vatAmount,
      total_amount: total,
      discount_percent: Number(o.discount_percent || 0),
      vat_percent: Number(o.vat_percent || 0),
      amount_paid: Number(o.amount_paid || 0),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={record ? 'Edit Invoice' : 'New Invoice'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save invoice'}</button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Invoice #</label>
          <input className="input" value={o.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} />
        </div>
        <div>
          <label className="label">Customer</label>
          <input className="input" value={o.customer_name} onChange={(e) => set('customer_name', e.target.value)} />
        </div>
        <div>
          <label className="label">Order type</label>
          <select className="input" value={o.order_type} onChange={(e) => set('order_type', e.target.value)}>
            {opts.orderType.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label mb-0">Line items</label>
          <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => set('items', [...o.items, emptyItem()])}>
            <Plus size={14} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {o.items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className="input col-span-4" placeholder="Product" value={it.product} onChange={(e) => setItem(i, 'product', e.target.value)} />
              <input className="input col-span-2" placeholder="SKU" value={it.sku} onChange={(e) => setItem(i, 'sku', e.target.value)} />
              <input type="number" className="input col-span-2" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, 'qty', Number(e.target.value))} />
              <input type="number" className="input col-span-2" placeholder="Price" value={it.price} onChange={(e) => setItem(i, 'price', Number(e.target.value))} />
              <div className="col-span-1 flex items-center px-1 text-xs text-slate-300">{naira(it.total)}</div>
              <button
                className="col-span-1 grid place-items-center rounded-lg text-slate-500 hover:bg-red-500/15 hover:text-red-400"
                onClick={() => set('items', o.items.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals + payment */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Discount %</label>
              <input type="number" className="input" value={o.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} />
            </div>
            <div>
              <label className="label">VAT %</label>
              <input type="number" className="input" value={o.vat_percent} onChange={(e) => set('vat_percent', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment status</label>
              <select className="input" value={o.payment_status} onChange={(e) => set('payment_status', e.target.value)}>
                {opts.paymentStatus.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={o.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                {opts.paymentMethod.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount paid (₦)</label>
              <input type="number" className="input" value={o.amount_paid} onChange={(e) => set('amount_paid', e.target.value)} />
            </div>
            <div>
              <label className="label">Order status</label>
              <select className="input" value={o.status} onChange={(e) => set('status', e.target.value)}>
                {opts.salesStatus.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 text-sm">
          <Row label="Subtotal" value={naira(subtotal)} />
          <Row label={`Discount (${o.discount_percent || 0}%)`} value={`- ${naira(discount)}`} />
          <Row label={`VAT (${o.vat_percent || 0}%)`} value={naira(vatAmount)} />
          <div className="my-2 border-t border-slate-700/60" />
          <Row label="Total" value={naira(total)} strong />
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={strong ? 'font-semibold text-slate-200' : 'text-slate-400'}>{label}</span>
      <span className={strong ? 'text-base font-bold text-accent' : 'text-slate-200'}>{value}</span>
    </div>
  )
}

export default function Sales() {
  const { rows, loading, create, update, remove } = useCollection('sales_orders')
  const [search, setSearch] = useState('')
  const [fv, setFv] = useState({})
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const years = useMemo(() => yearsRange(rows, ['created_at']), [rows])

  const hasRange = Boolean(dateFrom || dateTo)
  const filtered = useMemo(() => {
    const fromT = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const toT = dateTo ? new Date(dateTo + 'T23:59:59') : null
    return rows.filter((r) => {
      if (hasRange) {
        const t = r.created_at ? new Date(r.created_at) : null
        if (!t || isNaN(t)) return false
        if (fromT && t < fromT) return false
        if (toT && t > toT) return false
      } else if (year !== 'all' && r.created_at && String(new Date(r.created_at).getFullYear()) !== String(year)) {
        return false
      }
      if (fv.payment_status && r.payment_status !== fv.payment_status) return false
      if (fv.order_type && r.order_type !== fv.order_type) return false
      if (search && ![r.invoice_number, r.customer_name].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [rows, year, fv, search, dateFrom, dateTo])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const revenue = filtered.reduce((s, r) => s + Number(r.total_amount || 0), 0)
  const collected = filtered.reduce((s, r) => s + Number(r.amount_paid || 0), 0)

  const onSave = async (values) => {
    setSaving(true)
    try {
      if (editing) await update(editing.id, values)
      else await create(values)
      setModal(false); setEditing(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Sales / POS" icon={ShoppingCart} subtitle="Create invoices and track payments"
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={16} /> New Invoice</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Revenue" value={naira(revenue)} icon={DollarSign} theme="green" />
        <KPICard label="Collected" value={naira(collected)} icon={CheckCircle2} theme="blue" />
        <KPICard label="Outstanding" value={naira(revenue - collected)} icon={Clock} theme="amber" />
        <KPICard label="Invoices" value={filtered.length} icon={ShoppingCart} theme="violet" />
      </div>

      <FilterBar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        year={year} years={years} onYear={(v) => { setYear(v); setPage(1) }}
        filters={[{ name: 'payment_status', options: opts.paymentStatus }, { name: 'order_type', options: opts.orderType }]}
        values={fv} onFilter={(n, v) => { setFv((p) => ({ ...p, [n]: v })); setPage(1) }}
        dateRange dateFrom={dateFrom} dateTo={dateTo}
        onDateFrom={(v) => { setDateFrom(v); setPage(1) }}
        onDateTo={(v) => { setDateTo(v); setPage(1) }}
        onClearDates={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
      />

      <DataTable columns={COLUMNS} rows={paged} loading={loading}
        onEdit={(r) => { setEditing(r); setModal(true) }} onDelete={(r) => setDeleting(r)} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />

      <InvoiceModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSave={onSave} record={editing} saving={saving} />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete invoice?" size="sm"
        footer={<>
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={async () => { await remove(deleting.id); setDeleting(null) }}>Delete</button>
        </>}>
        <p className="text-sm text-slate-300">Permanently remove invoice {deleting?.invoice_number}?</p>
      </Modal>
    </div>
  )
}
