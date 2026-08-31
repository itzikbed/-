export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      adopter_profiles: {
        Row: {
          adoption_reason: string | null
          age: number | null
          city: string | null
          completed_at: string | null
          floor_type: string | null
          has_cat_experience: boolean | null
          has_other_pets: boolean | null
          has_window_screens: boolean | null
          household_desc: string | null
          other_pets_desc: string | null
          surrender_circumstances: string | null
          updated_at: string
          user_id: string
          vet_clinic: string | null
        }
        Insert: {
          adoption_reason?: string | null
          age?: number | null
          city?: string | null
          completed_at?: string | null
          floor_type?: string | null
          has_cat_experience?: boolean | null
          has_other_pets?: boolean | null
          has_window_screens?: boolean | null
          household_desc?: string | null
          other_pets_desc?: string | null
          surrender_circumstances?: string | null
          updated_at?: string
          user_id: string
          vet_clinic?: string | null
        }
        Update: {
          adoption_reason?: string | null
          age?: number | null
          city?: string | null
          completed_at?: string | null
          floor_type?: string | null
          has_cat_experience?: boolean | null
          has_other_pets?: boolean | null
          has_window_screens?: boolean | null
          household_desc?: string | null
          other_pets_desc?: string | null
          surrender_circumstances?: string | null
          updated_at?: string
          user_id?: string
          vet_clinic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adopter_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption_requests: {
        Row: {
          admin_note: string | null
          adopter_id: string
          cat_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string
          status: string
        }
        Insert: {
          admin_note?: string | null
          adopter_id: string
          cat_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message: string
          status?: string
        }
        Update: {
          admin_note?: string | null
          adopter_id?: string
          cat_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_requests_adopter_id_fkey"
            columns: ["adopter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_requests_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_photos: {
        Row: {
          cat_id: string
          created_at: string
          id: string
          path_card: string
          path_full: string
          sort_order: number
        }
        Insert: {
          cat_id: string
          created_at?: string
          id?: string
          path_card: string
          path_full: string
          sort_order?: number
        }
        Update: {
          cat_id?: string
          created_at?: string
          id?: string
          path_card?: string
          path_full?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cat_photos_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
        ]
      }
      cats: {
        Row: {
          adopted_at: string | null
          birth_est: string
          city: string | null
          created_at: string
          description: string
          fee_amount: number | null
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          health_notes: string | null
          id: string
          is_special: boolean
          name: string
          neutered: boolean | null
          owner_id: string
          published_at: string | null
          region: string
          reject_reason: string | null
          sex: string
          special_needs: string | null
          status: string
          updated_at: string
          vaccinations: number
          video_path: string | null
        }
        Insert: {
          adopted_at?: string | null
          birth_est: string
          city?: string | null
          created_at?: string
          description: string
          fee_amount?: number | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          health_notes?: string | null
          id?: string
          is_special?: boolean
          name: string
          neutered?: boolean | null
          owner_id: string
          published_at?: string | null
          region: string
          reject_reason?: string | null
          sex?: string
          special_needs?: string | null
          status?: string
          updated_at?: string
          vaccinations?: number
          video_path?: string | null
        }
        Update: {
          adopted_at?: string | null
          birth_est?: string
          city?: string | null
          created_at?: string
          description?: string
          fee_amount?: number | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          health_notes?: string | null
          id?: string
          is_special?: boolean
          name?: string
          neutered?: boolean | null
          owner_id?: string
          published_at?: string | null
          region?: string
          reject_reason?: string | null
          sex?: string
          special_needs?: string | null
          status?: string
          updated_at?: string
          vaccinations?: number
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          cat_id: string | null
          conversation_id: string | null
          created_at: string
          error_text: string | null
          id: string
          recipient_user_id: string | null
          request_id: string | null
          status: string
          template: string
        }
        Insert: {
          cat_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_text?: string | null
          id?: string
          recipient_user_id?: string | null
          request_id?: string | null
          status: string
          template: string
        }
        Update: {
          cat_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_text?: string | null
          id?: string
          recipient_user_id?: string | null
          request_id?: string | null
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "adoption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          cat_id: string | null
          conversation_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          provider_message_id: string | null
          recipient_user_id: string | null
          request_id: string | null
          status: string
          template: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          cat_id?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          provider_message_id?: string | null
          recipient_user_id?: string | null
          request_id?: string | null
          status?: string
          template: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          cat_id?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          provider_message_id?: string | null
          recipient_user_id?: string | null
          request_id?: string | null
          status?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "adoption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          publisher_status: string
          publisher_type: string | null
          region: string | null
          role: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          city?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          publisher_status?: string
          publisher_type?: string | null
          region?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          publisher_status?: string
          publisher_type?: string | null
          region?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_by_admin_at: string | null
          read_by_user_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_by_admin_at?: string | null
          read_by_user_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_by_admin_at?: string | null
          read_by_user_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_email_outbox: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          cat_id: string | null
          conversation_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          provider_message_id: string | null
          recipient_user_id: string | null
          request_id: string | null
          status: string
          template: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "email_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_handoff_contact: {
        Args: { request_id: string }
        Returns: {
          full_name: string
          phone: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      settle_email_outbox: {
        Args: {
          p_accepted: boolean
          p_error?: string
          p_id: string
          p_provider_message_id?: string
        }
        Returns: undefined
      }
      transition_cat_status: {
        Args: {
          p_cat_id: string
          p_reason?: string
          p_sibling_note?: string
          p_to_status: string
        }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

