import { Badge } from "@/components/ui/badge";
import { Filter, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChartFilterIndicatorProps {
  activeFilterCount: number;
  displayedRecords: number;
  totalRecords?: number;
  filterSummary?: string[];
}

export function ChartFilterIndicator({ 
  activeFilterCount, 
  displayedRecords, 
  totalRecords,
  filterSummary = []
}: ChartFilterIndicatorProps) {
  const isFiltered = activeFilterCount > 0;
  const showTotal = totalRecords !== undefined && totalRecords !== displayedRecords;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isFiltered && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
              </Badge>
            </TooltipTrigger>
            {filterSummary.length > 0 && (
              <TooltipContent>
                <div className="space-y-1">
                  {filterSummary.map((filter, idx) => (
                    <div key={idx}>{filter}</div>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      
      <Badge variant="outline" className="gap-1">
        <Database className="h-3 w-3" />
        {showTotal ? (
          <>
            {displayedRecords.toLocaleString()} of {totalRecords.toLocaleString()} records
          </>
        ) : (
          <>
            {displayedRecords.toLocaleString()} records
          </>
        )}
      </Badge>
    </div>
  );
}
