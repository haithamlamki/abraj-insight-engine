import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationWarning {
  record: any;
  errors: string[];
  index: number;
  severity: 'warning' | 'info';
}

interface ValidationWarningsDialogProps {
  open: boolean;
  warnings: ValidationWarning[];
  onContinue: () => void;
  onCancel: () => void;
  totalRecords: number;
  validRecords: number;
}

export function ValidationWarningsDialog({
  open,
  warnings,
  onContinue,
  onCancel,
  totalRecords,
  validRecords,
}: ValidationWarningsDialogProps) {
  const warningCount = warnings.filter(w => w.severity === 'warning').length;
  const infoCount = warnings.filter(w => w.severity === 'info').length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Data Validation Warnings
          </DialogTitle>
          <DialogDescription>
            Some unusual values were detected in the data. You can continue or cancel to review the data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Data Summary:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Total Records: {totalRecords}</li>
                  <li>• Valid Records: {validRecords}</li>
                  <li className="text-yellow-700 dark:text-yellow-400">
                    • Warnings: {warningCount}
                  </li>
                  {infoCount > 0 && (
                    <li className="text-blue-700 dark:text-blue-400">
                      • Info: {infoCount}
                    </li>
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Warnings Table */}
          <ScrollArea className="h-[300px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-20">Row</TableHead>
                  <TableHead>Warning</TableHead>
                  <TableHead className="w-32">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map((warning, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {warning.severity === 'warning' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400">
                          <Info className="h-3 w-3" />
                          Info
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {warning.index}
                    </TableCell>
                    <TableCell className="text-sm">
                      {warning.errors.map((err, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                          {err}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {warning.record?.rig || warning.record?.rig_number || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Additional Info */}
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <p className="font-medium mb-1">Do you want to continue?</p>
              <p className="text-sm">
                You can continue to save the data as is, or cancel to review the file and correct unusual values.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel & Review
          </Button>
          <Button
            onClick={onContinue}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
          >
            Continue & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
