import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface UtilizationFilters {
  years: string[];
  months: string[];
  clients: string[];
  rigs: string[];
  status: string[];
  utilizationRange: [number, number];
}

export function useUtilizationFilters(data: any[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState<UtilizationFilters>(() => {
    const yearsParam = searchParams.get('years');
    const monthsParam = searchParams.get('months');
    const clientsParam = searchParams.get('clients');
    const rigsParam = searchParams.get('rigs');
    const statusParam = searchParams.get('status');
    const minUtilization = searchParams.get('minUtilization');
    const maxUtilization = searchParams.get('maxUtilization');

    return {
      years: yearsParam ? yearsParam.split(',') : [],
      months: monthsParam ? monthsParam.split(',') : [],
      clients: clientsParam ? clientsParam.split(',') : [],
      rigs: rigsParam ? rigsParam.split(',') : [],
      status: statusParam ? statusParam.split(',') : [],
      utilizationRange: [
        minUtilization ? parseInt(minUtilization) : 0,
        maxUtilization ? parseInt(maxUtilization) : 100,
      ],
    };
  });

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: UtilizationFilters) => {
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    if (newFilters.years.length > 0) params.set('years', newFilters.years.join(','));
    if (newFilters.months.length > 0) params.set('months', newFilters.months.join(','));
    if (newFilters.clients.length > 0) params.set('clients', newFilters.clients.join(','));
    if (newFilters.rigs.length > 0) params.set('rigs', newFilters.rigs.join(','));
    if (newFilters.status.length > 0) params.set('status', newFilters.status.join(','));
    if (newFilters.utilizationRange[0] > 0) params.set('minUtilization', newFilters.utilizationRange[0].toString());
    if (newFilters.utilizationRange[1] < 100) params.set('maxUtilization', newFilters.utilizationRange[1].toString());
    
    setSearchParams(params);
  }, [setSearchParams]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.year?.toString()).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    const months = Array.from(new Set(data.map(d => d.month).filter(Boolean))).sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
    const clients = Array.from(new Set(data.map(d => d.client).filter(Boolean))).sort();
    const rigs = Array.from(new Set(data.map(d => d.rig).filter(Boolean))).sort();
    const statusOptions = ['Active', 'Stacked'];

    return { years, months, clients, rigs, statusOptions };
  }, [data]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (filters.years.length > 0 && !filters.years.includes(record.year?.toString())) return false;
      if (filters.months.length > 0 && !filters.months.includes(record.month)) return false;
      if (filters.clients.length > 0 && !filters.clients.includes(record.client)) return false;
      if (filters.rigs.length > 0 && !filters.rigs.includes(record.rig)) return false;
      if (filters.status.length > 0 && !filters.status.includes(record.status || 'Active')) return false;
      
      const utilization = record.utilization_rate;
      if (utilization !== null && utilization !== undefined) {
        if (utilization < filters.utilizationRange[0] || utilization > filters.utilizationRange[1]) return false;
      }
      
      return true;
    });
  }, [data, filters]);

  const clearFilters = useCallback(() => {
    updateFilters({
      years: [],
      months: [],
      clients: [],
      rigs: [],
      status: [],
      utilizationRange: [0, 100],
    });
  }, [updateFilters]);

  const applyQuickFilter = useCallback((filterType: string) => {
    const currentYear = new Date().getFullYear().toString();
    
    switch (filterType) {
      case 'current_year':
        updateFilters({ ...filters, years: [currentYear] });
        break;
      case 'active_only':
        updateFilters({ ...filters, status: ['Active'] });
        break;
      case 'low_utilization':
        updateFilters({ ...filters, utilizationRange: [0, 50], status: ['Active'] });
        break;
      case 'high_performers':
        updateFilters({ ...filters, utilizationRange: [90, 100], status: ['Active'] });
        break;
      case 'stacked':
        updateFilters({ ...filters, status: ['Stacked'] });
        break;
    }
  }, [filters, updateFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.years.length > 0) count++;
    if (filters.months.length > 0) count++;
    if (filters.clients.length > 0) count++;
    if (filters.rigs.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.utilizationRange[0] > 0 || filters.utilizationRange[1] < 100) count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilters,
    filterOptions,
    filteredData,
    clearFilters,
    applyQuickFilter,
    activeFilterCount,
    totalRecords: data.length,
    filteredRecords: filteredData.length,
  };
}
