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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      google_sheets_config: {
        Row: {
          category_sheet_range: string | null
          column_mappings: Json | null
          created_at: string
          data_start_row: number | null
          headers_row: number | null
          id: string
          is_active: boolean | null
          sheet_id: string
          sheet_name: string
          transaction_sheet_range: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_sheet_range?: string | null
          column_mappings?: Json | null
          created_at?: string
          data_start_row?: number | null
          headers_row?: number | null
          id?: string
          is_active?: boolean | null
          sheet_id: string
          sheet_name: string
          transaction_sheet_range?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_sheet_range?: string | null
          column_mappings?: Json | null
          created_at?: string
          data_start_row?: number | null
          headers_row?: number | null
          id?: string
          is_active?: boolean | null
          sheet_id?: string
          sheet_name?: string
          transaction_sheet_range?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lending_transactions: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          due_date: string | null
          id: string
          person_name: string
          related_transaction_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          person_name: string
          related_transaction_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          person_name?: string
          related_transaction_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_payments: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          interest_component: number | null
          loan_id: string
          notes: string | null
          outstanding_balance: number | null
          payment_date: string
          payment_method: string | null
          principal_component: number | null
          status: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          interest_component?: number | null
          loan_id: string
          notes?: string | null
          outstanding_balance?: number | null
          payment_date: string
          payment_method?: string | null
          principal_component?: number | null
          status?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          interest_component?: number | null
          loan_id?: string
          notes?: string | null
          outstanding_balance?: number | null
          payment_date?: string
          payment_method?: string | null
          principal_component?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          id: string
          interest_rate: number
          lender_name: string | null
          loan_name: string
          loan_type: string | null
          monthly_emi: number
          principal_amount: number
          start_date: string
          status: string
          tenure_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_rate: number
          lender_name?: string | null
          loan_name: string
          loan_type?: string | null
          monthly_emi: number
          principal_amount: number
          start_date: string
          status?: string
          tenure_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_rate?: number
          lender_name?: string | null
          loan_name?: string
          loan_type?: string | null
          monthly_emi?: number
          principal_amount?: number
          start_date?: string
          status?: string
          tenure_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          next_due_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_due_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_due_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          loan_id: string | null
          person: string | null
          source: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          loan_id?: string | null
          person?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          loan_id?: string | null
          person?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_sync: boolean
          created_at: string
          currency: string
          google_auth_status: string | null
          google_token_expires_at: string | null
          google_token_vault_id: string | null
          id: string
          language: string
          last_synced: string | null
          notifications_budget_alerts: boolean
          notifications_email: boolean
          notifications_loan_reminders: boolean
          sheet_url: string | null
          sync_errors: string | null
          sync_status: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_sync?: boolean
          created_at?: string
          currency?: string
          google_auth_status?: string | null
          google_token_expires_at?: string | null
          google_token_vault_id?: string | null
          id?: string
          language?: string
          last_synced?: string | null
          notifications_budget_alerts?: boolean
          notifications_email?: boolean
          notifications_loan_reminders?: boolean
          sheet_url?: string | null
          sync_errors?: string | null
          sync_status?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_sync?: boolean
          created_at?: string
          currency?: string
          google_auth_status?: string | null
          google_token_expires_at?: string | null
          google_token_vault_id?: string | null
          id?: string
          language?: string
          last_synced?: string | null
          notifications_budget_alerts?: boolean
          notifications_email?: boolean
          notifications_loan_reminders?: boolean
          sheet_url?: string | null
          sync_errors?: string | null
          sync_status?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_google_tokens: { Args: { _user_id: string }; Returns: Json }
    }
    Enums: {
      transaction_status: "pending" | "completed" | "received"
      transaction_type:
        | "expense"
        | "income"
        | "lend"
        | "borrow"
        | "investment"
        | "emi"
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
      transaction_status: ["pending", "completed", "received"],
      transaction_type: [
        "expense",
        "income",
        "lend",
        "borrow",
        "investment",
        "emi",
      ],
    },
  },
} as const
