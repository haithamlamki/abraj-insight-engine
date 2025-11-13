-- Create dashboard_layouts table for custom dashboards
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create dashboard_shares table for sharing dashboards
CREATE TABLE IF NOT EXISTS public.dashboard_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboard_layouts(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dashboard_id, shared_with_user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_template ON public.dashboard_layouts(is_template);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_user ON public.dashboard_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard ON public.dashboard_shares(dashboard_id);

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_layouts
CREATE POLICY "Users can view their own dashboards"
  ON public.dashboard_layouts
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_template = true 
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.dashboard_shares 
      WHERE dashboard_id = id AND shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own dashboards"
  ON public.dashboard_layouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
  ON public.dashboard_layouts
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.dashboard_shares 
      WHERE dashboard_id = id AND shared_with_user_id = auth.uid() AND can_edit = true
    )
  );

CREATE POLICY "Users can delete their own dashboards"
  ON public.dashboard_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dashboards"
  ON public.dashboard_layouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dashboard_shares
CREATE POLICY "Users can view shares of their dashboards"
  ON public.dashboard_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_layouts 
      WHERE id = dashboard_id AND user_id = auth.uid()
    )
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Dashboard owners can create shares"
  ON public.dashboard_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dashboard_layouts 
      WHERE id = dashboard_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Dashboard owners can delete shares"
  ON public.dashboard_shares
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_layouts 
      WHERE id = dashboard_id AND user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default dashboard templates
INSERT INTO public.dashboard_layouts (user_id, name, description, is_template, is_public, layout)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Executive Summary',
  'High-level overview of key business metrics',
  true,
  true,
  '[
    {"i":"kpi-revenue","x":0,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"revenue","label":"Total Revenue","reportType":"revenue"}},
    {"i":"kpi-utilization","x":3,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"utilization_rate","label":"Avg Utilization","reportType":"utilization"}},
    {"i":"kpi-npt","x":6,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"npt_hours","label":"Total NPT Hours","reportType":"billing_npt"}},
    {"i":"kpi-work-orders","x":9,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"open_work_orders","label":"Open Work Orders","reportType":"work_orders"}},
    {"i":"chart-revenue-trend","x":0,"y":2,"w":6,"h":4,"widgetType":"line-chart","config":{"reportType":"revenue","metric":"revenue_actual","title":"Revenue Trend"}},
    {"i":"chart-npt-trend","x":6,"y":2,"w":6,"h":4,"widgetType":"bar-chart","config":{"reportType":"billing_npt","metric":"npt_hours","title":"NPT Hours by Month"}}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_layouts WHERE name = 'Executive Summary' AND is_template = true);

INSERT INTO public.dashboard_layouts (user_id, name, description, is_template, is_public, layout)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Operations View',
  'Detailed operational metrics and rig performance',
  true,
  true,
  '[
    {"i":"kpi-active-rigs","x":0,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"active_rigs","label":"Active Rigs","reportType":"utilization"}},
    {"i":"kpi-efficiency","x":3,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"utilization_rate","label":"Fleet Efficiency","reportType":"utilization"}},
    {"i":"kpi-npt-rate","x":6,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"npt_hours","label":"NPT Hours","reportType":"billing_npt"}},
    {"i":"kpi-stock-alerts","x":9,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"low_stock","label":"Low Stock Items","reportType":"stock_levels"}},
    {"i":"chart-utilization","x":0,"y":2,"w":6,"h":4,"widgetType":"line-chart","config":{"reportType":"utilization","metric":"utilization_rate","title":"Utilization Trend"}},
    {"i":"table-rigs","x":6,"y":2,"w":6,"h":4,"widgetType":"table","config":{"reportType":"utilization","title":"Rig Performance"}}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_layouts WHERE name = 'Operations View' AND is_template = true);

INSERT INTO public.dashboard_layouts (user_id, name, description, is_template, is_public, layout)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Financial View',
  'Revenue, costs, and financial performance tracking',
  true,
  true,
  '[
    {"i":"kpi-total-revenue","x":0,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"revenue_actual","label":"Total Revenue","reportType":"revenue"}},
    {"i":"kpi-variance","x":3,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"variance","label":"Budget Variance","reportType":"revenue"}},
    {"i":"kpi-fuel-cost","x":6,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"fuel_cost","label":"Fuel Costs","reportType":"fuel_consumption"}},
    {"i":"kpi-dayrate","x":9,"y":0,"w":3,"h":2,"widgetType":"kpi","config":{"metric":"dayrate_actual","label":"Avg Day Rate","reportType":"revenue"}},
    {"i":"chart-revenue-comparison","x":0,"y":2,"w":6,"h":4,"widgetType":"line-chart","config":{"reportType":"revenue","metric":"revenue_actual","title":"Revenue vs Budget"}},
    {"i":"chart-cost-breakdown","x":6,"y":2,"w":6,"h":4,"widgetType":"pie-chart","config":{"reportType":"fuel_consumption","metric":"fuel_cost","title":"Cost Breakdown"}}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_layouts WHERE name = 'Financial View' AND is_template = true);