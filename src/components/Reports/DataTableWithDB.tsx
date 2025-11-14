import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download, FileSpreadsheet, Loader2, RotateCcw, Columns3, Save, BookmarkPlus, Trash2 } from "lucide-react";
import { useInfiniteReportData } from "@/hooks/useInfiniteReportData";
import { DateRangeFilter } from "./DateRangeFilter";
import { LoadingSpinner } from "./LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  defaultWidth?: number;
}

interface SavedView {
  id: string;
  name: string;
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  density: "compact" | "comfortable" | "spacious";
  startDate: string | null;
  endDate: string | null;
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
  const { toast } = useToast();
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
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(`table-visible-columns-${reportType}`);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set(columns.map(col => col.key));
      }
    }
    return new Set(columns.map(col => col.key));
  });
  
  // Saved views state
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const stored = localStorage.getItem(`table-saved-views-${reportType}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  
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

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        // Don't allow hiding the last visible column
        if (newSet.size === 1) return prev;
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      localStorage.setItem(`table-visible-columns-${reportType}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const visibleColumnsArray = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  const saveCurrentView = () => {
    if (!viewName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the view",
        variant: "destructive",
      });
      return;
    }

    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName.trim(),
      visibleColumns: [...visibleColumns],
      columnWidths,
      sortColumn,
      sortDirection,
      density,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem(`table-saved-views-${reportType}`, JSON.stringify(updatedViews));
    setCurrentViewId(newView.id);
    setSaveDialogOpen(false);
    setViewName("");
    
    toast({
      title: "View saved",
      description: `"${newView.name}" has been saved successfully`,
    });
  };

  const loadView = (view: SavedView) => {
    setVisibleColumns(new Set(view.visibleColumns));
    setColumnWidths(view.columnWidths);
    setSortColumn(view.sortColumn);
    setSortDirection(view.sortDirection);
    setDensity(view.density);
    setStartDate(view.startDate ? new Date(view.startDate) : null);
    setEndDate(view.endDate ? new Date(view.endDate) : null);
    setCurrentViewId(view.id);
    
    // Update localStorage for individual settings
    localStorage.setItem(`table-visible-columns-${reportType}`, JSON.stringify(view.visibleColumns));
    localStorage.setItem(`table-column-widths-${reportType}`, JSON.stringify(view.columnWidths));
    localStorage.setItem(`table-density-${reportType}`, view.density);
    
    toast({
      title: "View loaded",
      description: `"${view.name}" has been applied`,
    });
  };

  const deleteView = (viewId: string) => {
    const viewToDelete = savedViews.find(v => v.id === viewId);
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem(`table-saved-views-${reportType}`, JSON.stringify(updatedViews));
    
    if (currentViewId === viewId) {
      setCurrentViewId(null);
    }
    
    toast({
      title: "View deleted",
      description: `"${viewToDelete?.name}" has been deleted`,
    });
  };

  const currentView = savedViews.find(v => v.id === currentViewId);

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
      visibleColumnsArray.map(col => col.label).join(","),
      ...filteredAndSortedData.map(row =>
        visibleColumnsArray.map(col => row[col.key]).join(",")
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
        visibleColumnsArray.forEach(col => {
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {currentView ? currentView.name : "Views"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Current View
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save View</DialogTitle>
                        <DialogDescription>
                          Save your current column configuration, filters, and preferences
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="view-name">View Name</Label>
                        <Input
                          id="view-name"
                          value={viewName}
                          onChange={(e) => setViewName(e.target.value)}
                          placeholder="e.g., Monthly Analysis"
                          className="mt-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveCurrentView();
                            }
                          }}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveCurrentView}>Save View</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {savedViews.length > 0 && <DropdownMenuSeparator />}
                  {savedViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      className="flex items-center justify-between"
                      onSelect={() => loadView(view)}
                    >
                      <span className={currentViewId === view.id ? "font-medium" : ""}>
                        {view.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteView(view.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" title="Toggle columns">
                    <Columns3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-4" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Toggle Columns</h4>
                    <div className="space-y-2">
                      {columns.map((column) => (
                        <div key={column.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-${column.key}`}
                            checked={visibleColumns.has(column.key)}
                            onCheckedChange={() => toggleColumnVisibility(column.key)}
                            disabled={visibleColumns.size === 1 && visibleColumns.has(column.key)}
                          />
                          <Label
                            htmlFor={`col-${column.key}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {column.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                    {visibleColumnsArray.map((column) => (
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
                      {visibleColumnsArray.map((column) => (
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
