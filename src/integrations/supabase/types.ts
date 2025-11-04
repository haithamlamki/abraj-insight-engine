export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      billing_npt: {
        Row: {
          action_party: string | null
          billable: boolean | null
          comments: string | null
          contractual_process: string | null
          corrective_action: string | null
          created_at: string | null
          date: string
          department_responsibility: string | null
          equipment_failure: string | null
          failure_investigation_reports: string | null
          future_action: string | null
          id: string
          immediate_cause: string | null
          month: string | null
          notification_number: string | null
          npt_hours: number | null
          npt_type: string | null
          parent_equipment_failure: string | null
          part_equipment_failure: string | null
          rig: string
          root_cause: string | null
          system: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          action_party?: string | null
          billable?: boolean | null
          comments?: string | null
          contractual_process?: string | null
          corrective_action?: string | null
          created_at?: string | null
          date: string
          department_responsibility?: string | null
          equipment_failure?: string | null
          failure_investigation_reports?: string | null
          future_action?: string | null
          id?: string
          immediate_cause?: string | null
          month?: string | null
          notification_number?: string | null
          npt_hours?: number | null
          npt_type?: string | null
          parent_equipment_failure?: string | null
          part_equipment_failure?: string | null
          rig: string
          root_cause?: string | null
          system?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          action_party?: string | null
          billable?: boolean | null
          comments?: string | null
          contractual_process?: string | null
          corrective_action?: string | null
          created_at?: string | null
          date?: string
          department_responsibility?: string | null
          equipment_failure?: string | null
          failure_investigation_reports?: string | null
          future_action?: string | null
          id?: string
          immediate_cause?: string | null
          month?: string | null
          notification_number?: string | null
          npt_hours?: number | null
          npt_type?: string | null
          parent_equipment_failure?: string | null
          part_equipment_failure?: string | null
          rig?: string
          root_cause?: string | null
          system?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      billing_npt_summary: {
        Row: {
          a_maint: number | null
          a_maint_zero: number | null
          created_at: string | null
          id: string
          month: string
          opr_rate: number | null
          reduce_rate: number | null
          repair_rate: number | null
          rig: string
          rig_move: number | null
          rig_move_reduce: number | null
          special_rate: number | null
          total: number | null
          total_npt: number | null
          updated_at: string | null
          year: number
          zero_rate: number | null
        }
        Insert: {
          a_maint?: number | null
          a_maint_zero?: number | null
          created_at?: string | null
          id?: string
          month: string
          opr_rate?: number | null
          reduce_rate?: number | null
          repair_rate?: number | null
          rig: string
          rig_move?: number | null
          rig_move_reduce?: number | null
          special_rate?: number | null
          total?: number | null
          total_npt?: number | null
          updated_at?: string | null
          year: number
          zero_rate?: number | null
        }
        Update: {
          a_maint?: number | null
          a_maint_zero?: number | null
          created_at?: string | null
          id?: string
          month?: string
          opr_rate?: number | null
          reduce_rate?: number | null
          repair_rate?: number | null
          rig?: string
          rig_move?: number | null
          rig_move_reduce?: number | null
          special_rate?: number | null
          total?: number | null
          total_npt?: number | null
          updated_at?: string | null
          year?: number
          zero_rate?: number | null
        }
        Relationships: []
      }
      budget_change_log: {
        Row: {
          budget_id: string | null
          change_type: string
          changed_at: string | null
          changed_by: string
          field_name: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          reason: string | null
          source: string | null
          user_agent: string | null
          version_id: string
        }
        Insert: {
          budget_id?: string | null
          change_type: string
          changed_at?: string | null
          changed_by: string
          field_name?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          source?: string | null
          user_agent?: string | null
          version_id: string
        }
        Update: {
          budget_id?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string
          field_name?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          source?: string | null
          user_agent?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_change_log_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "fact_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_change_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "budget_version"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_version: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          effective_end: string
          effective_start: string
          fiscal_year: number
          frozen_at: string | null
          id: string
          is_baseline: boolean | null
          parent_version_id: string | null
          status: Database["public"]["Enums"]["budget_status"] | null
          updated_at: string | null
          updated_by: string | null
          version_code: string
          version_name: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_end: string
          effective_start: string
          fiscal_year: number
          frozen_at?: string | null
          id?: string
          is_baseline?: boolean | null
          parent_version_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          version_code: string
          version_name: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_end?: string
          effective_start?: string
          fiscal_year?: number
          frozen_at?: string | null
          id?: string
          is_baseline?: boolean | null
          parent_version_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          version_code?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_version_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "budget_version"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_satisfaction: {
        Row: {
          client: string | null
          created_at: string | null
          feedback: string | null
          id: string
          month: string
          rig: string
          satisfaction_score: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          client?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          month: string
          rig: string
          satisfaction_score?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          client?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          month?: string
          rig?: string
          satisfaction_score?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      dim_date: {
        Row: {
          date_id: string
          fiscal_year: number | null
          month: number
          month_end: string
          month_name: string
          month_start: string
          quarter: number
          year: number
        }
        Insert: {
          date_id: string
          fiscal_year?: number | null
          month: number
          month_end: string
          month_name: string
          month_start: string
          quarter: number
          year: number
        }
        Update: {
          date_id?: string
          fiscal_year?: number | null
          month?: number
          month_end?: string
          month_name?: string
          month_start?: string
          quarter?: number
          year?: number
        }
        Relationships: []
      }
      dim_metric: {
        Row: {
          active: boolean | null
          aggregation_type: string | null
          created_at: string | null
          display_name: string
          format: string | null
          id: string
          metric_key: string
          report_id: string | null
          unit: string | null
        }
        Insert: {
          active?: boolean | null
          aggregation_type?: string | null
          created_at?: string | null
          display_name: string
          format?: string | null
          id?: string
          metric_key: string
          report_id?: string | null
          unit?: string | null
        }
        Update: {
          active?: boolean | null
          aggregation_type?: string | null
          created_at?: string | null
          display_name?: string
          format?: string | null
          id?: string
          metric_key?: string
          report_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_metric_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "dim_report"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_report: {
        Row: {
          active: boolean | null
          created_at: string | null
          department: string
          display_name: string
          id: string
          report_key: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department: string
          display_name: string
          id?: string
          report_key: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department?: string
          display_name?: string
          id?: string
          report_key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      dim_rig: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          rig_code: string
          rig_name: string
          rig_type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          rig_code: string
          rig_name: string
          rig_type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          rig_code?: string
          rig_name?: string
          rig_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fact_budget: {
        Row: {
          budget_value: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          metric_id: string
          month: number
          notes: string | null
          report_id: string
          rig_id: string
          updated_at: string | null
          updated_by: string | null
          version_id: string
          year: number
        }
        Insert: {
          budget_value: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          metric_id: string
          month: number
          notes?: string | null
          report_id: string
          rig_id: string
          updated_at?: string | null
          updated_by?: string | null
          version_id: string
          year: number
        }
        Update: {
          budget_value?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          metric_id?: string
          month?: number
          notes?: string | null
          report_id?: string
          rig_id?: string
          updated_at?: string | null
          updated_by?: string | null
          version_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_budget_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "dim_metric"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_budget_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "dim_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_budget_rig_id_fkey"
            columns: ["rig_id"]
            isOneToOne: false
            referencedRelation: "dim_rig"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_budget_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "budget_version"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_consumption: {
        Row: {
          created_at: string | null
          date: string
          fuel_consumed: number | null
          fuel_type: string | null
          id: string
          remarks: string | null
          rig: string
          supplier: string | null
          total_cost: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          fuel_consumed?: number | null
          fuel_type?: string | null
          id?: string
          remarks?: string | null
          rig: string
          supplier?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          fuel_consumed?: number | null
          fuel_type?: string | null
          id?: string
          remarks?: string | null
          rig?: string
          supplier?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue: {
        Row: {
          client: string | null
          comments: string | null
          created_at: string | null
          dayrate_actual: number | null
          dayrate_budget: number | null
          fuel_charge: number | null
          id: string
          month: string
          npt_repair: number | null
          npt_zero: number | null
          revenue_actual: number | null
          revenue_budget: number | null
          rig: string
          updated_at: string | null
          variance: number | null
          working_days: number | null
          year: number
        }
        Insert: {
          client?: string | null
          comments?: string | null
          created_at?: string | null
          dayrate_actual?: number | null
          dayrate_budget?: number | null
          fuel_charge?: number | null
          id?: string
          month: string
          npt_repair?: number | null
          npt_zero?: number | null
          revenue_actual?: number | null
          revenue_budget?: number | null
          rig: string
          updated_at?: string | null
          variance?: number | null
          working_days?: number | null
          year: number
        }
        Update: {
          client?: string | null
          comments?: string | null
          created_at?: string | null
          dayrate_actual?: number | null
          dayrate_budget?: number | null
          fuel_charge?: number | null
          id?: string
          month?: string
          npt_repair?: number | null
          npt_zero?: number | null
          revenue_actual?: number | null
          revenue_budget?: number | null
          rig?: string
          updated_at?: string | null
          variance?: number | null
          working_days?: number | null
          year?: number
        }
        Relationships: []
      }
      rig_moves: {
        Row: {
          actual_cost: number | null
          actual_time_hours: number | null
          budgeted_cost: number | null
          budgeted_time_hours: number | null
          created_at: string | null
          distance_km: number | null
          from_location: string | null
          id: string
          move_date: string
          profit_loss: number | null
          remarks: string | null
          rig: string
          to_location: string | null
          updated_at: string | null
          variance_cost: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_time_hours?: number | null
          budgeted_cost?: number | null
          budgeted_time_hours?: number | null
          created_at?: string | null
          distance_km?: number | null
          from_location?: string | null
          id?: string
          move_date: string
          profit_loss?: number | null
          remarks?: string | null
          rig: string
          to_location?: string | null
          updated_at?: string | null
          variance_cost?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_time_hours?: number | null
          budgeted_cost?: number | null
          budgeted_time_hours?: number | null
          created_at?: string | null
          distance_km?: number | null
          from_location?: string | null
          id?: string
          move_date?: string
          profit_loss?: number | null
          remarks?: string | null
          rig?: string
          to_location?: string | null
          updated_at?: string | null
          variance_cost?: number | null
        }
        Relationships: []
      }
      stock_levels: {
        Row: {
          category: string | null
          created_at: string | null
          current_qty: number | null
          id: string
          item_name: string
          last_reorder_date: string | null
          rig: string
          status: string | null
          target_qty: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_qty?: number | null
          id?: string
          item_name: string
          last_reorder_date?: string | null
          rig: string
          status?: string | null
          target_qty?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_qty?: number | null
          id?: string
          item_name?: string
          last_reorder_date?: string | null
          rig?: string
          status?: string | null
          target_qty?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          scope_rigs: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          scope_rigs?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope_rigs?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      utilization: {
        Row: {
          allowable_npt: number | null
          client: string | null
          comment: string | null
          created_at: string | null
          id: string
          month: string
          monthly_total_days: number | null
          npt_days: number | null
          npt_type: string | null
          operating_days: number | null
          rig: string
          status: string
          updated_at: string | null
          utilization_rate: number | null
          working_days: number | null
          year: number
        }
        Insert: {
          allowable_npt?: number | null
          client?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          month: string
          monthly_total_days?: number | null
          npt_days?: number | null
          npt_type?: string | null
          operating_days?: number | null
          rig: string
          status?: string
          updated_at?: string | null
          utilization_rate?: number | null
          working_days?: number | null
          year: number
        }
        Update: {
          allowable_npt?: number | null
          client?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          month?: string
          monthly_total_days?: number | null
          npt_days?: number | null
          npt_type?: string | null
          operating_days?: number | null
          rig?: string
          status?: string
          updated_at?: string | null
          utilization_rate?: number | null
          working_days?: number | null
          year?: number
        }
        Relationships: []
      }
      well_tracker: {
        Row: {
          actual_depth: number | null
          created_at: string | null
          end_date: string | null
          id: string
          location: string | null
          operator: string | null
          rig: string
          start_date: string
          status: string | null
          target_depth: number | null
          updated_at: string | null
          well_name: string
        }
        Insert: {
          actual_depth?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          operator?: string | null
          rig: string
          start_date: string
          status?: string | null
          target_depth?: number | null
          updated_at?: string | null
          well_name: string
        }
        Update: {
          actual_depth?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          operator?: string | null
          rig?: string
          start_date?: string
          status?: string | null
          target_depth?: number | null
          updated_at?: string | null
          well_name?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          compliance_rate: number | null
          created_at: string | null
          elec_closed: number | null
          elec_open: number | null
          id: string
          mech_closed: number | null
          mech_open: number | null
          month: string
          oper_closed: number | null
          oper_open: number | null
          rig: string
          updated_at: string | null
          year: number
        }
        Insert: {
          compliance_rate?: number | null
          created_at?: string | null
          elec_closed?: number | null
          elec_open?: number | null
          id?: string
          mech_closed?: number | null
          mech_open?: number | null
          month: string
          oper_closed?: number | null
          oper_open?: number | null
          rig: string
          updated_at?: string | null
          year: number
        }
        Update: {
          compliance_rate?: number | null
          created_at?: string | null
          elec_closed?: number | null
          elec_open?: number | null
          id?: string
          mech_closed?: number | null
          mech_open?: number | null
          month?: string
          oper_closed?: number | null
          oper_open?: number | null
          rig?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_rig: {
        Args: { _rig: string; _user_id: string }
        Returns: boolean
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "field_supervisor" | "viewer"
      budget_status: "draft" | "submitted" | "approved" | "locked" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "analyst", "field_supervisor", "viewer"],
      budget_status: ["draft", "submitted", "approved", "locked", "archived"],
    },
  },
} as const
