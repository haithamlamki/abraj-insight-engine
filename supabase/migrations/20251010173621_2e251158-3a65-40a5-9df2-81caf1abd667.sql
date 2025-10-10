-- Fix RLS on dimension tables
ALTER TABLE public.dim_rig ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_date ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_metric ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dim_rig
CREATE POLICY "All authenticated users can view rigs"
ON public.dim_rig FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rigs"
ON public.dim_rig FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for dim_date
CREATE POLICY "All authenticated users can view dates"
ON public.dim_date FOR SELECT
TO authenticated
USING (true);

-- Create RLS policies for dim_report
CREATE POLICY "All authenticated users can view reports"
ON public.dim_report FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage reports"
ON public.dim_report FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for dim_metric
CREATE POLICY "All authenticated users can view metrics"
ON public.dim_metric FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage metrics"
ON public.dim_metric FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));