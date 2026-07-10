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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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

