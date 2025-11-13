import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DashboardWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetType: "kpi" | "line-chart" | "bar-chart" | "pie-chart" | "table" | "filter";
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  layout: DashboardWidget[];
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useDashboards() {
  return useQuery({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_layouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(d => ({
        ...d,
        layout: d.layout as unknown as DashboardWidget[]
      })) as Dashboard[];
    },
  });
}

export function useDashboard(id: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("dashboard_layouts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return {
        ...data,
        layout: data.layout as unknown as DashboardWidget[]
      } as Dashboard;
    },
    enabled: !!id,
  });
}

export function useSaveDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboard: Partial<Dashboard> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (dashboard.id) {
        const { data, error } = await supabase
          .from("dashboard_layouts")
          .update({
            name: dashboard.name,
            description: dashboard.description,
            layout: dashboard.layout as any,
            is_public: dashboard.is_public,
          })
          .eq("id", dashboard.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("dashboard_layouts")
          .insert({
            user_id: user.id,
            name: dashboard.name || "New Dashboard",
            description: dashboard.description,
            layout: (dashboard.layout || []) as any,
            is_template: false,
            is_public: dashboard.is_public || false,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      toast.success("Dashboard saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save dashboard: ${error.message}`);
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dashboard_layouts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      toast.success("Dashboard deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete dashboard: ${error.message}`);
    },
  });
}

export function useShareDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dashboardId, 
      userEmail, 
      canEdit 
    }: { 
      dashboardId: string; 
      userEmail: string; 
      canEdit: boolean;
    }) => {
      // First, get the user ID from email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (userError) throw new Error("User not found");

      const { error } = await supabase
        .from("dashboard_shares")
        .insert({
          dashboard_id: dashboardId,
          shared_with_user_id: userData.id,
          can_edit: canEdit,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      toast.success("Dashboard shared successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to share dashboard: ${error.message}`);
    },
  });
}
