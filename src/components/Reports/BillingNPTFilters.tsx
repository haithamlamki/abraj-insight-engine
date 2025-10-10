import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Filter, X, Search } from "lucide-react";
import { useState, useEffect } from "react";

interface BillingNPTFiltersProps {
  data: any[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  year: string;
  month: string;
  rig: string;
  nptType: string;
  system: string;
  billable: string;
  searchTerm: string;
}

export const BillingNPTFilters = ({ data, onFilterChange }: BillingNPTFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
    system: "all",
    billable: "all",
    searchTerm: "",
  });

  // Extract unique values from data
  const years = Array.from(new Set(data.map(d => d.year?.toString()).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rigs = Array.from(new Set(data.map(d => d.rig).filter(Boolean))).sort();
  const nptTypes = Array.from(new Set(data.map(d => d.npt_type).filter(Boolean))).sort();
  const systems = Array.from(new Set(data.map(d => d.system).filter(Boolean))).sort();

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
      system: "all",
      billable: "all",
      searchTerm: "",
    };
    setFilters(clearedFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'searchTerm' && value !== "all"
  ).length + (filters.searchTerm ? 1 : 0);

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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by system, equipment, root cause..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {months.map((month, index) => (
                    <SelectItem key={month} value={month}>
                      {monthNames[index]} ({month})
                    </SelectItem>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">System</label>
              <Select value={filters.system} onValueChange={(value) => handleFilterChange("system", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Systems</SelectItem>
                  {systems.map(system => (
                    <SelectItem key={system} value={system}>{system}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Billable Status</label>
              <Select value={filters.billable} onValueChange={(value) => handleFilterChange("billable", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Billable</SelectItem>
                  <SelectItem value="false">Non-Billable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
