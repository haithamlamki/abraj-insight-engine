import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { BillingNPTFilters } from "@/hooks/useBillingNPTFilters";

interface ActiveFiltersBarProps {
  filters: BillingNPTFilters;
  totalRecords: number;
  filteredRecords: number;
  onRemoveFilter: (filterType: string, value?: string | number) => void;
  onClearAll: () => void;
}

export const ActiveFiltersBar = ({
  filters,
  totalRecords,
  filteredRecords,
  onRemoveFilter,
  onClearAll
}: ActiveFiltersBarProps) => {
  const hasFilters = filters.years.length > 0 || 
                     filters.months.length > 0 || 
                     filters.rigs.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <span className="text-sm text-muted-foreground">
        Showing {filteredRecords} of {totalRecords} records
      </span>

      <div className="flex flex-wrap gap-2 flex-1">
        {filters.years.map(year => (
          <Badge key={`year-${year}`} variant="secondary" className="gap-1">
            Year: {year}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onRemoveFilter('years', year)}
            />
          </Badge>
        ))}

        {filters.months.map(month => (
          <Badge key={`month-${month}`} variant="secondary" className="gap-1">
            {month}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onRemoveFilter('months', month)}
            />
          </Badge>
        ))}

        {filters.rigs.map(rig => (
          <Badge key={`rig-${rig}`} variant="secondary" className="gap-1">
            Rig {rig}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onRemoveFilter('rigs', rig)}
            />
          </Badge>
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear All
      </Button>
    </div>
  );
};
