import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Zap, Info } from 'lucide-react';
import { useSmartNavigation, RelatedReport } from '@/hooks/useSmartNavigation';
import { useCrossReportFilters } from '@/contexts/CrossReportFilterContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RelatedReportsPanelProps {
  currentReport: string;
  currentFilters?: any;
  variant?: 'full' | 'compact';
}

export const RelatedReportsPanel = ({
  currentReport,
  currentFilters,
  variant = 'full'
}: RelatedReportsPanelProps) => {
  const { navigateToReport, getRelatedReports } = useSmartNavigation();
  const { filters } = useCrossReportFilters();
  const relatedReports = getRelatedReports(currentReport);

  if (relatedReports.length === 0) {
    return null;
  }

  const handleNavigate = (report: RelatedReport) => {
    navigateToReport(report.id, currentFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Zap className="h-4 w-4" />
          Quick Jump:
        </span>
        {relatedReports.slice(0, 3).map((report) => (
          <TooltipProvider key={report.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate(report)}
                  className="gap-2"
                >
                  {report.name}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{report.description}</p>
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will carry over current filters
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Related Reports
            </CardTitle>
            <CardDescription>
              Continue your analysis with related data
              {hasActiveFilters && " (filters will be applied)"}
            </CardDescription>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Smart Filters Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedReports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:border-primary transition-all group"
              onClick={() => handleNavigate(report)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {report.name}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
                
                {report.relationReason && (
                  <div className="flex items-start gap-2 p-2 bg-muted rounded-md">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {report.relationReason}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(report);
                  }}
                >
                  View Report
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Smart Filter Transfer</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your current filters will be intelligently applied to the target report, 
                  showing only relevant data for seamless analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
