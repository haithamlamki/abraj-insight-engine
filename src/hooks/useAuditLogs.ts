import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  user_id: string | null;
  user_email: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface UseAuditLogsParams {
  tableName?: string;
  action?: string;
  userEmail?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { tableName, action, userEmail, startDate, endDate, limit = 100 } = params;

  return useQuery({
    queryKey: ["audit-logs", tableName, action, userEmail, startDate, endDate, limit],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq("table_name", tableName);
      }

      if (action) {
        query = query.eq("action", action);
      }

      if (userEmail) {
        query = query.ilike("user_email", `%${userEmail}%`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
}
