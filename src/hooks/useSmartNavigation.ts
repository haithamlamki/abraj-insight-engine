import { useNavigate } from 'react-router-dom';
import { useCrossReportFilters } from '@/contexts/CrossReportFilterContext';
import { useToast } from '@/hooks/use-toast';

export interface RelatedReport {
  id: string;
  name: string;
  path: string;
  description: string;
  icon?: string;
  relationReason?: string;
}

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const { updateFilters, getRelevantFilters } = useCrossReportFilters();
  const { toast } = useToast();

  // Define relationships between reports
  const reportRelationships: Record<string, RelatedReport[]> = {
    revenue: [
      {
        id: 'utilization',
        name: 'Utilization',
        path: '/rig-financials/utilization',
        description: 'See rig efficiency and working days',
        relationReason: 'Revenue is directly impacted by utilization rates'
      },
      {
        id: 'billing_npt',
        name: 'Billing NPT',
        path: '/rig-financials/billing-npt',
        description: 'Analyze non-productive time costs',
        relationReason: 'NPT affects revenue and day rates'
      },
      {
        id: 'budget',
        name: 'Budget Analytics',
        path: '/admin/budget-analytics',
        description: 'Compare against budget targets',
        relationReason: 'Track revenue vs budget variance'
      }
    ],
    utilization: [
      {
        id: 'revenue',
        name: 'Revenue',
        path: '/rig-financials/revenue',
        description: 'View revenue impact',
        relationReason: 'Utilization drives revenue generation'
      },
      {
        id: 'npt_root_cause',
        name: 'NPT Root Cause',
        path: '/rig-financials/npt-root-cause',
        description: 'Investigate downtime causes',
        relationReason: 'NPT reduces utilization rates'
      },
      {
        id: 'fuel',
        name: 'Fuel Consumption',
        path: '/rig-consumption/fuel',
        description: 'See fuel usage patterns',
        relationReason: 'Operating rigs consume fuel'
      }
    ],
    billing_npt: [
      {
        id: 'npt_root_cause',
        name: 'NPT Root Cause',
        path: '/rig-financials/npt-root-cause',
        description: 'Deep dive into failure analysis',
        relationReason: 'Understand root causes of NPT'
      },
      {
        id: 'revenue',
        name: 'Revenue',
        path: '/rig-financials/revenue',
        description: 'See revenue impact',
        relationReason: 'NPT directly affects revenue'
      },
      {
        id: 'utilization',
        name: 'Utilization',
        path: '/rig-financials/utilization',
        description: 'Check efficiency metrics',
        relationReason: 'NPT reduces utilization'
      }
    ],
    npt_root_cause: [
      {
        id: 'billing_npt',
        name: 'Billing NPT',
        path: '/rig-financials/billing-npt',
        description: 'View billing implications',
        relationReason: 'See billable vs non-billable NPT'
      },
      {
        id: 'utilization',
        name: 'Utilization',
        path: '/rig-financials/utilization',
        description: 'Analyze utilization impact',
        relationReason: 'NPT causes reduce utilization'
      }
    ],
    fuel: [
      {
        id: 'fuel_analytics',
        name: 'Fuel Analytics',
        path: '/rig-consumption/fuel-analytics',
        description: 'Detailed consumption analysis',
        relationReason: 'Advanced fuel analytics and trends'
      },
      {
        id: 'utilization',
        name: 'Utilization',
        path: '/rig-financials/utilization',
        description: 'Compare with operational hours',
        relationReason: 'Fuel consumption correlates with utilization'
      },
      {
        id: 'revenue',
        name: 'Revenue',
        path: '/rig-financials/revenue',
        description: 'See cost impact on revenue',
        relationReason: 'Fuel is a major operational cost'
      }
    ],
    fuel_analytics: [
      {
        id: 'fuel',
        name: 'Fuel Consumption',
        path: '/rig-consumption/fuel',
        description: 'View raw consumption data',
        relationReason: 'Access detailed consumption records'
      },
      {
        id: 'revenue',
        name: 'Revenue',
        path: '/rig-financials/revenue',
        description: 'Analyze fuel cost impact',
        relationReason: 'Fuel charges affect total revenue'
      }
    ],
    budget: [
      {
        id: 'revenue',
        name: 'Revenue',
        path: '/rig-financials/revenue',
        description: 'Compare actual vs budget',
        relationReason: 'Track budget performance'
      },
      {
        id: 'utilization',
        name: 'Utilization',
        path: '/rig-financials/utilization',
        description: 'Operational efficiency',
        relationReason: 'Utilization impacts budget'
      }
    ]
  };

  const navigateToReport = (
    targetReport: string,
    currentFilters?: any,
    options?: { preserveAll?: boolean }
  ) => {
    // Update cross-report filters
    if (currentFilters) {
      updateFilters(currentFilters);
    }

    // Get relevant filters for target report
    const relevantFilters = getRelevantFilters(targetReport);
    const hasFilters = Object.keys(relevantFilters).length > 0;

    // Find report path
    const allReports = Object.values(reportRelationships).flat();
    const report = allReports.find(r => r.id === targetReport);

    if (!report) {
      toast({
        title: "Navigation Error",
        description: "Report not found",
        variant: "destructive"
      });
      return;
    }

    // Build URL with query parameters
    const params = new URLSearchParams();
    if (hasFilters) {
      Object.entries(relevantFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else if (typeof value === 'object') {
            params.set(key, JSON.stringify(value));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    const url = params.toString() ? `${report.path}?${params.toString()}` : report.path;
    
    // Navigate
    navigate(url);

    // Show toast notification
    if (hasFilters) {
      const filterCount = Object.keys(relevantFilters).length;
      toast({
        title: "Navigating with filters",
        description: `${filterCount} filter${filterCount > 1 ? 's' : ''} applied to ${report.name}`,
      });
    }
  };

  const getRelatedReports = (currentReport: string): RelatedReport[] => {
    return reportRelationships[currentReport] || [];
  };

  return {
    navigateToReport,
    getRelatedReports
  };
};
