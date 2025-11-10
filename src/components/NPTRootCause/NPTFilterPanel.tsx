import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { NPTFilters } from "@/hooks/useNPTFilters";

interface NPTFilterPanelProps {
  filters: NPTFilters;
  availableOptions: {
    years: number[];
    months: string[];
    rigs: string[];
    nptTypes: string[];
    systems: string[];
    departments: string[];
    rootCauses: string[];
  };
  onFiltersChange: (updates: Partial<NPTFilters>) => void;
  onClearFilters: () => void;
}

export function NPTFilterPanel({
  filters,
  availableOptions,
  onFiltersChange,
  onClearFilters
}: NPTFilterPanelProps) {
  const toggleArrayFilter = (key: keyof NPTFilters, value: any) => {
    const currentArray = filters[key] as any[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v: any) => v !== value)
      : [...currentArray, value];
    onFiltersChange({ [key]: newArray });
  };

  const durationBuckets = ['<2h', '2-6h', '6-12h', '>12h'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Smart Filters</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
        <CardDescription>Click to cross-filter the dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Years</Label>
          <div className="flex flex-wrap gap-2">
            {availableOptions.years.map(year => (
              <Badge
                key={year}
                variant={filters.years.includes(year) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('years', year)}
              >
                {year}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Months</Label>
          <div className="flex flex-wrap gap-2">
            {availableOptions.months.map(month => (
              <Badge
                key={month}
                variant={filters.months.includes(month) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('months', month)}
              >
                {month}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Rigs</Label>
          <div className="flex flex-wrap gap-2">
            {availableOptions.rigs.map(rig => (
              <Badge
                key={rig}
                variant={filters.rigs.includes(rig) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('rigs', rig)}
              >
                {rig}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">NPT Types</Label>
          <div className="flex flex-wrap gap-2">
            {availableOptions.nptTypes.map(type => (
              <Badge
                key={type}
                variant={filters.nptTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('nptTypes', type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Systems</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableOptions.systems.map(system => (
              <Badge
                key={system}
                variant={filters.systems.includes(system) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('systems', system)}
              >
                {system}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Duration</Label>
          <div className="flex flex-wrap gap-2">
            {durationBuckets.map(bucket => (
              <Badge
                key={bucket}
                variant={filters.durationBucket === bucket ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onFiltersChange({ 
                  durationBucket: filters.durationBucket === bucket ? null : bucket 
                })}
              >
                {bucket}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
