import { useState } from "react";
import { toast } from "sonner";
import { populate2025Budget } from "@/lib/populate2025Budget";

export function useBudgetPopulation() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handlePopulate = async (fuelFile: File, materialFile: File, repairFile: File) => {
    setIsPopulating(true);
    
    try {
      toast.info("Starting 2025 budget population...");
      
      const result = await populate2025Budget(fuelFile, materialFile, repairFile);

      if (result.success) {
        toast.success(`Budget populated successfully! ${result.recordsInserted} records created.`);
        setUploadDialogOpen(false);
        return true;
      } else {
        throw new Error(result.error || 'Failed to populate budget');
      }
    } catch (error: any) {
      console.error('Error populating budget:', error);
      toast.error(`Failed to populate budget: ${error.message}`);
      return false;
    } finally {
      setIsPopulating(false);
    }
  };

  return {
    isPopulating,
    uploadDialogOpen,
    setUploadDialogOpen,
    handlePopulate,
  };
}
