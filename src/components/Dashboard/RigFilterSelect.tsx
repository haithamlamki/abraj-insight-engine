import { useState } from "react";
import { Check, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RigFilterSelectProps {
  allRigs: string[];
  selectedRigs: string[];
  onSelectionChange: (rigs: string[]) => void;
}

export function RigFilterSelect({
  allRigs,
  selectedRigs,
  onSelectionChange,
}: RigFilterSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggleRig = (rig: string) => {
    if (selectedRigs.includes(rig)) {
      onSelectionChange(selectedRigs.filter((r) => r !== rig));
    } else {
      onSelectionChange([...selectedRigs, rig]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(allRigs);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const displayCount = selectedRigs.length > 0 ? selectedRigs.length : allRigs.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 h-8">
          <Filter className="h-4 w-4" />
          Rigs ({displayCount})
          {selectedRigs.length > 0 && selectedRigs.length < allRigs.length && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedRigs.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">Select Rigs</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {allRigs.map((rig) => {
              const isSelected = selectedRigs.includes(rig);
              return (
                <div
                  key={rig}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleRig(rig)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleRig(rig)}
                    className="pointer-events-none"
                  />
                  <Label className="flex-1 cursor-pointer font-normal">
                    {rig}
                  </Label>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
