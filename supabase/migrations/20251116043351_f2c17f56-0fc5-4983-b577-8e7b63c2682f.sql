-- Phase 1: Create missing metrics in dim_metric table
-- Get report IDs first
DO $$
DECLARE
  v_fuel_report_id UUID;
  v_material_report_id UUID;
  v_maintenance_report_id UUID;
  v_rig_moves_report_id UUID;
  v_well_tracker_report_id UUID;
  v_work_orders_report_id UUID;
  v_stock_report_id UUID;
  v_utilization_report_id UUID;
  v_npt_report_id UUID;
  v_revenue_report_id UUID;
  v_csat_report_id UUID;
BEGIN
  -- Get or create report IDs
  SELECT id INTO v_fuel_report_id FROM dim_report WHERE report_key = 'fuel';
  SELECT id INTO v_material_report_id FROM dim_report WHERE report_key = 'material';
  SELECT id INTO v_maintenance_report_id FROM dim_report WHERE report_key = 'maintenance';
  SELECT id INTO v_rig_moves_report_id FROM dim_report WHERE report_key = 'rig_moves';
  SELECT id INTO v_well_tracker_report_id FROM dim_report WHERE report_key = 'well_tracker';
  SELECT id INTO v_work_orders_report_id FROM dim_report WHERE report_key = 'work_orders';
  SELECT id INTO v_stock_report_id FROM dim_report WHERE report_key = 'stock';
  SELECT id INTO v_utilization_report_id FROM dim_report WHERE report_key = 'utilization';
  SELECT id INTO v_npt_report_id FROM dim_report WHERE report_key = 'billing_npt';
  SELECT id INTO v_revenue_report_id FROM dim_report WHERE report_key = 'revenue';
  SELECT id INTO v_csat_report_id FROM dim_report WHERE report_key = 'customer_satisfaction';

  -- Insert metrics
  INSERT INTO dim_metric (metric_key, display_name, unit, format, aggregation_type, report_id, active)
  VALUES 
    ('fuel_cost_usd', 'Fuel Cost', 'USD', 'currency', 'sum', v_fuel_report_id, true),
    ('material_cost_usd', 'Material Cost', 'USD', 'currency', 'sum', v_material_report_id, true),
    ('repair_cost_usd', 'Repair & Maintenance Cost', 'USD', 'currency', 'sum', v_maintenance_report_id, true),
    ('rig_moves_count', 'Rig Moves', 'moves', 'number', 'sum', v_rig_moves_report_id, true),
    ('wells_completed_count', 'Wells Completed', 'wells', 'number', 'sum', v_well_tracker_report_id, true),
    ('max_open_wo_oper', 'Max Open Work Orders (Operations)', '%', 'percentage', 'max', v_work_orders_report_id, true),
    ('max_stock_value_usd', 'Maximum Stock Value', 'USD', 'currency', 'max', v_stock_report_id, true),
    ('utilization_pct', 'Utilization Rate', '%', 'percentage', 'avg', v_utilization_report_id, true),
    ('npt_hours', 'NPT Hours', 'hours', 'number', 'sum', v_npt_report_id, true),
    ('revenue_usd', 'Revenue', 'USD', 'currency', 'sum', v_revenue_report_id, true),
    ('csat_score', 'Customer Satisfaction Score', '%', 'percentage', 'avg', v_csat_report_id, true)
  ON CONFLICT (metric_key) DO NOTHING;
END $$;

-- Phase 2: Populate dim_rig table with all rigs
INSERT INTO dim_rig (rig_code, rig_name, rig_type, active)
VALUES 
  ('103', 'Rig 103', 'Land', true),
  ('104', 'Rig 104', 'Land', true),
  ('105', 'Rig 105', 'Land', true),
  ('106', 'Rig 106', 'Land', true),
  ('107', 'Rig 107', 'Land', true),
  ('108', 'Rig 108', 'Land', true),
  ('109', 'Rig 109', 'Land', true),
  ('110', 'Rig 110', 'Land', true),
  ('111', 'Rig 111', 'Land', true),
  ('201', 'Rig 201', 'Land', true),
  ('202', 'Rig 202', 'Land', true),
  ('203', 'Rig 203', 'Land', true),
  ('204', 'Rig 204', 'Land', true),
  ('205', 'Rig 205', 'Land', true),
  ('206', 'Rig 206', 'Land', true),
  ('207', 'Rig 207', 'Land', true),
  ('208', 'Rig 208', 'Land', true),
  ('209', 'Rig 209', 'Land', true),
  ('210', 'Rig 210', 'Land', true),
  ('302', 'Rig 302', 'Land', true),
  ('303', 'Rig 303', 'Land', true),
  ('304', 'Rig 304', 'Land', true),
  ('306', 'Rig 306', 'Land', true)
ON CONFLICT (rig_code) DO UPDATE SET
  rig_name = EXCLUDED.rig_name,
  rig_type = EXCLUDED.rig_type,
  active = EXCLUDED.active;

-- Phase 3: Create 2025 budget version
INSERT INTO budget_version (
  version_name,
  version_code,
  fiscal_year,
  status,
  effective_start,
  effective_end,
  is_baseline
)
VALUES (
  '2025 Annual Budget',
  '2025-V1',
  2025,
  'draft',
  '2025-01-01',
  '2025-12-31',
  true
)
ON CONFLICT (version_code) DO NOTHING;