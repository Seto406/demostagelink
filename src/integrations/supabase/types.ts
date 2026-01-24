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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          group_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          group_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          group_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          show_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      group_audience_links: {
        Row: {
          accepted_at: string | null
          audience_user_id: string
          created_at: string
          group_id: string
          id: string
          invited_at: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          audience_user_id: string
          created_at?: string
          group_id: string
          id?: string
          invited_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          audience_user_id?: string
          created_at?: string
          group_id?: string
          id?: string
          invited_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_audience_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          group_id: string
          id: string
          member_name: string
          role_in_group: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          group_id: string
          id?: string
          member_name: string
          role_in_group?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          group_id?: string
          id?: string
          member_name?: string
          role_in_group?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_requests: {
        Row: {
          created_at: string
          group_name: string
          id: string
          portfolio_link: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          portfolio_link: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          portfolio_link?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          founded_year: number | null
          gallery_images: string[] | null
          group_name: string | null
          id: string
          instagram_url: string | null
          map_screenshot_url: string | null
          niche: Database["public"]["Enums"]["niche_type"] | null
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          ticket_link: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          gallery_images?: string[] | null
          group_name?: string | null
          id?: string
          instagram_url?: string | null
          map_screenshot_url?: string | null
          niche?: Database["public"]["Enums"]["niche_type"] | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          ticket_link?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          gallery_images?: string[] | null
          group_name?: string | null
          id?: string
          instagram_url?: string | null
          map_screenshot_url?: string | null
          niche?: Database["public"]["Enums"]["niche_type"] | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          ticket_link?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shows: {
        Row: {
          cast_members: string[] | null
          city: string | null
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          director: string | null
          duration: string | null
          genre: string | null
          id: string
          niche: Database["public"]["Enums"]["niche_type"] | null
          poster_url: string | null
          producer_id: string
          show_dates: Json | null
          status: Database["public"]["Enums"]["show_status"]
          tags: string[] | null
          ticket_link: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          cast_members?: string[] | null
          city?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          director?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          niche?: Database["public"]["Enums"]["niche_type"] | null
          poster_url?: string | null
          producer_id: string
          show_dates?: Json | null
          status?: Database["public"]["Enums"]["show_status"]
          tags?: string[] | null
          ticket_link?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          cast_members?: string[] | null
          city?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          director?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          niche?: Database["public"]["Enums"]["niche_type"] | null
          poster_url?: string | null
          producer_id?: string
          show_dates?: Json | null
          status?: Database["public"]["Enums"]["show_status"]
          tags?: string[] | null
          ticket_link?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shows_producer_id_fkey"
            columns: ["producer_id"]
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      niche_type: "local" | "university"
      show_status: "pending" | "approved" | "rejected"
      user_role: "audience" | "producer" | "admin"
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
      niche_type: ["local", "university"],
      show_status: ["pending", "approved", "rejected"],
      user_role: ["audience", "producer", "admin"],
    },
  },
} as const
