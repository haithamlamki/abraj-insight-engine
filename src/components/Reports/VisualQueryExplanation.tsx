import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter, ArrowUpDown, Hash, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterConfig {
  dateRange?: { start: string; end: string };
  conditions?: Array<{ field: string; operator: string; value: any }>;
  sortBy?: { field: string; direction: string };
  limit?: number;
  summary?: string;
}

interface VisualQueryExplanationProps {
  filterConfig: FilterConfig;
  onClear: () => void;
}

export const VisualQueryExplanation = ({ filterConfig, onClear }: VisualQueryExplanationProps) => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Active Filter Breakdown</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filterConfig.dateRange && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-muted-foreground">Date Range</div>
              <div className="text-sm">
                {filterConfig.dateRange.start} to {filterConfig.dateRange.end}
              </div>
            </div>
          </div>
        )}

        {filterConfig.conditions && filterConfig.conditions.length > 0 && (
          <div className="flex items-start gap-2">
            <Filter className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs font-medium text-muted-foreground mb-1">Conditions</div>
              <div className="flex flex-wrap gap-1">
                {filterConfig.conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition.field} {condition.operator} {condition.value}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {filterConfig.sortBy && (
          <div className="flex items-start gap-2">
            <ArrowUpDown className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-muted-foreground">Sort Order</div>
              <div className="text-sm">
                {filterConfig.sortBy.field} ({filterConfig.sortBy.direction})
              </div>
            </div>
          </div>
        )}

        {filterConfig.limit && (
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-muted-foreground">Limit</div>
              <div className="text-sm">{filterConfig.limit} results</div>
            </div>
          </div>
        )}

        {filterConfig.summary && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground italic">
              "{filterConfig.summary}"
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
