/**
 * Importable entities for the Import Center (and a future Export Center).
 * `fields` field names are the EXACT snake_case Supabase columns — template CSV
 * headers must match these so imports need no transformation. `type` drives
 * value coercion: text | number | date | array | json.
 * `required` lists NOT-NULL columns (without DB defaults); rows missing them are skipped.
 */

const f = (name, type = 'text') => ({ name, type })

export const IMPORT_ENTITIES = [
  {
    key: 'workers', table: 'workers', label: 'Workers', required: ['name'],
    fields: [
      f('name'), f('employee_id'), f('role'), f('department'), f('team'),
      f('shift'), f('phone'), f('hourly_rate', 'number'), f('status'), f('hire_date', 'date'),
    ],
  },
  {
    key: 'attendance', table: 'attendance', label: 'Attendance', required: [],
    fields: [
      f('worker_name'), f('worker_id'), f('date', 'date'), f('shift'), f('clock_in'),
      f('clock_out'), f('hours_worked', 'number'), f('overtime_hours', 'number'), f('status'),
    ],
  },
  {
    key: 'weekly_production_entries', table: 'weekly_production_entries', label: 'Weekly Production', required: ['date'],
    fields: [
      f('date', 'date'), f('week_label'), f('department'), f('team_or_worker_name'),
      f('product_category'), f('product_type'), f('style_description'),
      f('target_per_day', 'number'), f('day_output', 'number'), f('night_output', 'number'), f('remarks'),
    ],
  },
  {
    key: 'daily_production', table: 'daily_production', label: 'Daily Production', required: [],
    fields: [
      f('date', 'date'), f('uniforms_ready_pickup', 'number'), f('uniforms_awaiting_badges', 'number'),
      f('badges_produced', 'number'), f('notes'),
    ],
  },
  {
    key: 'power_outages', table: 'power_outages', label: 'Power Outage', required: [],
    fields: [
      f('date'), f('month'), f('year', 'number'), f('power_off'), f('power_back'),
      f('duration'), f('total_hours', 'number'), f('notes'),
    ],
  },
  {
    key: 'hourly_progress', table: 'hourly_progress', label: 'Hourly Progress', required: [],
    fields: [
      f('worker_name'), f('worker_id'), f('date', 'date'), f('hour'), f('shift'),
      f('department'), f('units_produced', 'number'), f('defects', 'number'), f('notes'),
    ],
  },
  {
    key: 'production_orders', table: 'production_orders', label: 'Production Orders', required: [],
    fields: [
      f('order_number'), f('product_name'), f('design_code'), f('target_quantity', 'number'),
      f('actual_output', 'number'), f('defects', 'number'), f('waste_kg', 'number'), f('shift'),
      f('stage'), f('status'), f('assigned_team', 'array'), f('start_date', 'date'), f('due_date', 'date'), f('notes'),
    ],
  },
  {
    key: 'raw_materials', table: 'raw_materials', label: 'Raw Materials', required: ['fabric_type'],
    fields: [
      f('fabric_type'), f('color'), f('gsm', 'number'), f('cost_per_unit', 'number'),
      f('batch_number'), f('warehouse_location'), f('supplier'), f('quantity', 'number'),
      f('unit'), f('reorder_level', 'number'), f('status'),
    ],
  },
  {
    key: 'finished_products', table: 'finished_products', label: 'Finished Products', required: ['product_name'],
    fields: [
      f('sku'), f('product_name'), f('size'), f('color'), f('design_code'), f('production_batch'),
      f('cost_price', 'number'), f('selling_price', 'number'), f('quantity_available', 'number'),
      f('category'), f('image_url'),
    ],
  },
  {
    key: 'stock_movements', table: 'stock_movements', label: 'Stock Movements', required: [],
    fields: [
      f('material_type'), f('item_name'), f('item_id'), f('movement_type'),
      f('quantity', 'number'), f('reference'), f('notes'),
    ],
  },
  {
    key: 'sales_orders', table: 'sales_orders', label: 'Sales Orders', required: [],
    fields: [
      f('invoice_number'), f('customer_name'), f('customer_id'), f('order_type'), f('items', 'json'),
      f('subtotal', 'number'), f('discount_percent', 'number'), f('vat_percent', 'number'),
      f('vat_amount', 'number'), f('total_amount', 'number'), f('payment_status'),
      f('payment_method'), f('amount_paid', 'number'), f('status'), f('notes'),
    ],
  },
  {
    key: 'customers', table: 'customers', label: 'Customers', required: ['name'],
    fields: [
      f('name'), f('type'), f('email'), f('phone'), f('address'), f('company'),
      f('credit_limit', 'number'), f('total_orders', 'number'), f('total_spent', 'number'),
    ],
  },
  {
    key: 'suppliers', table: 'suppliers', label: 'Suppliers', required: ['name'],
    fields: [
      f('name'), f('contact_person'), f('email'), f('phone'), f('address'),
      f('materials_supplied', 'array'), f('payment_terms'), f('rating', 'number'), f('status'),
    ],
  },
  {
    key: 'expenses', table: 'expenses', label: 'Expenses', required: [],
    fields: [
      f('category'), f('description'), f('amount', 'number'), f('date', 'date'),
      f('payment_method'), f('receipt_url'), f('approved_by'),
    ],
  },
  {
    key: 'bin_items', table: 'bin_items', label: 'Bin Items', required: ['name'],
    fields: [
      f('name'), f('category'), f('store'), f('unit'),
      f('opening_stock', 'number'), f('current_stock', 'number'), f('reorder_level', 'number'),
    ],
  },
  {
    key: 'bin_entries', table: 'bin_entries', label: 'Bin Entries', required: [],
    fields: [
      f('item_id'), f('item_name'), f('store'), f('date', 'date'), f('month'),
      f('quantity_issued', 'number'), f('issued_to'), f('notes'),
    ],
  },
]

/**
 * Natural keys used to detect duplicates on import. A row is a duplicate if a
 * record with the same key already exists (or appeared earlier in the file).
 * Entities not listed here have no meaningful natural key (e.g. stock movements,
 * expenses, bin issuances legitimately repeat) and are always inserted.
 */
export const DEDUPE = {
  workers: ['employee_id'],
  attendance: ['worker_name', 'date', 'shift'],
  weekly_production_entries: ['date', 'department', 'team_or_worker_name', 'product_type'],
  daily_production: ['date'],
  power_outages: ['date', 'year', 'power_off'],
  hourly_progress: ['worker_name', 'date', 'hour'],
  production_orders: ['order_number'],
  raw_materials: ['batch_number'],
  finished_products: ['sku'],
  sales_orders: ['invoice_number'],
  customers: ['name', 'phone'],
  suppliers: ['name'],
  bin_items: ['name', 'store'],
}

/** Build a normalized comparison key, or null if every key part is blank. */
export function rowKey(obj, cols) {
  if (!cols) return null
  const parts = cols.map((c) => String(obj[c] ?? '').trim().toLowerCase())
  if (parts.every((p) => p === '')) return null
  return parts.join('|')
}

/** Coerce a raw CSV string into the right JS type for a column. */
export function coerce(value, type) {
  const v = (value ?? '').trim()
  if (v === '') return type === 'array' ? [] : type === 'json' ? null : null
  switch (type) {
    case 'number': {
      const n = Number(v.replace(/,/g, ''))
      return Number.isNaN(n) ? null : n
    }
    case 'array':
      return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
    case 'json':
      try { return JSON.parse(v) } catch { return null }
    default:
      return v
  }
}
