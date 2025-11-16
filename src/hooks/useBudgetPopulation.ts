import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBudgetPopulation() {
  const [isPopulating, setIsPopulating] = useState(false);

  const populate2025Budget = async () => {
    setIsPopulating(true);
    
    try {
      toast.info("Starting 2025 budget population...");
      
      const { data, error } = await supabase.functions.invoke('populate-2025-budget');

      if (error) throw error;

      if (data.success) {
        toast.success(`Budget populated successfully! ${data.recordsInserted} records created.`);
        return true;
      } else {
        throw new Error(data.error || 'Failed to populate budget');
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
    populate2025Budget,
  };
}
