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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          label: string
          min_plan: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          label: string
          min_plan?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          label?: string
          min_plan?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_min_plan_fkey"
            columns: ["min_plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["followup_channel"]
          created_at: string
          error: string | null
          id: string
          lead_id: string
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["followup_task_status"]
          subject: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["followup_channel"]
          created_at?: string
          error?: string | null
          id?: string
          lead_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["followup_task_status"]
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["followup_channel"]
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["followup_task_status"]
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "follow_up_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_templates: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["followup_channel"]
          created_at: string
          delay_hours: number
          enabled: boolean
          id: string
          name: string
          subject: string | null
          trigger_status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["followup_channel"]
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          name: string
          subject?: string | null
          trigger_status: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["followup_channel"]
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          name?: string
          subject?: string | null
          trigger_status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          has_website: boolean
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          reviews_count: number | null
          score: number
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tier: Database["public"]["Enums"]["lead_tier"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          has_website?: boolean
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          score?: number
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier?: Database["public"]["Enums"]["lead_tier"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          has_website?: boolean
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          score?: number
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier?: Database["public"]["Enums"]["lead_tier"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      mp_webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          resource_id: string | null
          status: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          status?: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          status?: string
          topic?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          cycle: string
          id: string
          init_point: string | null
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          mp_preference_id: string | null
          plan_id: string
          provider: string
          raw: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          init_point?: string | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          plan_id: string
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          init_point?: string | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          plan_id?: string
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          detailed_search: boolean
          id: string
          max_categories: number
          monthly_saved_leads: number
          monthly_searches: number
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          detailed_search?: boolean
          id: string
          max_categories: number
          monthly_saved_leads: number
          monthly_searches: number
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          detailed_search?: boolean
          id?: string
          max_categories?: number
          monthly_saved_leads?: number
          monthly_searches?: number
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          user_id: string
          window_hour: string
        }
        Insert: {
          action: string
          count?: number
          user_id: string
          window_hour: string
        }
        Update: {
          action?: string
          count?: number
          user_id?: string
          window_hour?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_credits: number
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_credits?: number
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_credits?: number
          status?: string
        }
        Relationships: []
      }
      site_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          last_checked_at: string | null
          last_error: string | null
          site_id: string
          status: string
          updated_at: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          site_id: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          site_id?: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_domains_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json
          site_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          site_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_submissions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          site_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          content: Json
          created_at: string
          id: string
          published: boolean
          slug: string
          theme: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          theme?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          theme?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          plan_id: string
          renews_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          plan_id?: string
          renews_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          plan_id?: string
          renews_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          period: string
          saved_leads: number
          searches: number
          updated_at: string
          user_id: string
        }
        Insert: {
          period: string
          saved_leads?: number
          searches?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          period?: string
          saved_leads?: number
          searches?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_credentials: {
        Row: {
          access_token: string
          business_account_id: string | null
          created_at: string
          default_template_language: string | null
          default_template_name: string | null
          is_active: boolean
          phone_number_id: string
          updated_at: string
          user_id: string
          verify_token: string | null
        }
        Insert: {
          access_token: string
          business_account_id?: string | null
          created_at?: string
          default_template_language?: string | null
          default_template_name?: string | null
          is_active?: boolean
          phone_number_id: string
          updated_at?: string
          user_id: string
          verify_token?: string | null
        }
        Update: {
          access_token?: string
          business_account_id?: string | null
          created_at?: string
          default_template_language?: string | null
          default_template_name?: string | null
          is_active?: boolean
          phone_number_id?: string
          updated_at?: string
          user_id?: string
          verify_token?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body_variables: Json | null
          created_at: string
          error: string | null
          id: string
          lead_id: string | null
          raw_response: Json | null
          status: string
          template_language: string | null
          template_name: string | null
          to_phone: string
          user_id: string
          wa_message_id: string | null
        }
        Insert: {
          body_variables?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          raw_response?: Json | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          to_phone: string
          user_id: string
          wa_message_id?: string | null
        }
        Update: {
          body_variables?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          raw_response?: Json | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          to_phone?: string
          user_id?: string
          wa_message_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: { _action: string; _max: number; _user_id: string }
        Returns: boolean
      }
      current_period: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _saved: number; _searches: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      appointment_status: "pendente" | "concluido" | "cancelado"
      followup_channel: "whatsapp" | "email"
      followup_task_status: "pending" | "sent" | "cancelled" | "failed"
      lead_status:
        | "base"
        | "abordado"
        | "agendado"
        | "follow_up"
        | "convertido"
        | "perdido"
      lead_tier: "frio" | "morno" | "quente"
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
      app_role: ["admin", "user"],
      appointment_status: ["pendente", "concluido", "cancelado"],
      followup_channel: ["whatsapp", "email"],
      followup_task_status: ["pending", "sent", "cancelled", "failed"],
      lead_status: [
        "base",
        "abordado",
        "agendado",
        "follow_up",
        "convertido",
        "perdido",
      ],
      lead_tier: ["frio", "morno", "quente"],
    },
  },
} as const
