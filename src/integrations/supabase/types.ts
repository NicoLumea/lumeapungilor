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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          draft: Json
          key: string
          published: Json | null
          published_at: string | null
          published_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          draft?: Json
          key: string
          published?: Json | null
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          draft?: Json
          key?: string
          published?: Json | null
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      employee_requests: {
        Row: {
          created_at: string
          decision_note: string | null
          email: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision_note?: string | null
          email: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision_note?: string | null
          email?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_checkout_usage: {
        Row: {
          email: string
          first_order_at: string
          first_order_id: string | null
          order_count: number
        }
        Insert: {
          email: string
          first_order_at?: string
          first_order_id?: string | null
          order_count?: number
        }
        Update: {
          email?: string
          first_order_at?: string
          first_order_id?: string | null
          order_count?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selling_unit: string | null
          sku: string | null
          unit_price: number
          units_per_pack: number | null
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          selling_unit?: string | null
          sku?: string | null
          unit_price: number
          units_per_pack?: number | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selling_unit?: string | null
          sku?: string | null
          unit_price?: number
          units_per_pack?: number | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived_at: string | null
          billing_address: string | null
          city: string | null
          company_name: string | null
          contact_name: string
          county: string | null
          created_at: string
          cui: string | null
          currency: string
          delivery_address: string | null
          email: string
          email_verified: boolean
          id: string
          internal_notes: string | null
          is_guest: boolean
          is_test: boolean
          notes: string | null
          notification_error: string | null
          notification_status: string
          notified_at: string | null
          order_number: string
          payment_reference: string | null
          payment_status: string
          phone: string | null
          postal_code: string | null
          reg_com: string | null
          shipping_total: number
          status: string
          stock_applied: boolean
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          county?: string | null
          created_at?: string
          cui?: string | null
          currency?: string
          delivery_address?: string | null
          email: string
          email_verified?: boolean
          id?: string
          internal_notes?: string | null
          is_guest?: boolean
          is_test?: boolean
          notes?: string | null
          notification_error?: string | null
          notification_status?: string
          notified_at?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          shipping_total?: number
          status?: string
          stock_applied?: boolean
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          county?: string | null
          created_at?: string
          cui?: string | null
          currency?: string
          delivery_address?: string | null
          email?: string
          email_verified?: boolean
          id?: string
          internal_notes?: string | null
          is_guest?: boolean
          is_test?: boolean
          notes?: string | null
          notification_error?: string | null
          notification_status?: string
          notified_at?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          shipping_total?: number
          status?: string
          stock_applied?: boolean
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_archived: boolean
          is_featured: boolean
          min_order_qty: number
          name: string
          price: number
          qty_increment: number
          selling_unit: string
          sku: string | null
          slug: string
          sort_order: number
          specs: Json
          status: string
          stock: number
          track_stock: boolean
          units_per_pack: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          min_order_qty?: number
          name: string
          price?: number
          qty_increment?: number
          selling_unit?: string
          sku?: string | null
          slug: string
          sort_order?: number
          specs?: Json
          status?: string
          stock?: number
          track_stock?: boolean
          units_per_pack?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          min_order_qty?: number
          name?: string
          price?: number
          qty_increment?: number
          selling_unit?: string
          sku?: string | null
          slug?: string
          sort_order?: number
          specs?: Json
          status?: string
          stock?: number
          track_stock?: boolean
          units_per_pack?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          billing_address: string | null
          city: string | null
          company_name: string | null
          county: string | null
          created_at: string
          cui: string | null
          deletion_requested_at: string | null
          delivery_address: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          reg_com: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          county?: string | null
          created_at?: string
          cui?: string | null
          deletion_requested_at?: string | null
          delivery_address?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          county?: string | null
          created_at?: string
          cui?: string | null
          deletion_requested_at?: string | null
          delivery_address?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          hits: number
          identifier: string
          window_start: string
        }
        Insert: {
          bucket: string
          hits?: number
          identifier: string
          window_start?: string
        }
        Update: {
          bucket?: string
          hits?: number
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      restock_requests: {
        Row: {
          consent_at: string
          created_at: string
          email: string
          id: string
          notified_at: string | null
          notify_error: string | null
          product_id: string
          status: string
          unsubscribe_token: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          notify_error?: string | null
          product_id: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          notify_error?: string | null
          product_id?: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_requests_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string
          id: string
          kind: string
          message: string
          order_id: string | null
          order_number: string | null
          resolution: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email: string
          id?: string
          kind?: string
          message: string
          order_id?: string | null
          order_number?: string | null
          resolution?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string
          id?: string
          kind?: string
          message?: string
          order_id?: string | null
          order_number?: string | null
          resolution?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_requests: {
        Row: {
          candidate_email: string
          candidate_user_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          id: string
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          requester_email: string | null
          status: string
        }
        Insert: {
          candidate_email: string
          candidate_user_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          requester_email?: string | null
          status?: string
        }
        Update: {
          candidate_email?: string
          candidate_user_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          requested_by?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          requester_email?: string | null
          status?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_interest_dashboard: {
        Args: {
          _date_from?: string
          _date_to?: string
          _page?: number
          _page_size?: number
          _search?: string
          _source?: string
        }
        Returns: Json
      }
      admin_users_dashboard: {
        Args: {
          _date_from?: string
          _date_to?: string
          _page?: number
          _page_size?: number
          _role?: string
          _search?: string
          _sort?: string
          _source?: string
          _status?: string
        }
        Returns: Json
      }
      admin_users_export: {
        Args: {
          _date_from?: string
          _date_to?: string
          _role?: string
          _search?: string
          _sort?: string
          _source?: string
          _status?: string
        }
        Returns: Json
      }
      create_order_tx: {
        Args: { p_items: Json; p_order: Json }
        Returns: {
          id: string
          is_test: boolean
          order_number: string
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
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      top_selling_products: {
        Args: { p_limit?: number }
        Returns: {
          product_id: string
          sold: number
        }[]
      }
      write_audit: {
        Args: {
          _action: string
          _details: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "employee" | "owner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "customer", "employee", "owner"],
    },
  },
} as const
