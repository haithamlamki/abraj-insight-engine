import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RevenueFilters } from "@/hooks/useRevenueFilters";

interface ActiveFiltersBarProps {
  filters: RevenueFilters;
  onRemoveFilter: (filterType: keyof RevenueFilters, value?: any) => void;
  onClearAll: () => void;
}

export const ActiveFiltersBar = ({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBarProps) => {
  const hasFilters =
    filters.years.length > 0 ||
    filters.months.length > 0 ||
    filters.rigs.length > 0 ||
    filters.revenueRange.min !== null ||
    filters.revenueRange.max !== null ||
    filters.varianceType !== 'all';

  if (!hasFilters) return null;

  const handleRemoveYear = (year: number) => {
    onRemoveFilter('years', filters.years.filter(y => y !== year));
  };

  const handleRemoveMonth = (month: string) => {
    onRemoveFilter('months', filters.months.filter(m => m !== month));
  };

  const handleRemoveRig = (rig: string) => {
    onRemoveFilter('rigs', filters.rigs.filter(r => r !== rig));
  };

  const handleRemoveRevenueRange = () => {
    onRemoveFilter('revenueRange', { min: null, max: null });
  };

  const handleRemoveVarianceType = () => {
    onRemoveFilter('varianceType', 'all');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>

      {filters.years.map((year) => (
        <Badge key={year} variant="secondary" className="gap-1">
          Year: {year}
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={() => handleRemoveYear(year)}
          />
        </Badge>
      ))}

      {filters.months.slice(0, 3).map((month) => (
        <Badge key={month} variant="secondary" className="gap-1">
          {month.slice(0, 3)}
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={() => handleRemoveMonth(month)}
          />
        </Badge>
      ))}
      {filters.months.length > 3 && (
        <Badge variant="secondary">+{filters.months.length - 3} months</Badge>
      )}

      {filters.rigs.slice(0, 3).map((rig) => (
        <Badge key={rig} variant="secondary" className="gap-1">
          Rig {rig}
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={() => handleRemoveRig(rig)}
          />
        </Badge>
      ))}
      {filters.rigs.length > 3 && (
        <Badge variant="secondary">+{filters.rigs.length - 3} rigs</Badge>
      )}

      {(filters.revenueRange.min !== null || filters.revenueRange.max !== null) && (
        <Badge variant="secondary" className="gap-1">
          Revenue Range
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={handleRemoveRevenueRange}
          />
        </Badge>
      )}

      {filters.varianceType !== 'all' && (
        <Badge variant="secondary" className="gap-1">
          {filters.varianceType === 'positive' && 'Over Budget'}
          {filters.varianceType === 'negative' && 'Under Budget'}
          {filters.varianceType === 'within5' && 'Within ±5%'}
          {filters.varianceType === 'within10' && 'Within ±10%'}
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={handleRemoveVarianceType}
          />
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="ml-auto text-xs"
      >
        Clear All
      </Button>
    </div>
  );
};
