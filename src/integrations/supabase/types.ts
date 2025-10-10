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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
