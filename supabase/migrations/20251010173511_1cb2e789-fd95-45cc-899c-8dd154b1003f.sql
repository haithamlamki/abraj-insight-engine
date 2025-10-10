-- ==========================================
-- PHASE 11: COMPREHENSIVE BUDGET MANAGEMENT
-- Part 2: Budget Data Model & Dimensions
-- ==========================================

-- 1. Standardize dim_rig table
CREATE TABLE IF NOT EXISTS public.dim_rig (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rig_code TEXT UNIQUE NOT NULL,
  rig_name TEXT NOT NULL,
  rig_type TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_rig_code ON public.dim_rig(rig_code);

-- Populate from existing data
INSERT INTO public.dim_rig (rig_code, rig_name, active)
SELECT DISTINCT rig, rig, TRUE
FROM public.revenue
WHERE rig IS NOT NULL
ON CONFLICT (rig_code) DO NOTHING;

-- 2. Create dim_date table
CREATE TABLE IF NOT EXISTS public.dim_date (
  date_id DATE PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  quarter INTEGER NOT NULL,
  fiscal_year INTEGER,
  month_start DATE NOT NULL,
  month_end DATE NOT NULL
);

CREATE INDEX idx_dim_date_year_month ON public.dim_date(year, month);

-- Populate dim_date for 2000-2050
INSERT INTO public.dim_date (date_id, year, month, month_name, quarter, fiscal_year, month_start, month_end)
SELECT 
  d::DATE,
  EXTRACT(YEAR FROM d)::INTEGER,
  EXTRACT(MONTH FROM d)::INTEGER,
  TO_CHAR(d, 'Month'),
  EXTRACT(QUARTER FROM d)::INTEGER,
  EXTRACT(YEAR FROM d)::INTEGER,
  DATE_TRUNC('month', d)::DATE,
  (DATE_TRUNC('month', d) + INTERVAL '1 month - 1 day')::DATE
FROM generate_series('2000-01-01'::DATE, '2050-12-31'::DATE, '1 month') AS d
ON CONFLICT (date_id) DO NOTHING;

-- 3. Create dim_report table
CREATE TABLE IF NOT EXISTS public.dim_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  department TEXT NOT NULL,
  sort_order INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_report_key ON public.dim_report(report_key);

-- Populate reports
INSERT INTO public.dim_report (report_key, display_name, department, sort_order) VALUES
  ('utilization', 'Rig Utilization', 'Rig Financials', 1),
  ('ytd_npt', 'YTD NPT Analysis', 'Rig Financials', 2),
  ('billing_npt', 'Billing NPT', 'Rig Financials', 3),
  ('revenue', 'Revenue', 'Rig Financials', 4),
  ('fuel', 'Fuel Consumption', 'Rig Consumption', 5),
  ('material', 'Material Consumption', 'Rig Consumption', 6),
  ('maintenance', 'Maintenance & Repair', 'Rig Consumption', 7),
  ('rig_moves', 'Rig Moves', 'Rig Performance', 8),
  ('well_tracker', 'Well Tracker', 'Rig Performance', 9),
  ('csr', 'Customer Satisfaction', 'Rig Status', 10),
  ('stock', 'Stock Level', 'Rig Status', 11),
  ('work_orders', 'Work Orders', 'Rig Status', 12),
  ('dr_line', 'DR Line (Daily Rig)', 'Rig Status', 13)
ON CONFLICT (report_key) DO NOTHING;

-- 4. Create dim_metric table
CREATE TABLE IF NOT EXISTS public.dim_metric (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  report_id UUID REFERENCES public.dim_report(id),
  unit TEXT,
  format TEXT,
  aggregation_type TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dim_metric_key ON public.dim_metric(metric_key);
CREATE INDEX idx_dim_metric_report ON public.dim_metric(report_id);

-- Populate key metrics
INSERT INTO public.dim_metric (metric_key, display_name, report_id, unit, format, aggregation_type)
SELECT 'utilization_pct', 'Utilization %', r.id, '%', 'percentage', 'avg'
FROM public.dim_report r WHERE r.report_key = 'utilization'
UNION ALL
SELECT 'npt_hours', 'NPT Hours', r.id, 'Hours', 'decimal', 'sum'
FROM public.dim_report r WHERE r.report_key = 'ytd_npt'
UNION ALL
SELECT 'revenue_omr', 'Revenue', r.id, 'OMR', 'currency', 'sum'
FROM public.dim_report r WHERE r.report_key = 'revenue'
UNION ALL
SELECT 'fuel_cost_omr', 'Fuel Cost', r.id, 'OMR', 'currency', 'sum'
FROM public.dim_report r WHERE r.report_key = 'fuel'
UNION ALL
SELECT 'csr_pct', 'CSR Score', r.id, '%', 'percentage', 'avg'
FROM public.dim_report r WHERE r.report_key = 'csr'
UNION ALL
SELECT 'stock_value_omr', 'Stock Value', r.id, 'OMR', 'currency', 'sum'
FROM public.dim_report r WHERE r.report_key = 'stock'
ON CONFLICT (metric_key) DO NOTHING;

-- 5. Create budget status enum
CREATE TYPE public.budget_status AS ENUM ('draft', 'submitted', 'approved', 'locked', 'archived');

-- 6. Create budget_version table
CREATE TABLE public.budget_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT NOT NULL,
  version_code TEXT UNIQUE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  parent_version_id UUID REFERENCES public.budget_version(id),
  status budget_status DEFAULT 'draft',
  effective_start DATE NOT NULL,
  effective_end DATE NOT NULL,
  frozen_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approval_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_budget_version_status ON public.budget_version(status);
CREATE INDEX idx_budget_version_fiscal_year ON public.budget_version(fiscal_year);
CREATE INDEX idx_budget_version_code ON public.budget_version(version_code);

ALTER TABLE public.budget_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage budget versions"
ON public.budget_version FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view budget versions"
ON public.budget_version FOR SELECT
TO authenticated
USING (true);

-- 7. Create fact_budget table
CREATE TABLE public.fact_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES public.budget_version(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES public.dim_report(id) NOT NULL,
  rig_id UUID REFERENCES public.dim_rig(id) NOT NULL,
  metric_id UUID REFERENCES public.dim_metric(id) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  currency TEXT DEFAULT 'OMR',
  budget_value NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(version_id, report_id, rig_id, metric_id, year, month, currency)
);

CREATE INDEX idx_fact_budget_composite ON public.fact_budget(version_id, report_id, rig_id, year, month);
CREATE INDEX idx_fact_budget_metric ON public.fact_budget(metric_id);
CREATE INDEX idx_fact_budget_version ON public.fact_budget(version_id);

ALTER TABLE public.fact_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage budgets"
ON public.fact_budget FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Non-admins cannot select budgets"
ON public.fact_budget FOR SELECT
TO authenticated
USING (false);

-- 8. Create budget_change_log table (append-only audit trail)
CREATE TABLE public.budget_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.fact_budget(id),
  version_id UUID REFERENCES public.budget_version(id) NOT NULL,
  change_type TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  source TEXT,
  metadata JSONB
);

CREATE INDEX idx_change_log_version ON public.budget_change_log(version_id);
CREATE INDEX idx_change_log_changed_by ON public.budget_change_log(changed_by);
CREATE INDEX idx_change_log_changed_at ON public.budget_change_log(changed_at);
CREATE INDEX idx_change_log_budget_id ON public.budget_change_log(budget_id);

ALTER TABLE public.budget_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view change logs"
ON public.budget_change_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.dim_rig IS 'Master dimension table for rigs';
COMMENT ON TABLE public.dim_date IS 'Date dimension table for time-based analysis';
COMMENT ON TABLE public.dim_report IS 'Master list of all reports in the system';
COMMENT ON TABLE public.dim_metric IS 'Master list of all metrics tracked across reports';
COMMENT ON TABLE public.budget_version IS 'Budget version management with approval workflow';
COMMENT ON TABLE public.fact_budget IS 'Atomic monthly budget values per report/rig/metric';
COMMENT ON TABLE public.budget_change_log IS 'Append-only audit trail for all budget changes';