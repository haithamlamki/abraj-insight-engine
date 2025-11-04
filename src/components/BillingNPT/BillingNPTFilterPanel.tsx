import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillingNPTFilters } from "@/hooks/useBillingNPTFilters";
import { X, Filter } from "lucide-react";

interface BillingNPTFilterPanelProps {
  filters: BillingNPTFilters;
  onFiltersChange: (filters: Partial<BillingNPTFilters>) => void;
  onClearFilters: () => void;
  onApplyQuickFilter: (filterName: string) => void;
  availableYears: number[];
  availableMonths: string[];
  availableRigs: string[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RATE_TYPES = ['Operational', 'Repair', 'Zero', 'Reduce', 'Special', 'Rig Move', 'A.Maint'];
const QUICK_FILTERS = [
  { id: 'current-year', label: 'Current Year' },
  { id: 'last-6-months', label: 'Last 6 Months' },
  { id: 'high-npt', label: 'High NPT (>500hrs)' },
  { id: 'low-efficiency', label: 'Low Efficiency (<70%)' }
];

export const BillingNPTFilterPanel = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyQuickFilter,
  availableYears,
  availableMonths,
  availableRigs
}: BillingNPTFilterPanelProps) => {
  const hasActiveFilters = filters.years.length > 0 || 
                          filters.months.length > 0 || 
                          filters.rigs.length > 0 ||
                          filters.nptRange[0] > 0 ||
                          filters.nptRange[1] < 1000;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary">{
              (filters.years.length || 0) + 
              (filters.months.length || 0) + 
              (filters.rigs.length || 0)
            } active</Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Quick Filters */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(qf => (
              <Badge
                key={qf.id}
                variant={filters.quickFilter === qf.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onApplyQuickFilter(qf.id)}
              >
                {qf.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Years */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Years</Label>
          <div className="grid grid-cols-3 gap-2">
            {availableYears.map(year => (
              <div key={year} className="flex items-center space-x-2">
                <Checkbox
                  id={`year-${year}`}
                  checked={filters.years.includes(year)}
                  onCheckedChange={(checked) => {
                    const newYears = checked
                      ? [...filters.years, year]
                      : filters.years.filter(y => y !== year);
                    onFiltersChange({ years: newYears });
                  }}
                />
                <label htmlFor={`year-${year}`} className="text-sm cursor-pointer">
                  {year}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Months */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Months</Label>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map(month => (
              <div key={month} className="flex items-center space-x-2">
                <Checkbox
                  id={`month-${month}`}
                  checked={filters.months.includes(month)}
                  onCheckedChange={(checked) => {
                    const newMonths = checked
                      ? [...filters.months, month]
                      : filters.months.filter(m => m !== month);
                    onFiltersChange({ months: newMonths });
                  }}
                />
                <label htmlFor={`month-${month}`} className="text-sm cursor-pointer">
                  {month}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rigs */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Rigs</Label>
          <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
            {availableRigs.map(rig => (
              <div key={rig} className="flex items-center space-x-2">
                <Checkbox
                  id={`rig-${rig}`}
                  checked={filters.rigs.includes(rig)}
                  onCheckedChange={(checked) => {
                    const newRigs = checked
                      ? [...filters.rigs, rig]
                      : filters.rigs.filter(r => r !== rig);
                    onFiltersChange({ rigs: newRigs });
                  }}
                />
                <label htmlFor={`rig-${rig}`} className="text-sm cursor-pointer">
                  {rig}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
