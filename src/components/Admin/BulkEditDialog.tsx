import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BulkEditOperation } from "@/hooks/useBulkEdit";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: { totalRecords: number; affectedRecords: any[] } | null;
  onExecute: (operation: BulkEditOperation) => void;
  isExecuting: boolean;
  tableName: string;
}

export const BulkEditDialog = ({
  open,
  onOpenChange,
  previewData,
  onExecute,
  isExecuting,
  tableName,
}: BulkEditDialogProps) => {
  const [field, setField] = useState<string>("");
  const [operation, setOperation] = useState<'replace' | 'find-replace' | 'add' | 'subtract' | 'convert-to-string'>('replace');
  const [newValue, setNewValue] = useState<string>("");
  const [findValue, setFindValue] = useState<string>("");
  const [replaceValue, setReplaceValue] = useState<string>("");
  const [numericValue, setNumericValue] = useState<string>("");

  // Get available fields from the first record
  const availableFields = previewData?.affectedRecords[0]
    ? Object.keys(previewData.affectedRecords[0]).filter(
        (key) => !['id', 'created_at', 'updated_at'].includes(key)
      )
    : [];

  const handleExecute = () => {
    const operationData: BulkEditOperation = {
      field,
      operation,
      newValue: operation === 'replace' ? newValue : undefined,
      findValue: operation === 'find-replace' ? findValue : undefined,
      replaceValue: operation === 'find-replace' ? replaceValue : undefined,
      numericValue: ['add', 'subtract'].includes(operation) ? parseFloat(numericValue) : undefined,
    };

    onExecute(operationData);
  };

  const isValid = field && (
    (operation === 'replace' && newValue) ||
    (operation === 'find-replace' && findValue && replaceValue) ||
    (['add', 'subtract'].includes(operation) && numericValue) ||
    operation === 'convert-to-string'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Edit - {tableName}</DialogTitle>
          <DialogDescription>
            Configure the bulk edit operation for {previewData?.totalRecords || 0} records
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Field Selection */}
          <div className="grid gap-2">
            <Label htmlFor="field">Field to Update</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field to update" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operation Type */}
          <div className="grid gap-2">
            <Label htmlFor="operation">Operation Type</Label>
            <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="replace">Replace Value</SelectItem>
                <SelectItem value="find-replace">Find and Replace (Text)</SelectItem>
                <SelectItem value="add">Add Number</SelectItem>
                <SelectItem value="subtract">Subtract Number</SelectItem>
                <SelectItem value="convert-to-string">Convert to String</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation-specific inputs */}
          {operation === 'replace' && (
            <div className="grid gap-2">
              <Label htmlFor="newValue">New Value</Label>
              <Input
                id="newValue"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter new value"
              />
            </div>
          )}

          {operation === 'find-replace' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="findValue">Find Text</Label>
                <Input
                  id="findValue"
                  value={findValue}
                  onChange={(e) => setFindValue(e.target.value)}
                  placeholder="Text to find"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="replaceValue">Replace With</Label>
                <Input
                  id="replaceValue"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Replacement text"
                />
              </div>
            </>
          )}

          {['add', 'subtract'].includes(operation) && (
            <div className="grid gap-2">
              <Label htmlFor="numericValue">
                Value to {operation === 'add' ? 'Add' : 'Subtract'}
              </Label>
              <Input
                id="numericValue"
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                placeholder="Enter numeric value"
              />
            </div>
          )}

          {operation === 'convert-to-string' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will convert all values in the selected field to strings. Useful for fixing
                numeric rig numbers.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData && previewData.affectedRecords.length > 0 && (
            <div className="grid gap-2">
              <Label>Preview - First 5 Records</Label>
              <ScrollArea className="h-[200px] rounded border p-4">
                <div className="space-y-2">
                  {previewData.affectedRecords.slice(0, 5).map((record, idx) => (
                    <div key={idx} className="border-b pb-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="text-xs">
                          ID: {record.id?.toString().substring(0, 8)}
                        </Badge>
                        {field && (
                          <span className="text-sm text-muted-foreground">
                            {field}: <strong>{String(record[field] || 'null')}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {previewData.affectedRecords.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ...and {previewData.affectedRecords.length - 5} more records
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: This operation cannot be undone. Please review carefully before executing.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={!isValid || isExecuting}>
            {isExecuting ? (
              "Executing..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Execute Bulk Edit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
