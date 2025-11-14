import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download, FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";
import { useInfiniteReportData } from "@/hooks/useInfiniteReportData";
import { DateRangeFilter } from "./DateRangeFilter";
import { LoadingSpinner } from "./LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  defaultWidth?: number;
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
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">(() => {
    const stored = localStorage.getItem(`table-density-${reportType}`);
    return (stored as "compact" | "comfortable" | "spacious") || "comfortable";
  });
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem(`table-column-widths-${reportType}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const { 
    data, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteReportData(reportType);
  
  const rawData = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    const currentWidth = columnWidths[columnKey] || columns.find(c => c.key === columnKey)?.defaultWidth || 150;
    setResizing({ key: columnKey, startX: e.clientX, startWidth: currentWidth });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizing.key]: newWidth };
        localStorage.setItem(`table-column-widths-${reportType}`, JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, reportType]);

  const resetColumnWidths = () => {
    setColumnWidths({});
    localStorage.removeItem(`table-column-widths-${reportType}`);
  };

  const handleDensityChange = (newDensity: "compact" | "comfortable" | "spacious") => {
    setDensity(newDensity);
    localStorage.setItem(`table-density-${reportType}`, newDensity);
  };

  const getDensityClasses = () => {
    switch (density) {
      case "compact":
        return { row: "text-xs", cell: "p-2" };
      case "comfortable":
        return { row: "text-sm", cell: "p-3" };
      case "spacious":
        return { row: "text-base", cell: "p-4" };
    }
  };

  const densityClasses = getDensityClasses();

  const getColumnWidth = (column: Column) => {
    return columnWidths[column.key] || column.defaultWidth || 150;
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
              <Select value={density} onValueChange={handleDensityChange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={resetColumnWidths} variant="outline" size="sm" title="Reset column widths">
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reset Columns</span>
              </Button>
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
            <ScrollArea className="h-[600px] rounded-md border" ref={scrollRef}>
              <table className="w-full min-w-[600px]" style={{ tableLayout: 'fixed' }}>
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b bg-muted/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`${densityClasses.cell} text-left font-medium relative group`}
                        style={{ width: `${getColumnWidth(column)}px` }}
                      >
                        <div className="flex items-center justify-between">
                          {column.sortable ? (
                            <button
                              onClick={() => handleSort(column.key)}
                              className="flex items-center gap-2 hover:text-foreground transition-colors"
                            >
                              {column.label}
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          ) : (
                            <span>{column.label}</span>
                          )}
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => handleResizeStart(e, column.key)}
                          style={{
                            backgroundColor: resizing?.key === column.key ? 'hsl(var(--primary))' : undefined,
                            opacity: resizing?.key === column.key ? 1 : undefined,
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((row, index) => (
                    <tr key={row.id || index} className="border-b hover:bg-muted/50 transition-colors">
                      {columns.map((column) => (
                        <td 
                          key={column.key} 
                          className={`${densityClasses.cell} ${densityClasses.row} overflow-hidden text-ellipsis`}
                          style={{ width: `${getColumnWidth(column)}px` }}
                        >
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={String(row[column.key] || '')}>
                            {row[column.key]}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Infinite scroll trigger */}
              <div ref={observerTarget} className="h-4" />
              
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
