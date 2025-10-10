-- Create revenue tracking table
CREATE TABLE IF NOT EXISTS public.revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  dayrate_actual DECIMAL(12,2),
  dayrate_budget DECIMAL(12,2),
  working_days DECIMAL(5,2),
  revenue_actual DECIMAL(15,2),
  revenue_budget DECIMAL(15,2),
  variance DECIMAL(15,2),
  fuel_charge DECIMAL(12,2),
  npt_repair DECIMAL(12,2),
  npt_zero DECIMAL(12,2),
  comments TEXT,
  client TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing NPT table
CREATE TABLE IF NOT EXISTS public.billing_npt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  date DATE NOT NULL,
  npt_hours DECIMAL(6,2),
  system TEXT,
  equipment_failure TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  notification_number TEXT,
  billable BOOLEAN DEFAULT false,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create utilization table
CREATE TABLE IF NOT EXISTS public.utilization (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  operating_days DECIMAL(5,2),
  npt_days DECIMAL(5,2),
  allowable_npt DECIMAL(5,2),
  working_days DECIMAL(5,2),
  utilization_rate DECIMAL(5,2),
  client TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fuel consumption table
CREATE TABLE IF NOT EXISTS public.fuel_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  date DATE NOT NULL,
  fuel_consumed DECIMAL(10,2),
  fuel_type TEXT,
  unit_price DECIMAL(8,2),
  total_cost DECIMAL(12,2),
  supplier TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock levels table
CREATE TABLE IF NOT EXISTS public.stock_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  current_qty INTEGER,
  target_qty INTEGER,
  unit TEXT,
  last_reorder_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create work orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  elec_open INTEGER DEFAULT 0,
  elec_closed INTEGER DEFAULT 0,
  mech_open INTEGER DEFAULT 0,
  mech_closed INTEGER DEFAULT 0,
  oper_open INTEGER DEFAULT 0,
  oper_closed INTEGER DEFAULT 0,
  compliance_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer satisfaction table
CREATE TABLE IF NOT EXISTS public.customer_satisfaction (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  satisfaction_score DECIMAL(5,2),
  feedback TEXT,
  client TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rig moves table
CREATE TABLE IF NOT EXISTS public.rig_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  move_date DATE NOT NULL,
  from_location TEXT,
  to_location TEXT,
  distance_km DECIMAL(8,2),
  budgeted_time_hours DECIMAL(6,2),
  actual_time_hours DECIMAL(6,2),
  budgeted_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  variance_cost DECIMAL(12,2),
  profit_loss DECIMAL(12,2),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create well tracker table
CREATE TABLE IF NOT EXISTS public.well_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  well_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  target_depth DECIMAL(8,2),
  actual_depth DECIMAL(8,2),
  status TEXT,
  operator TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_updated_at BEFORE UPDATE ON public.revenue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_npt_updated_at BEFORE UPDATE ON public.billing_npt
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_utilization_updated_at BEFORE UPDATE ON public.utilization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_consumption_updated_at BEFORE UPDATE ON public.fuel_consumption
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON public.stock_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_satisfaction_updated_at BEFORE UPDATE ON public.customer_satisfaction
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rig_moves_updated_at BEFORE UPDATE ON public.rig_moves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_well_tracker_updated_at BEFORE UPDATE ON public.well_tracker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_npt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rig_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.well_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security requirements)
CREATE POLICY "Allow all operations on revenue" ON public.revenue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on billing_npt" ON public.billing_npt FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on utilization" ON public.utilization FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on fuel_consumption" ON public.fuel_consumption FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_levels" ON public.stock_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on work_orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customer_satisfaction" ON public.customer_satisfaction FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on rig_moves" ON public.rig_moves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on well_tracker" ON public.well_tracker FOR ALL USING (true) WITH CHECK (true);