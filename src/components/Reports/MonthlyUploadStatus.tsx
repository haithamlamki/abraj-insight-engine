import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";
import { getTableName } from "@/lib/supabaseQueries";

interface MonthlyUploadStatusProps {
  reportType: string;
  year?: number;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthlyUploadStatus({ reportType, year = new Date().getFullYear(), className = "" }: MonthlyUploadStatusProps) {
  const tableName = getTableName(reportType);

  const { data: monthStatus, isLoading } = useQuery({
    queryKey: ["monthly-upload-status", reportType, year],
    queryFn: async () => {
      // Fetch data grouped by month
      const { data, error } = await supabase
        .from(tableName as any)
        .select("month, year")
        .eq("year", year);

      if (error) throw error;

      // Create a map of months that have data
      const monthsWithData = new Set<string>();
      data?.forEach((row: any) => {
        if (row.month) {
          monthsWithData.add(row.month.toLowerCase());
        }
      });

      // Map each month to its status
      return MONTHS.map((month, index) => ({
        month,
        abbr: MONTH_ABBR[index],
        hasData: monthsWithData.has(month.toLowerCase())
      }));
    },
    enabled: !!reportType,
  });

  if (isLoading || !monthStatus) {
    return null;
  }

  const uploadedCount = monthStatus.filter(m => m.hasData).length;
  const missingCount = monthStatus.filter(m => !m.hasData).length;

  return (
    <div className={`bg-muted/30 border-t-2 border-primary/20 ${className}`}>
      <div className="flex items-center gap-4 p-3">
        <div className="font-semibold text-sm min-w-[120px]">
          Month to Date
        </div>
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          {monthStatus.map((status) => (
            <div key={status.month} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                {status.abbr}
              </span>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                status.hasData 
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {status.hasData ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <X className="h-4 w-4" strokeWidth={3} />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground min-w-[180px] justify-end">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            {uploadedCount} uploaded
          </span>
          <span className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-600 dark:text-red-400" />
            {missingCount} missing
          </span>
        </div>
      </div>
    </div>
  );
}
