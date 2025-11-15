import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, KeyboardIcon, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DataEntryOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
}

export const DataEntryOptionsDialog = ({
  isOpen,
  onClose,
  reportType,
}: DataEntryOptionsDialogProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(`hide-data-entry-dialog-${reportType}`, "true");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Data Entry Options</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Choose how you'd like to add data to your reports:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <KeyboardIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold text-sm">Manual Entry</h4>
              <p className="text-sm text-muted-foreground">
                Enter data manually using a form interface. Perfect for single entries or quick updates.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold text-sm">Upload Excel</h4>
              <p className="text-sm text-muted-foreground">
                Import data from Excel files (.xlsx, .xls). Ideal for bulk data imports and large datasets.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> You can download a template from the Upload tab to ensure your data matches the required format.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label
              htmlFor="dont-show"
              className="text-sm font-normal cursor-pointer"
            >
              Don't show this again for {reportType}
            </Label>
          </div>
          <Button onClick={handleClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
