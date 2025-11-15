import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  Filter,
  X,
  Clock,
  Users,
  DollarSign,
  Wrench,
  Activity
} from 'lucide-react';

interface SmartFilter {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: 'time' | 'status' | 'performance' | 'financial' | 'custom';
  apply: () => void;
}

interface SmartFilterPanelProps {
  reportType: string;
  onFilterApply: (filters: any) => void;
  activeFilters: number;
  onClearAll: () => void;
}

export const SmartFilterPanel = ({ 
  reportType, 
  onFilterApply, 
  activeFilters,
  onClearAll 
}: SmartFilterPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define smart filters based on report type
  const smartFilters: SmartFilter[] = useMemo(() => {
    const baseFilters: SmartFilter[] = [
      // Time-based filters
      {
        id: 'last-7-days',
        label: 'Last 7 Days',
        description: 'Show data from the past week',
        icon: Clock,
        category: 'time',
        apply: () => {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          onFilterApply({
            type: 'dateRange',
            startDate,
            endDate,
            label: 'Last 7 Days'
          });
        }
      },
      {
        id: 'this-month',
        label: 'This Month',
        description: 'Current month data',
        icon: Calendar,
        category: 'time',
        apply: () => {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          onFilterApply({
            type: 'dateRange',
            startDate,
            endDate,
            label: 'This Month'
          });
        }
      },
      {
        id: 'last-month',
        label: 'Last Month',
        description: 'Previous month data',
        icon: Calendar,
        category: 'time',
        apply: () => {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          onFilterApply({
            type: 'dateRange',
            startDate,
            endDate,
            label: 'Last Month'
          });
        }
      },
      {
        id: 'this-quarter',
        label: 'This Quarter',
        description: 'Current quarter data',
        icon: Calendar,
        category: 'time',
        apply: () => {
          const now = new Date();
          const quarter = Math.floor(now.getMonth() / 3);
          const startDate = new Date(now.getFullYear(), quarter * 3, 1);
          const endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          onFilterApply({
            type: 'dateRange',
            startDate,
            endDate,
            label: 'This Quarter'
          });
        }
      },
      {
        id: 'ytd',
        label: 'Year to Date',
        description: 'From January 1st to today',
        icon: Calendar,
        category: 'time',
        apply: () => {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), 0, 1);
          const endDate = now;
          onFilterApply({
            type: 'dateRange',
            startDate,
            endDate,
            label: 'Year to Date'
          });
        }
      }
    ];

    // Add report-specific filters
    if (reportType === 'utilization') {
      baseFilters.push(
        {
          id: 'high-utilization',
          label: 'High Utilization',
          description: 'Rigs with >85% utilization',
          icon: TrendingUp,
          category: 'performance',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'utilization_rate', operator: '>', value: 85 }],
              label: 'High Utilization'
            });
          }
        },
        {
          id: 'low-utilization',
          label: 'Low Utilization',
          description: 'Rigs with <50% utilization',
          icon: AlertCircle,
          category: 'performance',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'utilization_rate', operator: '<', value: 50 }],
              label: 'Low Utilization'
            });
          }
        },
        {
          id: 'active-rigs',
          label: 'Active Rigs',
          description: 'Currently operational rigs',
          icon: Activity,
          category: 'status',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'status', operator: '=', value: 'Operating' }],
              label: 'Active Rigs'
            });
          }
        }
      );
    }

    if (reportType === 'revenue') {
      baseFilters.push(
        {
          id: 'high-revenue',
          label: 'High Revenue',
          description: 'Revenue >$500K',
          icon: DollarSign,
          category: 'financial',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'revenue_actual', operator: '>', value: 500000 }],
              label: 'High Revenue'
            });
          }
        },
        {
          id: 'negative-variance',
          label: 'Under Budget',
          description: 'Revenue below budget',
          icon: AlertCircle,
          category: 'financial',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'variance', operator: '<', value: 0 }],
              label: 'Under Budget'
            });
          }
        }
      );
    }

    if (reportType === 'billing_npt') {
      baseFilters.push(
        {
          id: 'billable-npt',
          label: 'Billable NPT',
          description: 'Billable downtime only',
          icon: DollarSign,
          category: 'financial',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'billable', operator: '=', value: true }],
              label: 'Billable NPT'
            });
          }
        },
        {
          id: 'high-npt',
          label: 'High NPT',
          description: 'NPT hours >24',
          icon: AlertCircle,
          category: 'performance',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'npt_hours', operator: '>', value: 24 }],
              label: 'High NPT'
            });
          }
        }
      );
    }

    if (reportType === 'fuel_consumption') {
      baseFilters.push(
        {
          id: 'high-consumption',
          label: 'High Consumption',
          description: 'Total consumed >10000L',
          icon: TrendingUp,
          category: 'performance',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'total_consumed', operator: '>', value: 10000 }],
              label: 'High Consumption'
            });
          }
        },
        {
          id: 'low-stock',
          label: 'Low Stock',
          description: 'Closing balance <1000L',
          icon: AlertCircle,
          category: 'status',
          apply: () => {
            onFilterApply({
              type: 'advanced',
              conditions: [{ field: 'closing_balance', operator: '<', value: 1000 }],
              label: 'Low Stock'
            });
          }
        }
      );
    }

    return baseFilters;
  }, [reportType, onFilterApply]);

  const categories = useMemo(() => {
    const cats = new Map<string, { label: string; icon: any; count: number }>();
    
    smartFilters.forEach(filter => {
      const existing = cats.get(filter.category) || { label: '', icon: null, count: 0 };
      cats.set(filter.category, {
        label: filter.category.charAt(0).toUpperCase() + filter.category.slice(1),
        icon: getCategoryIcon(filter.category),
        count: existing.count + 1
      });
    });

    return Array.from(cats.entries()).map(([key, value]) => ({ key, ...value }));
  }, [smartFilters]);

  const filteredSmartFilters = useMemo(() => {
    if (!selectedCategory) return smartFilters;
    return smartFilters.filter(f => f.category === selectedCategory);
  }, [smartFilters, selectedCategory]);

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'time': return Clock;
      case 'status': return Activity;
      case 'performance': return TrendingUp;
      case 'financial': return DollarSign;
      case 'custom': return Filter;
      default: return Filter;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={activeFilters > 0 ? 'border-primary' : ''}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Smart Filters
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Smart Filters</h3>
            </div>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Quick filters tailored for your data
          </p>
        </div>

        <div className="p-2 border-b">
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-7 text-xs"
            >
              All ({smartFilters.length})
            </Button>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  className="h-7 text-xs"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {cat.label} ({cat.count})
                </Button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {filteredSmartFilters.map(filter => {
              const Icon = filter.icon;
              return (
                <Card
                  key={filter.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors border-muted"
                  onClick={filter.apply}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{filter.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {filter.description}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-muted/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Filters are automatically saved with your view</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
