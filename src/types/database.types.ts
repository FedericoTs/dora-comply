export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          created_at: string | null
          critical_functions: string[] | null
          deleted_at: string | null
          direct_parent_country: string | null
          direct_parent_lei: string | null
          direct_parent_name: string | null
          entity_creation_date: string | null
          entity_status: string | null
          esa_register_id: string | null
          expense_currency: string | null
          gleif_data: Json | null
          gleif_fetched_at: string | null
          headquarters_address: Json | null
          headquarters_country: string | null
          id: string
          is_intra_group: boolean | null
          jurisdiction: string | null
          last_assessment_date: string | null
          legal_address: Json | null
          legal_form_code: string | null
          lei: string | null
          lei_next_renewal: string | null
          lei_status: string | null
          lei_verified_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          organization_id: string
          parent_exception_reason: string | null
          parent_provider_id: string | null
          primary_contact: Json | null
          provider_type: string | null
          registration_authority_id: string | null
          registration_number: string | null
          regulatory_authorizations: string[] | null
          risk_score: number | null
          service_types: string[] | null
          status: string
          substitutability_assessment: string | null
          supports_critical_function: boolean | null
          tier: string
          total_annual_expense: number | null
          ultimate_parent_country: string | null
          ultimate_parent_lei: string | null
          ultimate_parent_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          critical_functions?: string[] | null
          deleted_at?: string | null
          direct_parent_country?: string | null
          direct_parent_lei?: string | null
          direct_parent_name?: string | null
          entity_creation_date?: string | null
          entity_status?: string | null
          esa_register_id?: string | null
          expense_currency?: string | null
          gleif_data?: Json | null
          gleif_fetched_at?: string | null
          headquarters_address?: Json | null
          headquarters_country?: string | null
          id?: string
          is_intra_group?: boolean | null
          jurisdiction?: string | null
          last_assessment_date?: string | null
          legal_address?: Json | null
          legal_form_code?: string | null
          lei?: string | null
          lei_next_renewal?: string | null
          lei_status?: string | null
          lei_verified_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          organization_id: string
          parent_exception_reason?: string | null
          parent_provider_id?: string | null
          primary_contact?: Json | null
          provider_type?: string | null
          registration_authority_id?: string | null
          registration_number?: string | null
          regulatory_authorizations?: string[] | null
          risk_score?: number | null
          service_types?: string[] | null
          status?: string
          substitutability_assessment?: string | null
          supports_critical_function?: boolean | null
          tier?: string
          total_annual_expense?: number | null
          ultimate_parent_country?: string | null
          ultimate_parent_lei?: string | null
          ultimate_parent_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          critical_functions?: string[] | null
          deleted_at?: string | null
          direct_parent_country?: string | null
          direct_parent_lei?: string | null
          direct_parent_name?: string | null
          entity_creation_date?: string | null
          entity_status?: string | null
          esa_register_id?: string | null
          expense_currency?: string | null
          gleif_data?: Json | null
          gleif_fetched_at?: string | null
          headquarters_address?: Json | null
          headquarters_country?: string | null
          id?: string
          is_intra_group?: boolean | null
          jurisdiction?: string | null
          last_assessment_date?: string | null
          legal_address?: Json | null
          legal_form_code?: string | null
          lei?: string | null
          lei_next_renewal?: string | null
          lei_status?: string | null
          lei_verified_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string
          parent_exception_reason?: string | null
          parent_provider_id?: string | null
          primary_contact?: Json | null
          provider_type?: string | null
          registration_authority_id?: string | null
          registration_number?: string | null
          regulatory_authorizations?: string[] | null
          risk_score?: number | null
          service_types?: string[] | null
          status?: string
          substitutability_assessment?: string | null
          supports_critical_function?: boolean | null
          tier?: string
          total_annual_expense?: number | null
          ultimate_parent_country?: string | null
          ultimate_parent_lei?: string | null
          ultimate_parent_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_parent_provider_id_fkey"
            columns: ["parent_provider_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      // Other tables omitted for brevity - this file primarily used for vendor types
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
