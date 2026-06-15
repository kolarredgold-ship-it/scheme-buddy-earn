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
      career_progress: {
        Row: {
          college: string | null
          course: string | null
          created_at: string
          current_step: number
          daily_promotions: number
          eligible: boolean
          id: string
          last_promotion_date: string | null
          phone: string | null
          registered: boolean
          streak_days: number
          total_active_days: number
          total_promotions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          college?: string | null
          course?: string | null
          created_at?: string
          current_step?: number
          daily_promotions?: number
          eligible?: boolean
          id?: string
          last_promotion_date?: string | null
          phone?: string | null
          registered?: boolean
          streak_days?: number
          total_active_days?: number
          total_promotions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          college?: string | null
          course?: string | null
          created_at?: string
          current_step?: number
          daily_promotions?: number
          eligible?: boolean
          id?: string
          last_promotion_date?: string | null
          phone?: string | null
          registered?: boolean
          streak_days?: number
          total_active_days?: number
          total_promotions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hiring_applications: {
        Row: {
          application_type: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_questions: {
        Row: {
          answer: string
          category: string
          created_at: string
          difficulty: string
          id: string
          question: string
          role: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          difficulty?: string
          id?: string
          question: string
          role: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          question?: string
          role?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          payer_email: string | null
          payer_mobile: string | null
          payer_name: string | null
          payment_type: string
          screenshot_url: string | null
          status: string
          transaction_number: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payer_email?: string | null
          payer_mobile?: string | null
          payer_name?: string | null
          payment_type?: string
          screenshot_url?: string | null
          status?: string
          transaction_number?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payer_email?: string | null
          payer_mobile?: string | null
          payer_name?: string | null
          payment_type?: string
          screenshot_url?: string | null
          status?: string
          transaction_number?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      processed_payments: {
        Row: {
          amount: number
          ap_transaction_id: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          amount?: number
          ap_transaction_id: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          amount?: number
          ap_transaction_id?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_locked: boolean
          bank_name: string | null
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          name: string | null
          referral_code: string
          referred_by: string | null
          report_credits: number
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_locked?: boolean
          bank_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string | null
          referral_code: string
          referred_by?: string | null
          report_credits?: number
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_locked?: boolean
          bank_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string | null
          referral_code?: string
          referred_by?: string | null
          report_credits?: number
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      promotion_logs: {
        Row: {
          id: string
          promoted_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promoted_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promoted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_generations: {
        Row: {
          created_at: string
          form_data: Json | null
          id: string
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json | null
          id?: string
          report_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_data?: Json | null
          id?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          chapter_content: Json
          created_at: string
          form_data: Json
          id: string
          report_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_content?: Json
          created_at?: string
          form_data?: Json
          id?: string
          report_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_content?: Json
          created_at?: string
          form_data?: Json
          id?: string
          report_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheme_notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          scheme_id: string | null
          state: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          scheme_id?: string | null
          state: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          scheme_id?: string | null
          state?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_notifications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          apply_link: string | null
          beneficiary_type: string | null
          category: string
          created_at: string
          description: string
          documents: string | null
          eligibility: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          slug: string
          source_website: string | null
          state: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          apply_link?: string | null
          beneficiary_type?: string | null
          category: string
          created_at?: string
          description: string
          documents?: string | null
          eligibility?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug: string
          source_website?: string | null
          state?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          apply_link?: string | null
          beneficiary_type?: string | null
          category?: string
          created_at?: string
          description?: string
          documents?: string | null
          eligibility?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug?: string
          source_website?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_categories: string[] | null
          preferred_state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_categories?: string[] | null
          preferred_state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_categories?: string[] | null
          preferred_state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          total_amount: number
          total_count: number
          updated_at: string
          utr_number: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          total_amount?: number
          total_count?: number
          updated_at?: string
          utr_number?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          total_amount?: number
          total_count?: number
          updated_at?: string
          utr_number?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          batch_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
          utr_number: string | null
        }
        Insert: {
          amount: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
          utr_number?: string | null
        }
        Update: {
          amount?: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      get_cron_secret: { Args: never; Returns: string }
      get_user_referral_code: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_cron_secret: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_status: "free" | "active" | "expired"
      transaction_type: "credit" | "debit"
      withdrawal_status:
        | "pending"
        | "approved"
        | "rejected"
        | "processing"
        | "success"
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
      app_role: ["admin", "moderator", "user"],
      subscription_status: ["free", "active", "expired"],
      transaction_type: ["credit", "debit"],
      withdrawal_status: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "success",
      ],
    },
  },
} as const
