import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Zap, Filter } from 'lucide-react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import { useCrossReportFilters } from '@/contexts/CrossReportFilterContext';

interface QuickNavigationBarProps {
  currentReport: string;
  currentFilters?: any;
}

export const QuickNavigationBar = ({ currentReport, currentFilters }: QuickNavigationBarProps) => {
  const { navigateToReport, getRelatedReports } = useSmartNavigation();
  const { filters } = useCrossReportFilters();
  const relatedReports = getRelatedReports(currentReport);
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.keys(filters).length;
  const hasFilters = activeFilterCount > 0;

  if (relatedReports.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>Quick Jump:</span>
      </div>

      {/* Show first 3 reports as buttons */}
      <div className="flex items-center gap-2">
        {relatedReports.slice(0, 3).map((report) => (
          <Button
            key={report.id}
            variant="outline"
            size="sm"
            onClick={() => navigateToReport(report.id, currentFilters)}
            className="gap-1"
          >
            {report.name}
          </Button>
        ))}
      </div>

      {/* More dropdown if there are more than 3 reports */}
      {relatedReports.length > 3 && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              More
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>More Related Reports</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {relatedReports.slice(3).map((report) => (
              <DropdownMenuItem
                key={report.id}
                onClick={() => {
                  navigateToReport(report.id, currentFilters);
                  setIsOpen(false);
                }}
                className="cursor-pointer"
              >
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Filter indicator */}
      {hasFilters && (
        <Badge variant="secondary" className="ml-auto gap-1">
          <Filter className="h-3 w-3" />
          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
};
