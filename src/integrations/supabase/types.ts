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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          campaign: string | null
          created_at: string
          deal_id: string | null
          event_name: string
          event_params: Json
          id: string
          pipeline_id: string | null
          source: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          deal_id?: string | null
          event_name: string
          event_params?: Json
          id?: string
          pipeline_id?: string | null
          source?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          deal_id?: string | null
          event_name?: string
          event_params?: Json
          id?: string
          pipeline_id?: string | null
          source?: string | null
        }
        Relationships: []
      }
      analytics_settings: {
        Row: {
          created_at: string
          ga4_measurement_id: string | null
          goals_configured: boolean
          id: string
          tracking_enabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ga4_measurement_id?: string | null
          goals_configured?: boolean
          id?: string
          tracking_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ga4_measurement_id?: string | null
          goals_configured?: boolean
          id?: string
          tracking_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      facebook_form_mappings: {
        Row: {
          auto_tags: string[] | null
          created_at: string
          default_temperature: string | null
          form_id: string
          form_name: string
          id: string
          integration_id: string
          is_active: boolean
          page_id: string
          page_name: string
          phase_id: string | null
          pipeline_id: string
          updated_at: string
        }
        Insert: {
          auto_tags?: string[] | null
          created_at?: string
          default_temperature?: string | null
          form_id: string
          form_name: string
          id?: string
          integration_id: string
          is_active?: boolean
          page_id: string
          page_name: string
          phase_id?: string | null
          pipeline_id: string
          updated_at?: string
        }
        Update: {
          auto_tags?: string[] | null
          created_at?: string
          default_temperature?: string | null
          form_id?: string
          form_name?: string
          id?: string
          integration_id?: string
          is_active?: boolean
          page_id?: string
          page_name?: string
          phase_id?: string | null
          pipeline_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_form_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "facebook_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_integrations: {
        Row: {
          access_token: string
          connected_at: string
          expires_at: string | null
          id: string
          owner_id: string | null
          pages: Json | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          user_id: string
          user_name: string
          user_picture: string | null
        }
        Insert: {
          access_token: string
          connected_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string | null
          pages?: Json | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id: string
          user_name: string
          user_picture?: string | null
        }
        Update: {
          access_token?: string
          connected_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string | null
          pages?: Json | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id?: string
          user_name?: string
          user_picture?: string | null
        }
        Relationships: []
      }
      facebook_sync_logs: {
        Row: {
          completed_at: string | null
          errors: Json | null
          form_mapping_id: string | null
          id: string
          integration_id: string
          leads_duplicates: number
          leads_imported: number
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          form_mapping_id?: string | null
          id?: string
          integration_id: string
          leads_duplicates?: number
          leads_imported?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          form_mapping_id?: string | null
          id?: string
          integration_id?: string
          leads_duplicates?: number
          leads_imported?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_sync_logs_form_mapping_id_fkey"
            columns: ["form_mapping_id"]
            isOneToOne: false
            referencedRelation: "facebook_form_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "facebook_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_metrics: {
        Row: {
          avg_cpc_micros: number | null
          campaign_id: string | null
          clicks: number | null
          conversion_value: number | null
          conversions: number | null
          cost_micros: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          integration_id: string
        }
        Insert: {
          avg_cpc_micros?: number | null
          campaign_id?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost_micros?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          integration_id: string
        }
        Update: {
          avg_cpc_micros?: number | null
          campaign_id?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost_micros?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_campaign_mappings: {
        Row: {
          auto_tags: string[] | null
          campaign_id: string
          campaign_name: string
          created_at: string
          default_temperature: string | null
          id: string
          integration_id: string
          is_active: boolean
          phase_id: string | null
          pipeline_id: string
          updated_at: string
        }
        Insert: {
          auto_tags?: string[] | null
          campaign_id: string
          campaign_name: string
          created_at?: string
          default_temperature?: string | null
          id?: string
          integration_id: string
          is_active?: boolean
          phase_id?: string | null
          pipeline_id: string
          updated_at?: string
        }
        Update: {
          auto_tags?: string[] | null
          campaign_id?: string
          campaign_name?: string
          created_at?: string
          default_temperature?: string | null
          id?: string
          integration_id?: string
          is_active?: boolean
          phase_id?: string | null
          pipeline_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_campaign_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_integrations: {
        Row: {
          access_token: string
          ads_accounts: Json | null
          connected_at: string
          id: string
          refresh_token: string
          selected_account_id: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string | null
          user_picture: string | null
        }
        Insert: {
          access_token: string
          ads_accounts?: Json | null
          connected_at?: string
          id?: string
          refresh_token: string
          selected_account_id?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name?: string | null
          user_picture?: string | null
        }
        Update: {
          access_token?: string
          ads_accounts?: Json | null
          connected_at?: string
          id?: string
          refresh_token?: string
          selected_account_id?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          user_picture?: string | null
        }
        Relationships: []
      }
      google_offline_conversions: {
        Row: {
          conversion_name: string
          conversion_time: string
          conversion_value: number
          created_at: string
          deal_id: string
          gclid: string
          google_response: Json | null
          id: string
          integration_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          conversion_name?: string
          conversion_time: string
          conversion_value: number
          created_at?: string
          deal_id: string
          gclid: string
          google_response?: Json | null
          id?: string
          integration_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          conversion_name?: string
          conversion_time?: string
          conversion_value?: number
          created_at?: string
          deal_id?: string
          gclid?: string
          google_response?: Json | null
          id?: string
          integration_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_offline_conversions_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sync_logs: {
        Row: {
          completed_at: string | null
          errors: Json | null
          id: string
          integration_id: string
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          integration_id: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          integration_id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_webhook_logs: {
        Row: {
          created_at: string
          deal_created_id: string | null
          error_message: string | null
          id: string
          inbound_webhook_id: string
          mapped_data: Json | null
          payload: Json
          source_ip: string | null
          status: string
        }
        Insert: {
          created_at?: string
          deal_created_id?: string | null
          error_message?: string | null
          id?: string
          inbound_webhook_id: string
          mapped_data?: Json | null
          payload: Json
          source_ip?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          deal_created_id?: string | null
          error_message?: string | null
          id?: string
          inbound_webhook_id?: string
          mapped_data?: Json | null
          payload?: Json
          source_ip?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_webhook_logs_inbound_webhook_id_fkey"
            columns: ["inbound_webhook_id"]
            isOneToOne: false
            referencedRelation: "inbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_webhooks: {
        Row: {
          created_at: string
          default_tags: string[] | null
          default_temperature: string | null
          field_mappings: Json
          hmac_secret: string | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean
          last_request_at: string | null
          name: string
          phase_id: string | null
          pipeline_id: string
          requests_today: number
          secret_token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          default_tags?: string[] | null
          default_temperature?: string | null
          field_mappings?: Json
          hmac_secret?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean
          last_request_at?: string | null
          name: string
          phase_id?: string | null
          pipeline_id: string
          requests_today?: number
          secret_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          default_tags?: string[] | null
          default_temperature?: string | null
          field_mappings?: Json
          hmac_secret?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean
          last_request_at?: string | null
          name?: string
          phase_id?: string | null
          pipeline_id?: string
          requests_today?: number
          secret_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          language: string | null
          onboarding_completed: boolean | null
          plan: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          onboarding_completed?: boolean | null
          plan?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          onboarding_completed?: boolean | null
          plan?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt: number
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          response_time_ms: number | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          webhook_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          consecutive_failures: number
          created_at: string
          events: string[]
          headers: Json | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          max_retries: number
          method: string
          name: string
          retry_enabled: boolean
          secret_key: string | null
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number
          method?: string
          name: string
          retry_enabled?: boolean
          secret_key?: string | null
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number
          method?: string
          name?: string
          retry_enabled?: boolean
          secret_key?: string | null
          updated_at?: string
          url?: string
          user_id?: string | null
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
      integration_status: "connected" | "disconnected" | "error"
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
      integration_status: ["connected", "disconnected", "error"],
    },
  },
} as const
