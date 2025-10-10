import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useState, useEffect } from "react";

interface UtilizationFiltersProps {
  data: any[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  year: string;
  month: string;
  rig: string;
  nptType: string;
}

export const UtilizationFilters = ({ data, onFilterChange }: UtilizationFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
  });

  // Extract unique values from data
  const years = Array.from(new Set(data.map(d => d.year?.toString()).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const rigs = Array.from(new Set(data.map(d => d.rig).filter(Boolean))).sort();
  const nptTypes = Array.from(new Set(data.map(d => d.npt_type).filter(Boolean))).sort();

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      year: "all",
      month: "all",
      rig: "all",
      nptType: "all",
    };
    setFilters(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== "all").length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={filters.month} onValueChange={(value) => handleFilterChange("month", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rig</label>
              <Select value={filters.rig} onValueChange={(value) => handleFilterChange("rig", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rigs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rigs</SelectItem>
                  {rigs.map(rig => (
                    <SelectItem key={rig} value={rig}>{rig}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">NPT Type</label>
              <Select value={filters.nptType} onValueChange={(value) => handleFilterChange("nptType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {nptTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
