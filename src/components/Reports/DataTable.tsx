import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { MonthlyUploadStatus } from "./MonthlyUploadStatus";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  title?: string;
  reportType?: string;
}

export const DataTable = ({ columns, data, title, reportType }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const stored = reportType ? localStorage.getItem(`table-year-filter-${reportType}`) : null;
    return stored ? parseInt(stored) : new Date().getFullYear();
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const filteredData = data.filter((row) => {
    // Filter by selected year
    if (selectedYear && row.year) {
      if (row.year !== selectedYear) {
        return false;
      }
    }
    
    // Filter by selected month
    if (selectedMonth && row.month) {
      if (row.month.toLowerCase() !== selectedMonth.toLowerCase()) {
        return false;
      }
    }
    
    // Filter by search term
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        {/* Year Selector and Monthly Upload Status */}
        {reportType && (
          <div className="border-b">
            <div className="flex items-center justify-between p-3 bg-muted/10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => {
                    const year = parseInt(value);
                    setSelectedYear(year);
                    if (reportType) {
                      localStorage.setItem(`table-year-filter-${reportType}`, year.toString());
                    }
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedYear !== new Date().getFullYear() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      setSelectedYear(currentYear);
                      if (reportType) {
                        localStorage.setItem(`table-year-filter-${reportType}`, currentYear.toString());
                      }
                    }}
                  >
                    Reset to {new Date().getFullYear()}
                  </Button>
                )}
              </div>
            </div>
            
            <MonthlyUploadStatus 
              reportType={reportType}
              year={selectedYear}
              onMonthClick={setSelectedMonth}
              selectedMonth={selectedMonth}
            />
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.sortable ? "cursor-pointer select-none hover:bg-muted/50" : ""}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
