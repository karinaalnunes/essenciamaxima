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
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          latency_ms: number | null
          model: string
          module: string
          status: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          latency_ms?: number | null
          model: string
          module: string
          status: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          latency_ms?: number | null
          model?: string
          module?: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "mvv_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_metrics: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          created_at: string
          document_id: string | null
          id: string
          module: string
          started_at: string
          status: string
          total_duration_seconds: number | null
          total_messages: number | null
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          module: string
          started_at?: string
          status?: string
          total_duration_seconds?: number | null
          total_messages?: number | null
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          module?: string
          started_at?: string
          status?: string
          total_duration_seconds?: number | null
          total_messages?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      culture_conversation_history: {
        Row: {
          content: string
          created_at: string
          culture_document_id: string
          id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          culture_document_id: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          culture_document_id?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      culture_documents: {
        Row: {
          action_plan_120: Json | null
          action_plan_30: Json | null
          action_plan_60: Json | null
          action_plan_90: Json | null
          closing_message: string | null
          competitive_advantage: string | null
          created_at: string
          cultural_challenges: Json | null
          cultural_essence: string | null
          cultural_rituals: Json | null
          cultural_strengths: Json | null
          culture_indicators: Json | null
          growth_practices: string | null
          guiding_principles: Json | null
          id: string
          mvv_document_id: string
          psychological_safety_practices: string | null
          reputation_goal: string | null
          stakeholder_guidelines: Json | null
          strategic_focus: string | null
          swot_improvements: Json | null
          swot_strengths: Json | null
          title: string
          updated_at: string
          user_id: string
          wellbeing_support: string | null
        }
        Insert: {
          action_plan_120?: Json | null
          action_plan_30?: Json | null
          action_plan_60?: Json | null
          action_plan_90?: Json | null
          closing_message?: string | null
          competitive_advantage?: string | null
          created_at?: string
          cultural_challenges?: Json | null
          cultural_essence?: string | null
          cultural_rituals?: Json | null
          cultural_strengths?: Json | null
          culture_indicators?: Json | null
          growth_practices?: string | null
          guiding_principles?: Json | null
          id?: string
          mvv_document_id: string
          psychological_safety_practices?: string | null
          reputation_goal?: string | null
          stakeholder_guidelines?: Json | null
          strategic_focus?: string | null
          swot_improvements?: Json | null
          swot_strengths?: Json | null
          title: string
          updated_at?: string
          user_id: string
          wellbeing_support?: string | null
        }
        Update: {
          action_plan_120?: Json | null
          action_plan_30?: Json | null
          action_plan_60?: Json | null
          action_plan_90?: Json | null
          closing_message?: string | null
          competitive_advantage?: string | null
          created_at?: string
          cultural_challenges?: Json | null
          cultural_essence?: string | null
          cultural_rituals?: Json | null
          cultural_strengths?: Json | null
          culture_indicators?: Json | null
          growth_practices?: string | null
          guiding_principles?: Json | null
          id?: string
          mvv_document_id?: string
          psychological_safety_practices?: string | null
          reputation_goal?: string | null
          stakeholder_guidelines?: Json | null
          strategic_focus?: string | null
          swot_improvements?: Json | null
          swot_strengths?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          wellbeing_support?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string
          subject: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          created_at: string
          email: string
          event_type: string
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_type: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          browser: string | null
          city: string | null
          company: string
          consent_lgpd: boolean
          country: string | null
          created_at: string
          device: string | null
          email: string
          fbclid: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          language: string | null
          name: string
          os: string | null
          phone: string
          referrer: string | null
          screen_resolution: string | null
          segment: string
          state: string | null
          time_on_page: number | null
          timezone: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          company: string
          consent_lgpd?: boolean
          country?: string | null
          created_at?: string
          device?: string | null
          email: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          name: string
          os?: string | null
          phone?: string
          referrer?: string | null
          screen_resolution?: string | null
          segment: string
          state?: string | null
          time_on_page?: number | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          company?: string
          consent_lgpd?: boolean
          country?: string | null
          created_at?: string
          device?: string | null
          email?: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          name?: string
          os?: string | null
          phone?: string
          referrer?: string | null
          screen_resolution?: string | null
          segment?: string
          state?: string | null
          time_on_page?: number | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_type: string | null
          meeting_url: string | null
          mentor_id: string | null
          reminder_15min_sent: boolean | null
          reminder_1h_sent: boolean | null
          reminder_24h_sent: boolean | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_type?: string | null
          meeting_url?: string | null
          mentor_id?: string | null
          reminder_15min_sent?: boolean | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_type?: string | null
          meeting_url?: string | null
          mentor_id?: string | null
          reminder_15min_sent?: boolean | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentorship_relationships: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          mentee_id: string
          mentor_id: string
          notes: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      mvv_documents: {
        Row: {
          company_context: string | null
          company_name: string
          company_size: string | null
          created_at: string
          desired_values: string[] | null
          feedback: string | null
          id: string
          mission: string | null
          mission_pocket: string | null
          mission_punchline: string | null
          purpose: string | null
          segment: string
          tags: string[] | null
          target_audience: string | null
          title: string
          tone_of_voice: string | null
          updated_at: string
          user_id: string
          values: Json | null
          vision: string | null
          vision_indicators: Json | null
        }
        Insert: {
          company_context?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string
          desired_values?: string[] | null
          feedback?: string | null
          id?: string
          mission?: string | null
          mission_pocket?: string | null
          mission_punchline?: string | null
          purpose?: string | null
          segment: string
          tags?: string[] | null
          target_audience?: string | null
          title: string
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
          values?: Json | null
          vision?: string | null
          vision_indicators?: Json | null
        }
        Update: {
          company_context?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string
          desired_values?: string[] | null
          feedback?: string | null
          id?: string
          mission?: string | null
          mission_pocket?: string | null
          mission_punchline?: string | null
          purpose?: string | null
          segment?: string
          tags?: string[] | null
          target_audience?: string | null
          title?: string
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
          values?: Json | null
          vision?: string | null
          vision_indicators?: Json | null
        }
        Relationships: []
      }
      mvv_feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          document_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvv_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "mvv_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: []
      }
      professional_connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          company_website: string | null
          created_at: string
          email: string
          facebook_company: string | null
          facebook_personal: string | null
          id: string
          instagram_company: string | null
          instagram_personal: string | null
          linkedin_company: string | null
          linkedin_personal: string | null
          logo_url: string | null
          name: string
          phone: string | null
          position: string | null
          profile_visibility: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_website?: string | null
          created_at?: string
          email: string
          facebook_company?: string | null
          facebook_personal?: string | null
          id: string
          instagram_company?: string | null
          instagram_personal?: string | null
          linkedin_company?: string | null
          linkedin_personal?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          position?: string | null
          profile_visibility?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_website?: string | null
          created_at?: string
          email?: string
          facebook_company?: string | null
          facebook_personal?: string | null
          id?: string
          instagram_company?: string | null
          instagram_personal?: string | null
          linkedin_company?: string | null
          linkedin_personal?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          profile_visibility?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          product_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          product_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          product_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
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
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          culture_document_id: string | null
          description: string | null
          due_date: string | null
          id: string
          plan_period: string | null
          priority: string | null
          source_type: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          culture_document_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          plan_period?: string | null
          priority?: string | null
          source_type: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          culture_document_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          plan_period?: string | null
          priority?: string | null
          source_type?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_culture_document_id_fkey"
            columns: ["culture_document_id"]
            isOneToOne: false
            referencedRelation: "culture_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          phone: string
          provider: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          phone: string
          provider?: string | null
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          phone?: string
          provider?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_culture_completion_rate: {
        Args: never
        Returns: {
          completed: number
          completion_rate: number
          total: number
        }[]
      }
      get_mvv_completion_rate: {
        Args: never
        Returns: {
          completed: number
          completion_rate: number
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_user_password_with_code: {
        Args: { new_password: string; reset_code: string; user_email: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
