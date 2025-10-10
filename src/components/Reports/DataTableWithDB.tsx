import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download, FileSpreadsheet } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { DateRangeFilter } from "./DateRangeFilter";
import { LoadingSpinner } from "./LoadingSpinner";
import * as XLSX from "xlsx";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableWithDBProps {
  columns: Column[];
  reportType: string;
  title?: string;
  formatRow?: (row: any) => any;
}

export const DataTableWithDB = ({ 
  columns, 
  reportType, 
  title = "Recent Entries",
  formatRow 
}: DataTableWithDBProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const { data: rawData, isLoading, error } = useReportData(reportType);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (!rawData) return [];
    
    let processedData = [...rawData];
    
    // Apply formatting if provided
    if (formatRow) {
      processedData = processedData.map(formatRow);
    }

    // Filter by date range
    if (startDate || endDate) {
      processedData = processedData.filter((row) => {
        const rowDate = new Date(row.date || row.move_date || row.start_date || row.created_at);
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      processedData = processedData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortColumn) {
      processedData.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return processedData;
  }, [rawData, searchTerm, sortColumn, sortDirection, formatRow, startDate, endDate]);

  const handleExportCSV = () => {
    const csv = [
      columns.map(col => col.label).join(","),
      ...filteredAndSortedData.map(row =>
        columns.map(col => row[col.key]).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredAndSortedData.map(row => {
        const obj: any = {};
        columns.forEach(col => {
          obj[col.label] = row[col.key];
        });
        return obj;
      })
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${filteredAndSortedData.length} entries`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={isLoading || !filteredAndSortedData.length}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button onClick={handleExportExcel} variant="outline" size="sm" disabled={isLoading || !filteredAndSortedData.length}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Excel</span>
                <span className="sm:hidden">XLS</span>
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <LoadingSpinner text="Loading data..." />
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No matching records found' : 'No data available yet'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="p-3 text-left font-medium text-sm"
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            {column.label}
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((row, index) => (
                    <tr key={row.id || index} className="border-b hover:bg-muted/50 transition-colors">
                      {columns.map((column) => (
                        <td key={column.key} className="p-3 text-sm">
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
