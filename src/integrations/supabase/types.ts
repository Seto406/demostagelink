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
      activities: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          email: string
          first_name: string | null
          id: string
          invited_at: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          invited_at?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string
          status?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          show_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          show_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      collaboration_requests: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          receiver_id: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id: string
          receiver_id: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          receiver_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_receiver_id_fkey"
            columns: ["receiver_id"]
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
          status: string
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
          status?: string
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
          status?: string
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
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          paymongo_checkout_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          paymongo_checkout_id: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          paymongo_checkout_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          profile_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          updated_at: string
          profile_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          updated_at?: string
          profile_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          updated_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
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
      reviews: {
        Row: {
          id: string
          created_at: string
          show_id: string
          user_id: string
          rating: number
          comment: string | null
          is_approved: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          show_id: string
          user_id: string
          rating: number
          comment?: string | null
          is_approved?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          show_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          is_approved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          founded_year: number | null
          group_name: string | null
          has_completed_tour: boolean | null
          id: string
          instagram_url: string | null
          map_screenshot_url: string | null
          niche: Database["public"]["Enums"]["niche_type"] | null
          rank: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string | null
          xp: number | null
          university: string | null
          group_logo_url: string | null
          group_banner_url: string | null
          producer_role: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          group_name?: string | null
          has_completed_tour?: boolean | null
          id?: string
          instagram_url?: string | null
          map_screenshot_url?: string | null
          niche?: Database["public"]["Enums"]["niche_type"] | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number | null
          university?: string | null
          group_logo_url?: string | null
          group_banner_url?: string | null
          producer_role?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          group_name?: string | null
          has_completed_tour?: boolean | null
          id?: string
          instagram_url?: string | null
          map_screenshot_url?: string | null
          niche?: Database["public"]["Enums"]["niche_type"] | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number | null
          university?: string | null
          group_logo_url?: string | null
          group_banner_url?: string | null
          producer_role?: string | null
        }
        Relationships: []
      }
      show_likes: {
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
            foreignKeyName: "show_likes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string | null
          tier: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: string | null
          tier?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string | null
          tier?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          cast_members: Json | null
          city: string | null
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          director: string | null
          duration: string | null
          external_links: Json
          genre: string | null
          id: string
          niche: Database["public"]["Enums"]["niche_type"] | null
          poster_url: string | null
          price: number | null
          producer_id: string
          production_status: string
          seo_metadata: Json | null
          show_time: string | null
          status: Database["public"]["Enums"]["show_status"]
          tags: string[] | null
          ticket_link: string | null
          title: string
          updated_at: string
          venue: string | null
          video_url: string | null
          reservation_fee: number | null
          collect_balance_onsite: boolean | null
          theater_group_id: string | null
        }
        Insert: {
          cast_members?: Json | null
          city?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          director?: string | null
          duration?: string | null
          external_links?: Json
          genre?: string | null
          id?: string
          niche?: Database["public"]["Enums"]["niche_type"] | null
          poster_url?: string | null
          price?: number | null
          producer_id: string
          production_status?: string
          seo_metadata?: Json | null
          show_time?: string | null
          status?: Database["public"]["Enums"]["show_status"]
          tags?: string[] | null
          ticket_link?: string | null
          title: string
          updated_at?: string
          venue?: string | null
          video_url?: string | null
          reservation_fee?: number | null
          collect_balance_onsite?: boolean | null
          theater_group_id?: string | null
        }
        Update: {
          cast_members?: Json | null
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
          price?: number | null
          producer_id?: string
          production_status?: string
          seo_metadata?: Json | null
          show_time?: string | null
          status?: Database["public"]["Enums"]["show_status"]
          tags?: string[] | null
          ticket_link?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
          video_url?: string | null
          reservation_fee?: number | null
          collect_balance_onsite?: boolean | null
          theater_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shows_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_theater_group_id_fkey"
            columns: ["theater_group_id"]
            isOneToOne: false
            referencedRelation: "theater_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          access_code: string | null
          checked_in_at: string | null
          created_at: string
          id: string
          show_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          payment_id: string | null
        }
        Insert: {
          access_code?: string | null
          checked_in_at?: string | null
          created_at?: string
          id?: string
          show_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          payment_id?: string | null
        }
        Update: {
          access_code?: string | null
          checked_in_at?: string | null
          created_at?: string
          id?: string
          show_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theater_groups: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theater_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_summary: {
        Args: {
          group_id?: string
          target_group_id?: string
        }
        Returns: Json
      }
      get_city_show_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          count: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_revenue: number
          active_shows: number
          total_users: number
          pending_approvals: number
        }
      }
      get_admin_user_list: {
        Args: {
          page_number: number
          page_size: number
          search_query?: string
          role_filter?: string
        }
        Returns: {
          users: Json[]
          total_count: number
        }
      }
    }
    Enums: {
      niche_type: "local" | "university"
      show_status: "pending" | "approved" | "rejected" | "archived"
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
