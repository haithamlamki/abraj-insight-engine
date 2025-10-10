import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download, Loader2 } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";

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
  
  const { data: rawData, isLoading, error } = useReportData(reportType);

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

    // Filter
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
  }, [rawData, searchTerm, sortColumn, sortDirection, formatRow]);

  const handleExport = () => {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${filteredAndSortedData.length} entries`}
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" disabled={isLoading || !filteredAndSortedData.length}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No matching records found' : 'No data available yet'}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="p-3 text-left font-medium"
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className="flex items-center gap-2 hover:text-foreground"
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
                    <tr key={row.id || index} className="border-b hover:bg-muted/50">
                      {columns.map((column) => (
                        <td key={column.key} className="p-3">
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
