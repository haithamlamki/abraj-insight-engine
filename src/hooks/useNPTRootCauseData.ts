import { useReportData } from './useReportData';

export interface NPTRecord {
  id?: number;
  rig_number: string;
  year: number;
  month: string;
  date: number;
  hrs: number;
  npt_type: string;
  system: string;
  parent_equipment_failure: string | null;
  part_equipment_failure: string | null;
  contractual_process: string | null;
  department_responsibility: string | null;
  immediate_cause_of_failure: string | null;
  root_cause: string | null;
  immediate_corrective_action: string | null;
  future_action_improvement: string | null;
  action_party: string | null;
  notification_number: string | null;
  failure_investigation_reports: string | null;
}

export function useNPTRootCauseData() {
  const { data, isLoading, error } = useReportData('npt_root_cause');
  
  return {
    data: (data || []) as NPTRecord[],
    isLoading,
    error
  };
}
