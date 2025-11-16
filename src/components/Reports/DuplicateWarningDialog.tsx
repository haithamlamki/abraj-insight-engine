import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileX, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DuplicateRecord {
  rig: string;
  year: number;
  month: string;
  count: number;
}

interface DuplicateWarningDialogProps {
  open: boolean;
  duplicates: DuplicateRecord[];
  onSkip: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export function DuplicateWarningDialog({
  open,
  duplicates,
  onSkip,
  onOverwrite,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <DialogTitle>Duplicate Records Found</DialogTitle>
          </div>
          <DialogDescription>
            Found {duplicates.length} record combination(s) that already exist in the database.
            Choose how to proceed with the import.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rig</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((dup, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{dup.rig}</TableCell>
                  <TableCell>{dup.year}</TableCell>
                  <TableCell>{dup.month}</TableCell>
                  <TableCell className="text-right">{dup.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel Import
          </Button>
          <Button variant="secondary" onClick={onSkip} className="gap-2">
            <FileX className="h-4 w-4" />
            Skip Duplicates
          </Button>
          <Button variant="default" onClick={onOverwrite} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Overwrite Existing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
