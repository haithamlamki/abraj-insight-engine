import { createContext, useContext, useState, ReactNode } from 'react';

interface CrossReportFilters {
  rig?: string;
  rigs?: string[];
  startDate?: string;
  endDate?: string;
  year?: number;
  years?: number[];
  month?: string;
  months?: string[];
  client?: string;
  dateRange?: { start: string; end: string };
  nptTypes?: string[];
  systems?: string[];
  departments?: string[];
  status?: string;
  billable?: boolean;
  [key: string]: any;
}

interface CrossReportFilterContextType {
  filters: CrossReportFilters;
  setFilters: (filters: CrossReportFilters) => void;
  updateFilters: (updates: Partial<CrossReportFilters>) => void;
  clearFilters: () => void;
  getRelevantFilters: (targetReport: string) => CrossReportFilters;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
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

  const hasActiveFilters = (): boolean => {
    return Object.entries(filters).some(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    });
  };

  const getActiveFilterCount = (): number => {
    return Object.entries(filters).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    }).length;
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
      revenue: ['rig', 'rigs', 'client', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange'],
      utilization: ['rig', 'rigs', 'client', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange', 'status'],
      billing_npt: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange', 'billable', 'nptTypes', 'systems'],
      npt_root_cause: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange', 'systems', 'nptTypes', 'departments'],
      fuel: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange'],
      fuel_consumption: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange'],
      fuel_analytics: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange'],
      work_orders: ['rig', 'rigs', 'year', 'years', 'month', 'months', 'startDate', 'endDate', 'dateRange'],
      rig_moves: ['rig', 'rigs', 'startDate', 'endDate', 'dateRange'],
      customer_satisfaction: ['rig', 'rigs', 'year', 'years', 'month', 'months'],
      budget: ['rig', 'rigs', 'year', 'years', 'month', 'months'],
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
        getRelevantFilters,
        hasActiveFilters,
        getActiveFilterCount
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
