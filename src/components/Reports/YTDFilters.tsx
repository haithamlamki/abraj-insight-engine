import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";

export interface YTDFilterState {
  year: string;
  month: string;
  rig: string;
  nptType: string;
}

interface YTDFiltersProps {
  data: any[];
  onFilterChange: (filters: YTDFilterState) => void;
}

export const YTDFilters = ({ data, onFilterChange }: YTDFiltersProps) => {
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map(item => item.year?.toString()).filter(Boolean))];
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [data]);

  const months = useMemo(() => {
    return [...new Set(data.map(item => item.month).filter(Boolean))];
  }, [data]);

  const rigs = useMemo(() => {
    return [...new Set(data.map(item => item.rig).filter(Boolean))].sort();
  }, [data]);

  const nptTypes = useMemo(() => {
    return [...new Set(data.map(item => item.billable !== null ? (item.billable ? 'Billable' : 'Non-Billable') : null).filter(Boolean))];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select
              defaultValue="all"
              onValueChange={(value) => onFilterChange({ year: value, month: "all", rig: "all", nptType: "all" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select
              defaultValue="all"
              onValueChange={(value) => onFilterChange({ year: "all", month: value, rig: "all", nptType: "all" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rig</label>
            <Select
              defaultValue="all"
              onValueChange={(value) => onFilterChange({ year: "all", month: "all", rig: value, nptType: "all" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Rigs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rigs</SelectItem>
                {rigs.map((rig) => (
                  <SelectItem key={rig} value={rig}>{rig}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">NPT Type</label>
            <Select
              defaultValue="all"
              onValueChange={(value) => onFilterChange({ year: "all", month: "all", rig: "all", nptType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {nptTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
