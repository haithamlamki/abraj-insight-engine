-- Drop existing fuel_consumption table and create new one with updated structure
DROP TABLE IF EXISTS public.fuel_consumption CASCADE;

CREATE TABLE public.fuel_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rig TEXT NOT NULL,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  opening_stock NUMERIC DEFAULT 0,
  total_received NUMERIC DEFAULT 0,
  total_consumed NUMERIC DEFAULT 0,
  rig_engine_consumption NUMERIC DEFAULT 0,
  camp_engine_consumption NUMERIC DEFAULT 0,
  invoice_to_client NUMERIC DEFAULT 0,
  other_site_consumers NUMERIC DEFAULT 0,
  vehicles_consumption NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  fuel_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fuel_consumption ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view fuel consumption data" 
ON public.fuel_consumption 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert fuel consumption data" 
ON public.fuel_consumption 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update fuel consumption data" 
ON public.fuel_consumption 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete fuel consumption data" 
ON public.fuel_consumption 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fuel_consumption_updated_at
BEFORE UPDATE ON public.fuel_consumption
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_fuel_consumption_rig ON public.fuel_consumption(rig);
CREATE INDEX idx_fuel_consumption_year_month ON public.fuel_consumption(year, month);