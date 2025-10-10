import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VarianceRequest {
  report_key: string;
  rig_code?: string;
  year: number;
  month?: number;
  metric_key?: string;
  version_id?: string;
}

interface VarianceResponse {
  actual: number | null;
  variance_pct: number | null;
  band: 'within_5' | 'within_10' | 'within_20' | 'above_20' | null;
  direction: 'above' | 'below' | 'on_target' | null;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  message: string;
  budget_value?: number;
  currency?: string;
}

export function useBudgetVariance(params: VarianceRequest) {
  return useQuery({
    queryKey: ['budget-variance', params],
    queryFn: async (): Promise<VarianceResponse> => {
      const { data, error } = await supabase.functions.invoke('get-budget-variance', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!params.report_key && !!params.year,
  });
}
