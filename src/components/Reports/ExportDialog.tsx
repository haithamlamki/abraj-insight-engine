import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileSpreadsheet, FileText, File } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onExport: (selectedColumns: string[], format: 'csv' | 'excel' | 'pdf') => void;
  isExporting?: boolean;
}

export const ExportDialog = ({
  open,
  onOpenChange,
  columns,
  onExport,
  isExporting = false,
}: ExportDialogProps) => {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');

  const toggleColumn = (columnKey: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey);
    } else {
      newSelected.add(columnKey);
    }
    setSelectedColumns(newSelected);
  };

  const selectAll = () => {
    setSelectedColumns(new Set(columns.map(col => col.key)));
  };

  const deselectAll = () => {
    setSelectedColumns(new Set());
  };

  const handleExport = () => {
    if (selectedColumns.size === 0) return;
    onExport(Array.from(selectedColumns), format);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Select columns to export and choose your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileText className="h-4 w-4 text-blue-600" />
                  CSV (.csv)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer font-normal">
                  <File className="h-4 w-4 text-red-600" />
                  PDF (.pdf)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Select Columns ({selectedColumns.size} of {columns.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  type="button"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  type="button"
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`export-${column.key}`}
                      checked={selectedColumns.has(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={`export-${column.key}`}
                      className="cursor-pointer font-normal flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.size === 0 || isExporting}
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>Export {selectedColumns.size} Column{selectedColumns.size !== 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
