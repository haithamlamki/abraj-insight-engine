import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { UtilizationFilters } from "@/hooks/useUtilizationFilters";

interface ActiveFiltersBarProps {
  filters: UtilizationFilters;
  onRemoveFilter: (category: keyof UtilizationFilters, value: string) => void;
  onClearAll: () => void;
  totalRecords: number;
  filteredRecords: number;
}

export const ActiveFiltersBar = ({
  filters,
  onRemoveFilter,
  onClearAll,
  totalRecords,
  filteredRecords,
}: ActiveFiltersBarProps) => {
  const hasActiveFilters = 
    filters.years.length > 0 ||
    filters.months.length > 0 ||
    filters.clients.length > 0 ||
    filters.rigs.length > 0 ||
    filters.status.length > 0 ||
    filters.utilizationRange[0] > 0 ||
    filters.utilizationRange[1] < 100;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">
        Active Filters ({filteredRecords} of {totalRecords} records):
      </span>
      
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
      
      {filters.clients.map(client => (
        <Badge key={`client-${client}`} variant="secondary" className="gap-1">
          Client: {client}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('clients', client)}
          />
        </Badge>
      ))}
      
      {filters.rigs.map(rig => (
        <Badge key={`rig-${rig}`} variant="secondary" className="gap-1">
          Rig: {rig}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('rigs', rig)}
          />
        </Badge>
      ))}
      
      {filters.status.map(status => (
        <Badge key={`status-${status}`} variant="secondary" className="gap-1">
          {status}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('status', status)}
          />
        </Badge>
      ))}
      
      {(filters.utilizationRange[0] > 0 || filters.utilizationRange[1] < 100) && (
        <Badge variant="secondary" className="gap-1">
          Utilization: {filters.utilizationRange[0]}-{filters.utilizationRange[1]}%
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('utilizationRange', '')}
          />
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="ml-auto"
      >
        Clear All Filters
      </Button>
    </div>
  );
};
