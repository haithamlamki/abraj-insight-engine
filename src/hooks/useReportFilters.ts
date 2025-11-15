import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCrossReportFilters } from '@/contexts/CrossReportFilterContext';

/**
 * Hook to sync URL params with cross-report filters
 * Use this in report pages to read and apply filters from URL
 */
export const useReportFilters = (reportType: string) => {
  const [searchParams] = useSearchParams();
  const { updateFilters, getRelevantFilters, filters } = useCrossReportFilters();

  // Apply filters from URL on mount
  useEffect(() => {
    const urlFilters: any = {};
    
    // Parse all URL parameters
    searchParams.forEach((value, key) => {
      try {
        // Try to parse as JSON first (for objects)
        if (value.startsWith('{') || value.startsWith('[')) {
          urlFilters[key] = JSON.parse(value);
        } 
        // Parse comma-separated arrays
        else if (value.includes(',')) {
          urlFilters[key] = value.split(',');
        }
        // Parse numbers
        else if (!isNaN(Number(value))) {
          urlFilters[key] = Number(value);
        }
        // Keep as string
        else {
          urlFilters[key] = value;
        }
      } catch (e) {
        // If parsing fails, keep as string
        urlFilters[key] = value;
      }
    });

    if (Object.keys(urlFilters).length > 0) {
      updateFilters(urlFilters);
    }
  }, [searchParams, updateFilters]);

  // Get relevant filters for this report type
  const activeFilters = getRelevantFilters(reportType);

  return {
    filters: activeFilters,
    allFilters: filters,
    updateFilters
  };
};

