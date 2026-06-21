export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Stable application aliases retained across generated Supabase type formats.
export type CourtUserRole = Database["public"]["Enums"]["court_user_role"]
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"]
export type ArchiveLocationRow = Database["public"]["Tables"]["archive_locations"]["Row"]
export type CaseRow = Database["public"]["Tables"]["cases"]["Row"]
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
export type FileMovementRow = Database["public"]["Tables"]["file_movements"]["Row"]
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type RegistryRequestRow = Database["public"]["Tables"]["registry_requests"]["Row"]

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
      archive_locations: {
        Row: {
          capacity: number
          category: string | null
          code: string
          created_at: string
          id: string
          label: string
          level: Database["public"]["Enums"]["location_level"]
          occupied_count: number
          parent_id: string | null
        }
        Insert: {
          capacity?: number
          category?: string | null
          code: string
          created_at?: string
          id?: string
          label: string
          level: Database["public"]["Enums"]["location_level"]
          occupied_count?: number
          parent_id?: string | null
        }
        Update: {
          capacity?: number
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string
          level?: Database["public"]["Enums"]["location_level"]
          occupied_count?: number
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archive_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "archive_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          message: string
          title: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          message: string
          title: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      case_activities: {
        Row: {
          activity_date: string | null
          activity_time: string | null
          activity_type: string
          case_id: string
          courtroom: string | null
          created_at: string
          id: string
          judicial_officer: string | null
          notes: string | null
          source: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_time?: string | null
          activity_type: string
          case_id: string
          courtroom?: string | null
          created_at?: string
          id?: string
          judicial_officer?: string | null
          notes?: string | null
          source?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_time?: string | null
          activity_type?: string
          case_id?: string
          courtroom?: string | null
          created_at?: string
          id?: string
          judicial_officer?: string | null
          notes?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_categories: {
        Row: {
          active: boolean
          archive_indexing_notes: string | null
          category_name: string
          code: string
          common_prefix: string
          confidence_level: string | null
          court_level: string
          created_at: string
          description: string | null
          division: string
          example_case_number: string | null
          notes: string | null
          parent_category: string
          requires_registry_verification: boolean
          source_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          archive_indexing_notes?: string | null
          category_name: string
          code: string
          common_prefix: string
          confidence_level?: string | null
          court_level: string
          created_at?: string
          description?: string | null
          division: string
          example_case_number?: string | null
          notes?: string | null
          parent_category: string
          requires_registry_verification?: boolean
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          archive_indexing_notes?: string | null
          category_name?: string
          code?: string
          common_prefix?: string
          confidence_level?: string | null
          court_level?: string
          created_at?: string
          description?: string | null
          division?: string
          example_case_number?: string | null
          notes?: string | null
          parent_category?: string
          requires_registry_verification?: boolean
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      case_category_aliases: {
        Row: {
          alias: string
          alias_type: string | null
          case_category_code: string
          created_at: string
          id: number
          notes: string | null
        }
        Insert: {
          alias: string
          alias_type?: string | null
          case_category_code: string
          created_at?: string
          id?: number
          notes?: string | null
        }
        Update: {
          alias?: string
          alias_type?: string | null
          case_category_code?: string
          created_at?: string
          id?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_category_aliases_case_category_code_fkey"
            columns: ["case_category_code"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      case_number_aliases: {
        Row: {
          case_id: string
          case_number: string
          created_at: string
          id: string
          normalized_case_number: string | null
          source: string
        }
        Insert: {
          case_id: string
          case_number: string
          created_at?: string
          id?: string
          normalized_case_number?: string | null
          source?: string
        }
        Update: {
          case_id?: string
          case_number?: string
          created_at?: string
          id?: string
          normalized_case_number?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_number_aliases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_parties: {
        Row: {
          advocate_name: string | null
          case_id: string
          created_at: string
          id: string
          id_number: string | null
          normalized_party_name: string | null
          party_name: string
          party_role: string
        }
        Insert: {
          advocate_name?: string | null
          case_id: string
          created_at?: string
          id?: string
          id_number?: string | null
          normalized_party_name?: string | null
          party_name: string
          party_role: string
        }
        Update: {
          advocate_name?: string | null
          case_id?: string
          created_at?: string
          id?: string
          id_number?: string | null
          normalized_party_name?: string | null
          party_name?: string
          party_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_special_metadata: {
        Row: {
          case_id: string
          created_at: string
          id: string
          metadata_key: string
          metadata_type: string | null
          metadata_value: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          metadata_key: string
          metadata_type?: string | null
          metadata_value?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          metadata_key?: string
          metadata_type?: string | null
          metadata_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_special_metadata_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_types: {
        Row: {
          active: boolean
          case_family: string
          case_type: string
          case_type_id: number
          code: string
          court_level: string
          created_at: string
          full_label: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          case_family: string
          case_type: string
          case_type_id: number
          code: string
          court_level: string
          created_at?: string
          full_label: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          case_family?: string
          case_type?: string
          case_type_id?: number
          code?: string
          court_level?: string
          created_at?: string
          full_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          archive_code: string | null
          case_category_code: string | null
          case_family: string | null
          case_number: string
          case_type: string | null
          case_type_id: number | null
          closed_date: string | null
          court: string
          court_division: string | null
          court_station: string | null
          created_at: string
          created_by: string | null
          defendant: string | null
          description: string | null
          filed_date: string | null
          id: string
          is_missing: boolean | null
          judge: string | null
          location_id: string | null
          notes: string | null
          plaintiff: string | null
          qr_barcode: string | null
          shelf_location: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          archive_code?: string | null
          case_category_code?: string | null
          case_family?: string | null
          case_number: string
          case_type?: string | null
          case_type_id?: number | null
          closed_date?: string | null
          court?: string
          court_division?: string | null
          court_station?: string | null
          created_at?: string
          created_by?: string | null
          defendant?: string | null
          description?: string | null
          filed_date?: string | null
          id?: string
          is_missing?: boolean | null
          judge?: string | null
          location_id?: string | null
          notes?: string | null
          plaintiff?: string | null
          qr_barcode?: string | null
          shelf_location?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          archive_code?: string | null
          case_category_code?: string | null
          case_family?: string | null
          case_number?: string
          case_type?: string | null
          case_type_id?: number | null
          closed_date?: string | null
          court?: string
          court_division?: string | null
          court_station?: string | null
          created_at?: string
          created_by?: string | null
          defendant?: string | null
          description?: string | null
          filed_date?: string | null
          id?: string
          is_missing?: boolean | null
          judge?: string | null
          location_id?: string | null
          notes?: string | null
          plaintiff?: string | null
          qr_barcode?: string | null
          shelf_location?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_case_category_code_fkey"
            columns: ["case_category_code"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "cases_case_type_id_fkey"
            columns: ["case_type_id"]
            isOneToOne: false
            referencedRelation: "case_types"
            referencedColumns: ["case_type_id"]
          },
          {
            foreignKeyName: "cases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "archive_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      court_stations: {
        Row: {
          active: boolean
          code: string
          county: string
          court_rank: string
          created_at: string
          station_name: string
        }
        Insert: {
          active?: boolean
          code: string
          county: string
          court_rank: string
          created_at?: string
          station_name: string
        }
        Update: {
          active?: boolean
          code?: string
          county?: string
          court_rank?: string
          created_at?: string
          station_name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string
          category: Database["public"]["Enums"]["document_category"] | null
          created_at: string
          file_size: number
          id: string
          mime_type: string
          ocr_status: Database["public"]["Enums"]["ocr_status"] | null
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string
          file_size: number
          id?: string
          mime_type: string
          ocr_status?: Database["public"]["Enums"]["ocr_status"] | null
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string
          file_size?: number
          id?: string
          mime_type?: string
          ocr_status?: Database["public"]["Enums"]["ocr_status"] | null
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      file_movements: {
        Row: {
          actual_return_date: string | null
          case_id: string
          checked_out_by: string | null
          created_at: string
          destination_office: string
          expected_return_date: string
          id: string
          purpose: string
          status: Database["public"]["Enums"]["movement_status"]
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          case_id: string
          checked_out_by?: string | null
          created_at?: string
          destination_office: string
          expected_return_date: string
          id?: string
          purpose: string
          status?: Database["public"]["Enums"]["movement_status"]
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          case_id?: string
          checked_out_by?: string | null
          created_at?: string
          destination_office?: string
          expected_return_date?: string
          id?: string
          purpose?: string
          status?: Database["public"]["Enums"]["movement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_movements_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      memos: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          reference: string
          title: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          reference: string
          title: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          reference?: string
          title?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          priority: string
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          priority?: string
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          is_active: boolean
          notification_preferences: Json
          pj_number: string | null
          role: Database["public"]["Enums"]["court_user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          notification_preferences?: Json
          pj_number?: string | null
          role?: Database["public"]["Enums"]["court_user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          notification_preferences?: Json
          pj_number?: string | null
          role?: Database["public"]["Enums"]["court_user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      registry_requests: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          request_type: string
          requester: string
          status: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          request_type: string
          requester: string
          status?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          request_type?: string
          requester?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["court_user_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      archive_location_display_path: {
        Args: { p_location_id: string }
        Returns: string
      }
      count_documents_for_cases: {
        Args: { p_case_ids: string[] }
        Returns: {
          case_id: string
          document_count: number
        }[]
      }
      ensure_profile_for_current_user: {
        Args: never
        Returns: {
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          is_active: boolean
          notification_preferences: Json
          pj_number: string | null
          role: Database["public"]["Enums"]["court_user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fetch_dashboard_data: { Args: never; Returns: Json }
      fetch_report_data: {
        Args: {
          p_case_family?: string
          p_case_type_id?: number
          p_court_level?: string
          p_from?: string
          p_to?: string
        }
        Returns: Json
      }
      get_user_role: { Args: never; Returns: string }
      list_archive_stored_cases: {
        Args: { result_limit?: number; result_offset?: number }
        Returns: {
          archive_code: string
          case_category_code: string
          case_category_name: string
          case_family: string
          case_id: string
          case_number: string
          case_type: string
          case_type_id: number
          court_division: string
          court_station: string
          defendant: string
          filed_date: string
          judge: string
          matching_total: number
          plaintiff: string
          shelf_location: string
          status: Database["public"]["Enums"]["case_status"]
          storage_path: string
          title: string
          year: number
        }[]
      }
      list_audit_logs_for_case: {
        Args: {
          p_case_id: string
          p_case_number: string
          result_limit?: number
          result_offset?: number
        }
        Returns: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_documents_for_cases: {
        Args: { p_case_ids: string[]; p_limit_per_case?: number }
        Returns: {
          case_id: string
          category: string
          created_at: string
          doc_id: string
          file_size: number
          mime_type: string
          ocr_status: string
          title: string
          uploaded_by: string
        }[]
      }
      lookup_case_for_scan: {
        Args: { scan_code: string }
        Returns: {
          archive_code: string
          case_category_code: string
          case_family: string
          case_number: string
          case_type: string
          case_type_id: number
          closed_date: string
          court: string
          court_division: string
          court_station: string
          created_at: string
          created_by: string
          defendant: string
          description: string
          filed_date: string
          id: string
          is_missing: boolean
          judge: string
          location_id: string
          matched_by: string
          notes: string
          plaintiff: string
          qr_barcode: string
          shelf_location: string
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          year: number
        }[]
      }
      search_cases: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_query: string
        }
        Returns: {
          archive_code: string | null
          case_category_code: string | null
          case_family: string | null
          case_number: string
          case_type: string | null
          case_type_id: number | null
          closed_date: string | null
          court: string
          court_division: string | null
          court_station: string | null
          created_at: string
          created_by: string | null
          defendant: string | null
          description: string | null
          filed_date: string | null
          id: string
          is_missing: boolean | null
          judge: string | null
          location_id: string | null
          notes: string | null
          plaintiff: string | null
          qr_barcode: string | null
          shelf_location: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          year: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_cases_count: { Args: { search_query: string }; Returns: number }
      user_can_edit_cases: { Args: never; Returns: boolean }
      user_can_manage_archive: { Args: never; Returns: boolean }
      user_can_manage_registry: { Args: never; Returns: boolean }
      user_can_manage_users: { Args: never; Returns: boolean }
      user_can_move_files: { Args: never; Returns: boolean }
      user_can_upload_docs: { Args: never; Returns: boolean }
      user_can_view_audit: { Args: never; Returns: boolean }
      user_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      audit_action:
        | "login"
        | "case_created"
        | "case_updated"
        | "file_moved"
        | "file_archived"
        | "document_uploaded"
        | "file_missing"
        | "role_changed"
        | "file_checked_out"
        | "file_checked_in"
        | "case_deleted"
        | "user_email_updated"
        | "registry_request_created"
        | "registry_request_updated"
        | "document_deleted"
        | "file_scanned"
        | "user_created"
        | "user_deleted"
      case_status: "open" | "closed" | "archived" | "missing" | "pending_return"
      court_user_role:
        | "admin"
        | "ict_officer"
        | "registry_clerk"
        | "archivist"
        | "deputy_registrar"
        | "judge"
        | "magistrate"
      document_category:
        | "Pleadings"
        | "Proceedings"
        | "Rulings"
        | "Orders"
        | "Correspondence"
        | "Exhibits"
      location_level: "room" | "bay" | "rack" | "shelf" | "box"
      movement_status: "checked_out" | "in_transit" | "returned" | "overdue"
      ocr_status: "pending" | "processing" | "complete" | "failed"
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
    Enums: {
      audit_action: [
        "login",
        "case_created",
        "case_updated",
        "file_moved",
        "file_archived",
        "document_uploaded",
        "file_missing",
        "role_changed",
        "file_checked_out",
        "file_checked_in",
        "case_deleted",
        "user_email_updated",
        "registry_request_created",
        "registry_request_updated",
        "document_deleted",
        "file_scanned",
        "user_created",
        "user_deleted",
      ],
      case_status: ["open", "closed", "archived", "missing", "pending_return"],
      court_user_role: [
        "admin",
        "ict_officer",
        "registry_clerk",
        "archivist",
        "deputy_registrar",
        "judge",
        "magistrate",
      ],
      document_category: [
        "Pleadings",
        "Proceedings",
        "Rulings",
        "Orders",
        "Correspondence",
        "Exhibits",
      ],
      location_level: ["room", "bay", "rack", "shelf", "box"],
      movement_status: ["checked_out", "in_transit", "returned", "overdue"],
      ocr_status: ["pending", "processing", "complete", "failed"],
    },
  },
} as const
