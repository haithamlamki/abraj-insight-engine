import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download, FileSpreadsheet, Loader2, RotateCcw, Columns3, Save, BookmarkPlus, Trash2, Edit2, X, Filter, Maximize2, HelpCircle, Sparkles } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { BulkEditDialog } from "@/components/Admin/BulkEditDialog";
import { useBulkEdit } from "@/hooks/useBulkEdit";
import { supabase } from "@/integrations/supabase/client";
import { AdvancedFilterBuilder, FilterGroup, FilterCondition } from "./AdvancedFilterBuilder";
import { ExportDialog } from "./ExportDialog";
import { DataEntryForm } from "./DataEntryForm";
import { ExcelUploadZone } from "./ExcelUploadZone";
import { DataEntryOptionsDialog } from "./DataEntryOptionsDialog";
import { DataTableTour } from "./DataTableTour";
import { SmartFilterPanel } from "./SmartFilterPanel";
import { NaturalLanguageFilter } from "./NaturalLanguageFilter";
import { useDataTableTour } from "@/hooks/useDataTableTour";
import { MonthlyUploadStatus } from "./MonthlyUploadStatus";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
  advancedFilters?: FilterGroup[];
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
  const { run: tourRun, setRun: setTourRun, resetTour } = useDataTableTour(reportType);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">(() => {
    const stored = localStorage.getItem(`table-density-${reportType}`);
    return (stored as "compact" | "comfortable" | "spacious") || "compact";
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
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterTemplates, setFilterTemplates] = useState<Record<string, FilterGroup[]>>(() => {
    const stored = localStorage.getItem(`filter-templates-${reportType}`);
    return stored ? JSON.parse(stored) : {};
  });
  const [smartFilterLabels, setSmartFilterLabels] = useState<string[]>([]);
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkEditPreview, setBulkEditPreview] = useState<any>(null);
  
  // Data entry options dialog state
  const [showDataEntryDialog, setShowDataEntryDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("view-data");
  const [showNaturalLanguageFilter, setShowNaturalLanguageFilter] = useState(false);
  
  const { preview, execute, isPreviewLoading, isExecuting } = useBulkEdit();
  
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
    toast({
      title: "Columns reset",
      description: "Column widths have been reset to default",
    });
  };

  const autoSizeColumns = () => {
    const newWidths: Record<string, number> = {};
    const sampleSize = Math.min(100, filteredAndSortedData.length); // Sample first 100 rows
    const minWidth = 100;
    const maxWidth = 400;
    const padding = 40; // Extra padding for cell padding and sort icons

    visibleColumnsArray.forEach(column => {
      // Measure header length
      const headerLength = column.label.length * 8 + padding;
      
      // Measure content length from sample
      let maxContentLength = 0;
      for (let i = 0; i < sampleSize; i++) {
        const value = filteredAndSortedData[i]?.[column.key];
        const stringValue = value != null ? String(value) : '';
        const contentLength = stringValue.length * 8; // Approximate 8px per character
        maxContentLength = Math.max(maxContentLength, contentLength);
      }

      // Take the larger of header or content, with min/max constraints
      const optimalWidth = Math.max(
        minWidth,
        Math.min(
          maxWidth,
          Math.max(headerLength, maxContentLength + padding)
        )
      );

      newWidths[column.key] = optimalWidth;
    });

    setColumnWidths(newWidths);
    localStorage.setItem(`table-column-widths-${reportType}`, JSON.stringify(newWidths));
    
    toast({
      title: "Columns auto-sized",
      description: "Column widths optimized based on content",
    });
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedRows.size === filteredAndSortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSortedData.map(row => row.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from(reportType as any)
        .delete()
        .in('id', Array.from(selectedRows));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedRows.size} record(s)`,
      });

      setSelectedRows(new Set());
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkEdit = async () => {
    try {
      const previewData = await preview({
        filter: {
          table: reportType,
        }
      });
      setBulkEditPreview(previewData);
      setBulkEditDialogOpen(true);
    } catch (error) {
      console.error('Bulk edit preview error:', error);
      toast({
        title: "Error",
        description: "Failed to load preview",
        variant: "destructive",
      });
    }
  };

  const handleExecuteBulkEdit = async (operation: any) => {
    try {
      await execute({
        filter: { table: reportType },
        operation,
      });

      setSelectedRows(new Set());
      setBulkEditDialogOpen(false);
    } catch (error) {
      console.error('Bulk edit error:', error);
    }
  };

  // Filter template management
  const saveFilterTemplate = (name: string, filters: FilterGroup[]) => {
    const updated = { ...filterTemplates, [name]: filters };
    setFilterTemplates(updated);
    localStorage.setItem(`filter-templates-${reportType}`, JSON.stringify(updated));
    toast({
      title: "Template saved",
      description: `Filter template "${name}" has been saved.`,
    });
  };

  const loadFilterTemplate = (name: string) => {
    const template = filterTemplates[name];
    if (template) {
      setAdvancedFilters(template);
      toast({
        title: "Template loaded",
        description: `Applied filter template "${name}".`,
      });
    }
  };

  const deleteFilterTemplate = (name: string) => {
    const updated = { ...filterTemplates };
    delete updated[name];
    setFilterTemplates(updated);
    localStorage.setItem(`filter-templates-${reportType}`, JSON.stringify(updated));
    toast({
      title: "Template deleted",
      description: `Filter template "${name}" has been deleted.`,
    });
  };


  const handleSmartFilterApply = (filterConfig: any) => {
    if (filterConfig.type === 'dateRange') {
      setStartDate(filterConfig.startDate);
      setEndDate(filterConfig.endDate);
      setSmartFilterLabels(prev => {
        const newLabels = prev.filter(l => !l.includes('Last') && !l.includes('This') && !l.includes('Year'));
        return [...newLabels, filterConfig.label];
      });
    } else if (filterConfig.type === 'advanced' && filterConfig.conditions) {
      // Convert to advanced filter format
      const newGroup: FilterGroup = {
        id: Date.now().toString(),
        logic: 'AND',
        conditions: filterConfig.conditions.map((cond: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          field: cond.field,
          operator: cond.operator,
          value: cond.value
        }))
      };
      setAdvancedFilters(prev => [...prev, newGroup]);
      setSmartFilterLabels(prev => [...prev, filterConfig.label]);
    }

    toast({
      title: "Smart filter applied",
      description: `${filterConfig.label} has been applied to your data`,
    });
  };

  const handleClearAllFilters = () => {
    setAdvancedFilters([]);
    setSmartFilterLabels([]);
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    toast({
      title: "Filters cleared",
      description: "All filters have been removed",
    });
  };

  const handleNaturalLanguageFilter = (filterConfig: any) => {
    // Apply date range if present
    if (filterConfig.dateRange) {
      setStartDate(new Date(filterConfig.dateRange.start));
      setEndDate(new Date(filterConfig.dateRange.end));
    }

    // Apply conditions if present
    if (filterConfig.conditions && filterConfig.conditions.length > 0) {
      const newGroup: FilterGroup = {
        id: Date.now().toString(),
        logic: 'AND',
        conditions: filterConfig.conditions.map((cond: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          field: cond.field,
          operator: cond.operator,
          value: cond.value
        }))
      };
      setAdvancedFilters(prev => [...prev, newGroup]);
    }

    // Apply sorting if present
    if (filterConfig.sortBy) {
      setSortColumn(filterConfig.sortBy.field);
      setSortDirection(filterConfig.sortBy.direction);
    }

    // Store the summary as a smart filter label
    if (filterConfig.summary) {
      setSmartFilterLabels(prev => [...prev, filterConfig.summary]);
    }
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
      advancedFilters,
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
    setAdvancedFilters(view.advancedFilters || []);
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

  // Function to evaluate a filter condition
  const evaluateCondition = (row: any, condition: FilterCondition): boolean => {
    const value = String(row[condition.field] || '');
    const filterValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return value === filterValue;
      case 'not_equals':
        return value !== filterValue;
      case 'contains':
        return value.toLowerCase().includes(filterValue.toLowerCase());
      case 'not_contains':
        return !value.toLowerCase().includes(filterValue.toLowerCase());
      case 'greater_than':
        return parseFloat(value) > parseFloat(filterValue);
      case 'less_than':
        return parseFloat(value) < parseFloat(filterValue);
      case 'greater_equal':
        return parseFloat(value) >= parseFloat(filterValue);
      case 'less_equal':
        return parseFloat(value) <= parseFloat(filterValue);
      case 'is_empty':
        return !value || value.trim() === '';
      case 'is_not_empty':
        return value && value.trim() !== '';
      default:
        return true;
    }
  };

  // Function to evaluate a filter group
  const evaluateFilterGroup = (row: any, group: FilterGroup): boolean => {
    if (group.conditions.length === 0) return true;

    if (group.logic === 'AND') {
      return group.conditions.every(condition => evaluateCondition(row, condition));
    } else {
      return group.conditions.some(condition => evaluateCondition(row, condition));
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (!rawData) return [];
    
    let processedData = [...rawData];
    
    // Apply formatting if provided
    if (formatRow) {
      processedData = processedData.map(formatRow);
    }

    // Apply advanced filters
    if (advancedFilters.length > 0) {
      processedData = processedData.filter((row) => {
        // All filter groups must pass (AND logic between groups)
        return advancedFilters.every(group => evaluateFilterGroup(row, group));
      });
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
  }, [rawData, searchTerm, sortColumn, sortDirection, formatRow, startDate, endDate, advancedFilters]);

  const handleExport = async (selectedColumnKeys: string[], format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const selectedColumns = columns.filter(col => selectedColumnKeys.includes(col.key));
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportType}_${timestamp}`;

      if (format === 'csv') {
        // CSV Export with proper escaping
        const escapeCSV = (value: any) => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };

        const csv = [
          selectedColumns.map(col => escapeCSV(col.label)).join(","),
          ...filteredAndSortedData.map(row =>
            selectedColumns.map(col => escapeCSV(row[col.key])).join(",")
          )
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Excel Export
        const worksheet = XLSX.utils.json_to_sheet(
          filteredAndSortedData.map(row => {
            const obj: any = {};
            selectedColumns.forEach(col => {
              obj[col.label] = row[col.key];
            });
            return obj;
          })
        );
        
        // Auto-size columns
        const maxWidth = 50;
        const colWidths = selectedColumns.map(col => {
          const headerLength = col.label.length;
          const maxDataLength = Math.max(
            ...filteredAndSortedData.map(row => 
              String(row[col.key] || '').length
            ).slice(0, 100) // Sample first 100 rows for performance
          );
          return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) };
        });
        worksheet['!cols'] = colWidths;
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (format === 'pdf') {
        // PDF Export
        const doc = new jsPDF('l', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(16);
        doc.text(title || reportType, 14, 15);
        
        // Add metadata
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);
        doc.text(`Records: ${filteredAndSortedData.length}`, 14, 27);
        
        // Prepare table data
        const headers = selectedColumns.map(col => col.label);
        const data = filteredAndSortedData.map(row =>
          selectedColumns.map(col => {
            const value = row[col.key];
            if (value === null || value === undefined) return '';
            return String(value);
          })
        );
        
        // Add table using jsPDF autoTable plugin
        (doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 32,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246], // blue-500
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251], // gray-50
          },
          margin: { top: 32 },
        });
        
        doc.save(`${filename}.pdf`);
      }

      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()}`,
      });
      
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
    <>
      <DataTableTour reportType={reportType} run={tourRun} setRun={setTourRun} />
      <TooltipProvider>
        <Card className="w-full">
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
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <BookmarkPlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {currentView ? currentView.name : "Views"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save and manage custom table views with your preferred filters, columns, and sorting</p>
                  </TooltipContent>
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
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
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
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adjust row height and padding for better readability</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
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
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show or hide specific columns to customize your view</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={resetColumnWidths} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all column widths to their default sizes</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                  onClick={autoSizeColumns} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading || !filteredAndSortedData.length}
                >
                  <Maximize2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Auto-size</span>
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Automatically adjust column widths to fit content perfectly</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                  data-tour="export-button"
                  onClick={() => setExportDialogOpen(true)} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoading || !filteredAndSortedData.length}
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export your data to Excel, CSV, or PDF format</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                  onClick={resetTour}
                  variant="outline"
                  size="sm"
                >
                  <HelpCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Tour</span>
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restart the interactive tutorial to learn about table features</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="overflow-x-auto">
            <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs 
          data-tour="data-entry-tabs"
          value={activeTab} 
          onValueChange={(value) => {
            // Check if dialog should be shown for this report type
            const hideDialog = localStorage.getItem(`hide-data-entry-dialog-${reportType}`);
            
            // Show dialog only when switching to manual-entry or upload-excel tabs
            // and only if user hasn't disabled it
            if (!hideDialog && (value === "manual-entry" || value === "upload-excel") && activeTab === "view-data") {
              setShowDataEntryDialog(true);
            }
            setActiveTab(value);
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-0 rounded-none border-b">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="view-data">View Data</TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse, filter, and analyze existing records</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="manual-entry-tab" value="manual-entry">Manual Entry</TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add individual records one at a time using a form</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="upload-tab" value="upload-excel">Upload Excel</TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bulk import data from Excel files or paste from spreadsheets</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

          <TabsContent value="view-data" className="space-y-0 m-0 p-6">
            {/* Natural Language Filter */}
            {showNaturalLanguageFilter && (
              <div className="mb-4">
                <NaturalLanguageFilter
                  reportType={reportType}
                  availableFields={columns.map(c => c.key)}
                  onFilterApply={handleNaturalLanguageFilter}
                  onClose={() => setShowNaturalLanguageFilter(false)}
                />
              </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedRows.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRows.size === filteredAndSortedData.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedRows.size} record(s) selected
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRows(new Set())}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all selected records</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkEdit}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit multiple records at once</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Permanently delete selected records</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  data-tour="search-input"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  disabled={isLoading}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search across all visible columns</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div data-tour="smart-filters">
                  <SmartFilterPanel
                    reportType={reportType}
                    onFilterApply={handleSmartFilterApply}
                    activeFilters={smartFilterLabels.length + advancedFilters.length}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick access to intelligent, context-aware filters for common scenarios</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-tour="filter-button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterDialogOpen(true)}
                  className={advancedFilters.length > 0 ? 'border-primary' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                {advancedFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {advancedFilters.length}
                  </Badge>
                )}
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create complex filters with multiple conditions</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Natural Language Filter Toggle */}
          {!showNaturalLanguageFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNaturalLanguageFilter(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          )}

          {/* Active Filters Display */}
          {(advancedFilters.length > 0 || smartFilterLabels.length > 0) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {smartFilterLabels.map((label, idx) => (
                <Badge key={`smart-${idx}`} variant="default" className="gap-1">
                  {label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => {
                      const newLabels = smartFilterLabels.filter((_, i) => i !== idx);
                      setSmartFilterLabels(newLabels);
                      // If it was a date filter, clear the dates
                      if (label.includes('Last') || label.includes('This') || label.includes('Year')) {
                        setStartDate(null);
                        setEndDate(null);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {advancedFilters.map((group, groupIdx) => (
                <Badge key={group.id} variant="secondary" className="gap-1">
                  Group {groupIdx + 1} ({group.logic})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => {
                      setAdvancedFilters(advancedFilters.filter(g => g.id !== group.id));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner text="Loading data..." />
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No matching records found' : 'No data available yet'}
            </div>
          ) : (
            <div className="w-full border rounded-md" ref={scrollRef}>
              {/* Monthly Upload Status Row */}
              <MonthlyUploadStatus reportType={reportType} />
              
              <table className="w-full border-collapse table-fixed">
                <thead data-tour="table-header" className="sticky top-0 bg-background z-10 border-b">
                  <tr className="bg-muted/50">
                    <th className={`${densityClasses.cell} w-[40px] border-r`}>
                      <Checkbox
                        checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    {visibleColumnsArray.map((column) => (
                      <th
                        key={column.key}
                        className={`${densityClasses.cell} text-left font-medium relative group border-r text-xs`}
                        style={{ 
                          width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : 'auto',
                          minWidth: '80px'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {column.sortable ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleSort(column.key)}
                                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                                >
                                  {column.label}
                                  <ArrowUpDown className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {sortColumn === column.key 
                                    ? `Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`
                                    : 'Click to sort by this column'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
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
                      <td className={`${densityClasses.cell} border-r`}>
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={() => handleSelectRow(row.id)}
                        />
                      </td>
                      {visibleColumnsArray.map((column) => (
                        <td 
                          key={column.key} 
                          className={`${densityClasses.cell} ${densityClasses.row} border-r text-xs`}
                          style={{ 
                            width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : 'auto',
                            minWidth: '80px'
                          }}
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
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedRows.size} record(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </TabsContent>

          <TabsContent value="manual-entry" className="p-6">
            <DataEntryForm
              title={`Add ${title} Record`}
              fields={columns
                .filter(col => col.key !== 'id' && col.key !== 'created_at' && col.key !== 'updated_at')
                .map(col => ({
                  name: col.key,
                  label: col.label,
                  type: col.key.includes('date') ? 'date' : 
                        col.key.includes('qty') || col.key.includes('rate') || col.key.includes('days') || 
                        col.key.includes('hours') || col.key.includes('cost') || col.key.includes('revenue') ? 'number' : 'text',
                  required: false,
                  placeholder: `Enter ${col.label.toLowerCase()}...`
                }))}
              frequency="monthly"
              reportType={reportType}
            />
          </TabsContent>

          <TabsContent value="upload-excel" className="p-6">
            <ExcelUploadZone
              title={`Upload ${title} Data`}
              templateName={reportType}
              reportType={reportType}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs outside tabs */}
        {/* Bulk Edit Dialog */}
        <BulkEditDialog
          open={bulkEditDialogOpen}
          onOpenChange={setBulkEditDialogOpen}
          previewData={bulkEditPreview}
          onExecute={handleExecuteBulkEdit}
          isExecuting={isExecuting}
          tableName={reportType}
        />

        {/* Advanced Filter Builder */}
        <AdvancedFilterBuilder
          open={filterDialogOpen}
          onOpenChange={setFilterDialogOpen}
          columns={columns}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          templates={filterTemplates}
          onSaveTemplate={saveFilterTemplate}
          onLoadTemplate={loadFilterTemplate}
          onDeleteTemplate={deleteFilterTemplate}
        />

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          columns={columns}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Data Entry Options Dialog */}
        <DataEntryOptionsDialog
          isOpen={showDataEntryDialog}
          onClose={() => setShowDataEntryDialog(false)}
          reportType={reportType}
        />
      </CardContent>
    </Card>
      </TooltipProvider>
    </>
  );
};
