-- ============================================================================
-- GarmentHub — sample data (optional). Run AFTER schema.sql.
-- Re-running duplicates rows; truncate first if you want a clean reset:
--   truncate workers, attendance, power_outages, weekly_production_entries,
--     hourly_progress, production_orders, raw_materials, finished_products,
--     stock_movements, sales_orders, customers, suppliers, expenses,
--     bin_items, bin_entries restart identity;
-- ============================================================================

insert into public.workers (name, employee_id, role, department, team, shift, phone, hourly_rate, status, hire_date) values
  ('Adaeze Okeke',    'EMP-001', 'operator',          'sewing',    'Team A', 'morning',   '08030000001', 850,  'active',   '2024-02-12'),
  ('Chinedu Eze',     'EMP-002', 'cutter',            'cutting',   'Team A', 'morning',   '08030000002', 900,  'active',   '2024-03-01'),
  ('Ngozi Nwankwo',   'EMP-003', 'quality_inspector', 'quality',   'Team B', 'afternoon', '08030000003', 950,  'active',   '2024-01-20'),
  ('Emeka Obi',       'EMP-004', 'supervisor',        'sewing',    'Team A', 'morning',   '08030000004', 1400, 'active',   '2023-11-05'),
  ('Blessing Ude',    'EMP-005', 'packer',            'packaging', 'Team C', 'afternoon', '08030000005', 750,  'active',   '2024-04-18'),
  ('Ifeanyi Okafor',  'EMP-006', 'technician',        'finishing', 'Team B', 'night',     '08030000006', 1100, 'on_leave', '2023-09-10'),
  ('Chioma Agu',      'EMP-007', 'monogrammer',       'finishing', 'Team B', 'morning',   '08030000007', 1000, 'active',   '2024-05-22'),
  ('Tochukwu Nnaji',  'EMP-008', 'storekeeper',       'warehouse', 'Team C', 'morning',   '08030000008', 950,  'active',   '2024-02-28'),
  ('Amaka Eze',       'EMP-009', 'operator',          'sewing',    'Team A', 'afternoon', '08030000009', 850,  'active',   '2024-06-01'),
  ('Uchenna Madu',    'EMP-010', 'floor_assistant',   'packaging', 'Team C', 'morning',   '08030000010', 700,  'terminated','2023-12-15');

insert into public.attendance (worker_name, worker_id, date, shift, clock_in, clock_out, hours_worked, overtime_hours, status) values
  ('Adaeze Okeke',   'EMP-001', current_date, 'morning',   '06:02', '14:10', 8.1, 0.1, 'present'),
  ('Chinedu Eze',    'EMP-002', current_date, 'morning',   '06:30', '14:00', 7.5, 0,   'late'),
  ('Ngozi Nwankwo',  'EMP-003', current_date, 'afternoon', '14:00', '22:00', 8.0, 0,   'present'),
  ('Emeka Obi',      'EMP-004', current_date, 'morning',   '05:55', '15:00', 9.1, 1.1, 'present'),
  ('Blessing Ude',   'EMP-005', current_date, 'afternoon', null,    null,    0,   0,   'absent'),
  ('Chioma Agu',     'EMP-007', current_date, 'morning',   '06:00', '14:00', 8.0, 0,   'present');

insert into public.power_outages (date, month, year, power_off, power_back, duration, total_hours, notes) values
  ('Jun 02', 'June',  2026, '11:15', '14:48', '3h 33m', 3.55, 'Feeder fault'),
  ('Jun 09', 'June',  2026, '09:00', '10:30', '1h 30m', 1.50, 'Scheduled maintenance'),
  ('Jun 16', 'June',  2026, '13:20', '18:05', '4h 45m', 4.75, 'Grid collapse'),
  ('May 28', 'May',   2026, '08:10', '09:40', '1h 30m', 1.50, ''),
  ('May 14', 'May',   2026, '15:00', '21:30', '6h 30m', 6.50, 'Transformer overload');

insert into public.weekly_production_entries (date, week_label, department, team_or_worker_name, product_category, product_type, style_description, target_per_day, day_output, night_output, remarks) values
  (current_date,            'This Week', 'sewing',       'Team A', 'top',    'shirts',   'Oxford long-sleeve', 120, 110, 40, 'On track'),
  (current_date - 1,        'This Week', 'cutting',      'Team A', 'bottom', 'trouser',  'Slim chino',         200, 190, 0,  ''),
  (current_date - 2,        'This Week', 'finishing',    'Team B', 'top',    'shirts',   'Oxford long-sleeve', 120, 95,  30, 'Minor defects'),
  (current_date - 3,        'This Week', 'ironing',      'Chioma', 'bottom', 'skirt',    'A-line pleated',     150, 140, 0,  ''),
  (current_date - 4,        'This Week', 'packaging_qc', 'Team C', 'top',    'pinafore', 'School uniform',     180, 175, 20, 'Good run');

insert into public.production_orders (order_number, product_name, design_code, target_quantity, actual_output, defects, waste_kg, shift, stage, status, assigned_team, start_date, due_date, notes) values
  ('PO-2026-001', 'School Uniform Shirts', 'DSN-SH-01', 1000, 640, 18, 4.2, 'morning',   'sewing',    'in_progress', '{Team A}',        current_date - 5, current_date + 3, 'Priority order'),
  ('PO-2026-002', 'Corporate Trousers',    'DSN-TR-07', 500,  500, 6,  2.1, 'afternoon', 'finishing', 'completed',   '{Team B}',        current_date - 12, current_date - 1, ''),
  ('PO-2026-003', 'Pinafore Set',          'DSN-PF-03', 800,  120, 9,  3.0, 'morning',   'cutting',   'delayed',     '{Team A,Team C}', current_date - 2, current_date + 1, 'Fabric delay'),
  ('PO-2026-004', 'Polo Shirts',           'DSN-PL-02', 600,  0,   0,  0,   'night',     'cutting',   'pending',     '{Team B}',        current_date + 1, current_date + 9, '');

insert into public.raw_materials (fabric_type, color, gsm, cost_per_unit, batch_number, warehouse_location, supplier, quantity, unit, reorder_level, status) values
  ('Cotton Poplin', 'White',     120, 1200, 'BATCH-CP-01', 'Rack A1', 'Aba Textiles',     420, 'meters', 100, 'in_stock'),
  ('Polyester',     'Navy',      150, 950,  'BATCH-PL-04', 'Rack B2', 'Lagos Fabrics',    80,  'meters', 100, 'low_stock'),
  ('Denim',         'Indigo',    320, 2100, 'BATCH-DN-02', 'Rack C1', 'Kano Mills',       0,   'meters', 50,  'out_of_stock'),
  ('Cotton Drill',  'Khaki',     200, 1500, 'BATCH-CD-09', 'Rack A3', 'Aba Textiles',     260, 'meters', 120, 'in_stock'),
  ('Lining',        'Off-white', 60,  600,  'BATCH-LN-11', 'Rack D4', 'Onitsha Supplies', 540, 'yards',  150, 'in_stock');

insert into public.finished_products (sku, product_name, size, color, design_code, production_batch, cost_price, selling_price, quantity_available, category) values
  ('SKU-SH-WH-M', 'Oxford Shirt',     'M',  'White',  'DSN-SH-01', 'PB-001', 2200, 4500, 120, 'shirts'),
  ('SKU-TR-NV-L', 'Corporate Trouser','L',  'Navy',   'DSN-TR-07', 'PB-002', 2800, 5800, 80,  'pants'),
  ('SKU-PF-BL-S', 'Pinafore',         'S',  'Blue',   'DSN-PF-03', 'PB-003', 1900, 3900, 200, 'uniforms'),
  ('SKU-PL-GR-M', 'Polo Shirt',       'M',  'Green',  'DSN-PL-02', 'PB-004', 1700, 3500, 60,  'shirts'),
  ('SKU-SK-BK-M', 'A-line Skirt',     'M',  'Black',  'DSN-SK-05', 'PB-005', 2000, 4200, 45,  'dresses');

insert into public.suppliers (name, contact_person, email, phone, address, materials_supplied, payment_terms, rating, status) values
  ('Aba Textiles',     'Mr. Okoro',  'sales@abatextiles.ng',  '08120000001', 'Aba, Abia',     '{Cotton Poplin,Cotton Drill}', 'net_30', 5, 'active'),
  ('Lagos Fabrics',    'Mrs. Bello', 'info@lagosfabrics.ng',  '08120000002', 'Lagos',         '{Polyester}',                  'net_15', 4, 'active'),
  ('Kano Mills',       'Alhaji Sani','contact@kanomills.ng',  '08120000003', 'Kano',          '{Denim}',                      'net_60', 3, 'inactive'),
  ('Onitsha Supplies', 'Mr. Nnamdi', 'hello@onitshasup.ng',   '08120000004', 'Onitsha, Anambra','{Lining,Thread}',            'cod',    4, 'active');

insert into public.customers (name, type, email, phone, address, company, credit_limit, total_orders, total_spent) values
  ('Unity Schools Ltd', 'wholesale', 'procure@unityschools.ng', '08140000001', 'Enugu',  'Unity Schools', 2000000, 8, 1450000),
  ('Bella Boutique',    'retail',    'bella@boutique.ng',       '08140000002', 'Enugu',  'Bella',         300000,  14, 620000),
  ('CorpWear Nigeria',  'wholesale', 'orders@corpwear.ng',      '08140000003', 'Lagos',  'CorpWear',      5000000, 5, 3100000);

insert into public.expenses (category, description, amount, date, payment_method, approved_by) values
  ('raw_materials', 'Cotton poplin restock',  504000, current_date - 3,  'bank_transfer', 'Emeka Obi'),
  ('utilities',     'Diesel for generator',   180000, current_date - 2,  'cash',          'Emeka Obi'),
  ('labor',         'Weekly wages — Team A',  340000, current_date - 1,  'bank_transfer', 'Admin'),
  ('maintenance',   'Sewing machine servicing',75000, current_date - 6,  'cash',          'Ifeanyi Okafor'),
  ('transport',     'Delivery to Unity Schools',45000, current_date - 4, 'cash',          'Admin');

insert into public.bin_items (name, category, store, unit, opening_stock, current_stock, reorder_level) values
  ('White Thread',   'thread',  'Store A', 'rolls',   200, 145, 50),
  ('Metal Zip 18cm', 'zip',     'Store A', 'pcs',     500, 320, 100),
  ('Elastic 25mm',   'elastic', 'Store B', 'meters',  300, 90,  80),
  ('Needles DBx1',   'needle',  'Store A', 'packets', 60,  42,  20),
  ('Tailor Chalk',   'chalk',   'Store B', 'boxes',   40,  12,  15);

insert into public.bin_entries (item_name, store, date, month, quantity_issued, issued_to, notes) values
  ('White Thread',   'Store A', current_date,     'June 2026', 10, 'Team A', 'Shirt run'),
  ('Metal Zip 18cm', 'Store A', current_date - 1, 'June 2026', 30, 'Team B', ''),
  ('Elastic 25mm',   'Store B', current_date - 2, 'June 2026', 25, 'Team C', 'Skirt waistbands');

insert into public.sales_orders (invoice_number, customer_name, order_type, items, subtotal, discount_percent, vat_percent, vat_amount, total_amount, payment_status, payment_method, amount_paid, status) values
  ('INV-2026-001', 'Unity Schools Ltd', 'wholesale',
    '[{"product":"Pinafore","sku":"SKU-PF-BL-S","qty":200,"price":3900,"total":780000}]',
    780000, 5, 16, 118560, 859560, 'partial', 'bank_transfer', 400000, 'confirmed'),
  ('INV-2026-002', 'Bella Boutique', 'retail',
    '[{"product":"Oxford Shirt","sku":"SKU-SH-WH-M","qty":20,"price":4500,"total":90000}]',
    90000, 0, 16, 14400, 104400, 'paid', 'card', 104400, 'delivered');
