import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface BillingNPTFilters {
  years: number[];
  months: string[];
  rigs: string[];
  nptRange: [number, number];
  rateTypes: string[];
  quickFilter?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useBillingNPTFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL or defaults
  const filters = useMemo<BillingNPTFilters>(() => {
    const yearsParam = searchParams.get('years');
    const monthsParam = searchParams.get('months');
    const rigsParam = searchParams.get('rigs');
    const nptMinParam = searchParams.get('nptMin');
    const nptMaxParam = searchParams.get('nptMax');
    const rateTypesParam = searchParams.get('rateTypes');
    const quickFilterParam = searchParams.get('quickFilter');

    return {
      years: yearsParam ? yearsParam.split(',').map(Number) : [],
      months: monthsParam ? monthsParam.split(',') : [],
      rigs: rigsParam ? rigsParam.split(',') : [],
      nptRange: [
        nptMinParam ? Number(nptMinParam) : 0,
        nptMaxParam ? Number(nptMaxParam) : 1000
      ],
      rateTypes: rateTypesParam ? rateTypesParam.split(',') : ['all'],
      quickFilter: quickFilterParam || undefined
    };
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<BillingNPTFilters>) => {
    const params = new URLSearchParams(searchParams);

    if (newFilters.years !== undefined) {
      if (newFilters.years.length > 0) {
        params.set('years', newFilters.years.join(','));
      } else {
        params.delete('years');
      }
    }

    if (newFilters.months !== undefined) {
      if (newFilters.months.length > 0) {
        params.set('months', newFilters.months.join(','));
      } else {
        params.delete('months');
      }
    }

    if (newFilters.rigs !== undefined) {
      if (newFilters.rigs.length > 0) {
        params.set('rigs', newFilters.rigs.join(','));
      } else {
        params.delete('rigs');
      }
    }

    if (newFilters.nptRange !== undefined) {
      params.set('nptMin', newFilters.nptRange[0].toString());
      params.set('nptMax', newFilters.nptRange[1].toString());
    }

    if (newFilters.rateTypes !== undefined) {
      if (newFilters.rateTypes.length > 0) {
        params.set('rateTypes', newFilters.rateTypes.join(','));
      } else {
        params.delete('rateTypes');
      }
    }

    if (newFilters.quickFilter !== undefined) {
      if (newFilters.quickFilter) {
        params.set('quickFilter', newFilters.quickFilter);
      } else {
        params.delete('quickFilter');
      }
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const applyQuickFilter = (filterName: string) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });

    switch (filterName) {
      case 'current-year':
        updateFilters({ years: [currentYear], quickFilter: filterName });
        break;
      case 'last-6-months':
        const last6Months = MONTH_NAMES.slice(
          Math.max(0, MONTH_NAMES.indexOf(currentMonth) - 5),
          MONTH_NAMES.indexOf(currentMonth) + 1
        );
        updateFilters({ 
          years: [currentYear], 
          months: last6Months,
          quickFilter: filterName 
        });
        break;
      case 'high-npt':
        updateFilters({ nptRange: [500, 1000], quickFilter: filterName });
        break;
      case 'low-efficiency':
        updateFilters({ quickFilter: filterName });
        break;
      default:
        break;
    }
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    applyQuickFilter,
    hasActiveFilters: filters.years.length > 0 || 
                      filters.months.length > 0 || 
                      filters.rigs.length > 0 ||
                      filters.nptRange[0] > 0 ||
                      filters.nptRange[1] < 1000 ||
                      (filters.rateTypes.length > 0 && !filters.rateTypes.includes('all'))
  };
}
