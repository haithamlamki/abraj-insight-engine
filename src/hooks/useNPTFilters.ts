import { useState, useMemo } from 'react';
import { NPTRecord } from './useNPTRootCauseData';

export interface NPTFilters {
  years: number[];
  months: string[];
  rigs: string[];
  nptTypes: string[];
  systems: string[];
  departments: string[];
  rootCauses: string[];
  durationBucket: string | null;
}

export function useNPTFilters(data: NPTRecord[]) {
  const [filters, setFilters] = useState<NPTFilters>({
    years: [],
    months: [],
    rigs: [],
    nptTypes: ['Abraj'],
    systems: [],
    departments: [],
    rootCauses: [],
    durationBucket: null
  });

  const updateFilters = (updates: Partial<NPTFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters({
      years: [],
      months: [],
      rigs: [],
      nptTypes: ['Abraj'],
      systems: [],
      departments: [],
      rootCauses: [],
      durationBucket: null
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.years.length > 0 ||
      filters.months.length > 0 ||
      filters.rigs.length > 0 ||
      filters.nptTypes.length > 0 ||
      filters.systems.length > 0 ||
      filters.departments.length > 0 ||
      filters.rootCauses.length > 0 ||
      filters.durationBucket !== null;
  }, [filters]);

  // Available filter options based on current selection
  const availableOptions = useMemo(() => {
    let filteredData = [...data];

    // Apply each filter progressively to get available options
    if (filters.years.length > 0) {
      filteredData = filteredData.filter(r => filters.years.includes(r.year));
    }
    if (filters.months.length > 0) {
      filteredData = filteredData.filter(r => filters.months.includes(r.month));
    }
    if (filters.rigs.length > 0) {
      filteredData = filteredData.filter(r => filters.rigs.includes(r.rig_number));
    }
    if (filters.nptTypes.length > 0) {
      filteredData = filteredData.filter(r => filters.nptTypes.includes(r.npt_type));
    }
    if (filters.systems.length > 0) {
      filteredData = filteredData.filter(r => filters.systems.includes(r.system));
    }

    return {
      years: Array.from(new Set(filteredData.map(r => r.year))).sort((a, b) => b - a),
      months: Array.from(new Set(filteredData.map(r => r.month))),
      rigs: Array.from(new Set(filteredData.map(r => r.rig_number))).sort(),
      nptTypes: Array.from(new Set(filteredData.map(r => r.npt_type))).filter(Boolean),
      systems: Array.from(new Set(filteredData.map(r => r.system))).filter(Boolean),
      departments: Array.from(new Set(filteredData.map(r => r.department_responsibility))).filter(Boolean),
      rootCauses: Array.from(new Set(filteredData.map(r => r.root_cause))).filter(Boolean)
    };
  }, [data, filters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    availableOptions
  };
}
