import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { SmartBudgetSettings } from "@/components/Budget/SmartBudgetSettings";
import { cn } from "@/lib/utils";

interface SmartBudgetButtonProps {
  reportType?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function SmartBudgetButton({ 
  reportType = "all",
  variant = "outline",
  size = "default",
  showLabel = true,
  className
}: SmartBudgetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={cn(className)}
      >
        <Sparkles className="h-4 w-4" />
        {showLabel && <span className="ml-2">Smart Budget</span>}
      </Button>

      <SmartBudgetSettings 
        open={open}
        onOpenChange={setOpen}
        reportType={reportType}
      />
    </>
  );
}
