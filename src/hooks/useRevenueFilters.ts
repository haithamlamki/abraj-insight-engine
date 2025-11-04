import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface RevenueFilters {
  years: number[];
  months: string[];
  rigs: string[];
  revenueRange: { min: number | null; max: number | null };
  varianceType: 'all' | 'positive' | 'negative' | 'within5' | 'within10';
}

const DEFAULT_FILTERS: RevenueFilters = {
  years: [],
  months: [],
  rigs: [],
  revenueRange: { min: null, max: null },
  varianceType: 'all',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function useRevenueFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<RevenueFilters>(() => {
    // Initialize from URL params if available
    return {
      years: searchParams.get('years')?.split(',').map(Number).filter(Boolean) || [],
      months: searchParams.get('months')?.split(',').filter(Boolean) || [],
      rigs: searchParams.get('rigs')?.split(',').filter(Boolean) || [],
      revenueRange: {
        min: searchParams.get('minRev') ? Number(searchParams.get('minRev')) : null,
        max: searchParams.get('maxRev') ? Number(searchParams.get('maxRev')) : null,
      },
      varianceType: (searchParams.get('variance') as RevenueFilters['varianceType']) || 'all',
    };
  });

  // Sync filters to URL
  const syncToURL = useCallback((newFilters: RevenueFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.years.length > 0) {
      params.set('years', newFilters.years.join(','));
    }
    if (newFilters.months.length > 0) {
      params.set('months', newFilters.months.join(','));
    }
    if (newFilters.rigs.length > 0) {
      params.set('rigs', newFilters.rigs.join(','));
    }
    if (newFilters.revenueRange.min !== null) {
      params.set('minRev', String(newFilters.revenueRange.min));
    }
    if (newFilters.revenueRange.max !== null) {
      params.set('maxRev', String(newFilters.revenueRange.max));
    }
    if (newFilters.varianceType !== 'all') {
      params.set('variance', newFilters.varianceType);
    }

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Update filters
  const updateFilters = useCallback((updates: Partial<RevenueFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      syncToURL(newFilters);
      return newFilters;
    });
  }, [syncToURL]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Quick filter presets
  const applyQuickFilter = useCallback((preset: string) => {
    const currentYear = new Date().getFullYear();
    
    switch (preset) {
      case 'ytd':
        updateFilters({
          years: [currentYear],
          months: MONTH_NAMES.slice(0, new Date().getMonth() + 1),
        });
        break;
      case 'q1':
        updateFilters({ months: MONTH_NAMES.slice(0, 3) });
        break;
      case 'q2':
        updateFilters({ months: MONTH_NAMES.slice(3, 6) });
        break;
      case 'q3':
        updateFilters({ months: MONTH_NAMES.slice(6, 9) });
        break;
      case 'q4':
        updateFilters({ months: MONTH_NAMES.slice(9, 12) });
        break;
      case 'current_year':
        updateFilters({ years: [currentYear] });
        break;
      case 'over_budget':
        updateFilters({ varianceType: 'positive' });
        break;
      case 'under_budget':
        updateFilters({ varianceType: 'negative' });
        break;
      case 'problem_rigs':
        updateFilters({ varianceType: 'negative' });
        break;
      case 'star_performers':
        updateFilters({ varianceType: 'positive' });
        break;
    }
  }, [updateFilters]);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.years.length > 0 ||
    filters.months.length > 0 ||
    filters.rigs.length > 0 ||
    filters.revenueRange.min !== null ||
    filters.revenueRange.max !== null ||
    filters.varianceType !== 'all';

  return {
    filters,
    updateFilters,
    resetFilters,
    applyQuickFilter,
    hasActiveFilters,
  };
}
