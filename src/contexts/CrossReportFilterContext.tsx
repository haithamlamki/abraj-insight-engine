import { createContext, useContext, useState, ReactNode } from 'react';

interface CrossReportFilters {
  rig?: string;
  rigs?: string[];
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: string;
  client?: string;
  dateRange?: { start: string; end: string };
  [key: string]: any;
}

interface CrossReportFilterContextType {
  filters: CrossReportFilters;
  setFilters: (filters: CrossReportFilters) => void;
  updateFilters: (updates: Partial<CrossReportFilters>) => void;
  clearFilters: () => void;
  getRelevantFilters: (targetReport: string) => CrossReportFilters;
}

const CrossReportFilterContext = createContext<CrossReportFilterContextType | undefined>(undefined);

export const CrossReportFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<CrossReportFilters>({});

  const updateFilters = (updates: Partial<CrossReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Map filters based on target report type
  const getRelevantFilters = (targetReport: string): CrossReportFilters => {
    const relevantFilters: CrossReportFilters = {};

    // Common filters that apply to all reports
    if (filters.rig) relevantFilters.rig = filters.rig;
    if (filters.rigs) relevantFilters.rigs = filters.rigs;
    if (filters.client) relevantFilters.client = filters.client;
    
    // Date filters
    if (filters.startDate) relevantFilters.startDate = filters.startDate;
    if (filters.endDate) relevantFilters.endDate = filters.endDate;
    if (filters.year) relevantFilters.year = filters.year;
    if (filters.month) relevantFilters.month = filters.month;
    if (filters.dateRange) relevantFilters.dateRange = filters.dateRange;

    // Report-specific filter mapping
    const filterMapping: Record<string, string[]> = {
      revenue: ['rig', 'rigs', 'client', 'year', 'month', 'startDate', 'endDate', 'dateRange'],
      utilization: ['rig', 'rigs', 'client', 'year', 'month', 'startDate', 'endDate', 'dateRange', 'status'],
      billing_npt: ['rig', 'rigs', 'year', 'month', 'startDate', 'endDate', 'dateRange', 'billable', 'npt_type'],
      npt_root_cause: ['rig', 'rigs', 'year', 'month', 'startDate', 'endDate', 'dateRange', 'system', 'npt_type'],
      fuel: ['rig', 'rigs', 'year', 'month', 'startDate', 'endDate', 'dateRange'],
      fuel_analytics: ['rig', 'rigs', 'year', 'month', 'startDate', 'endDate', 'dateRange'],
      budget: ['rig', 'rigs', 'year', 'month'],
    };

    const allowedFilters = filterMapping[targetReport] || ['rig', 'rigs', 'year', 'month'];
    
    // Only include filters that are relevant to the target report
    Object.keys(relevantFilters).forEach(key => {
      if (!allowedFilters.includes(key)) {
        delete relevantFilters[key];
      }
    });

    return relevantFilters;
  };

  return (
    <CrossReportFilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilters,
        clearFilters,
        getRelevantFilters
      }}
    >
      {children}
    </CrossReportFilterContext.Provider>
  );
};

export const useCrossReportFilters = () => {
  const context = useContext(CrossReportFilterContext);
  if (!context) {
    throw new Error('useCrossReportFilters must be used within CrossReportFilterProvider');
  }
  return context;
};
