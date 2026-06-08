export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      archive_locations: {
        Row: {
          id: string;
          parent_id: string | null;
          level: Database["public"]["Enums"]["location_level"];
          code: string;
          label: string;
          capacity: number;
          occupied_count: number;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          level: Database["public"]["Enums"]["location_level"];
          code: string;
          label: string;
          capacity?: number;
          occupied_count?: number;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          level?: Database["public"]["Enums"]["location_level"];
          code?: string;
          label?: string;
          capacity?: number;
          occupied_count?: number;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "archive_locations_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "archive_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          entity_type: string;
          entity_id: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          entity_type: string;
          entity_id: string;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: Database["public"]["Enums"]["audit_action"];
          entity_type?: string;
          entity_id?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      broadcasts: {
        Row: {
          id: string;
          title: string;
          message: string;
          author_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          author_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          title: string;
          court: string;
          status: Database["public"]["Enums"]["case_status"];
          filed_date: string | null;
          closed_date: string | null;
          description: string | null;
          case_type: string | null;
          court_station: string | null;
          court_division: string | null;
          year: number | null;
          plaintiff: string | null;
          defendant: string | null;
          judge: string | null;
          archive_code: string | null;
          shelf_location: string | null;
          location_id: string | null;
          qr_barcode: string | null;
          notes: string | null;
          is_missing: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number: string;
          title: string;
          court?: string;
          status?: Database["public"]["Enums"]["case_status"];
          filed_date?: string | null;
          closed_date?: string | null;
          description?: string | null;
          case_type?: string | null;
          court_station?: string | null;
          court_division?: string | null;
          year?: number | null;
          plaintiff?: string | null;
          defendant?: string | null;
          judge?: string | null;
          archive_code?: string | null;
          shelf_location?: string | null;
          location_id?: string | null;
          qr_barcode?: string | null;
          notes?: string | null;
          is_missing?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          title?: string;
          court?: string;
          status?: Database["public"]["Enums"]["case_status"];
          filed_date?: string | null;
          closed_date?: string | null;
          description?: string | null;
          case_type?: string | null;
          court_station?: string | null;
          court_division?: string | null;
          year?: number | null;
          plaintiff?: string | null;
          defendant?: string | null;
          judge?: string | null;
          archive_code?: string | null;
          shelf_location?: string | null;
          location_id?: string | null;
          qr_barcode?: string | null;
          notes?: string | null;
          is_missing?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cases_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "archive_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          category: Database["public"]["Enums"]["document_category"] | null;
          ocr_status: Database["public"]["Enums"]["ocr_status"] | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          title: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          category?: Database["public"]["Enums"]["document_category"] | null;
          ocr_status?: Database["public"]["Enums"]["ocr_status"] | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          title?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          category?: Database["public"]["Enums"]["document_category"] | null;
          ocr_status?: Database["public"]["Enums"]["ocr_status"] | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      file_movements: {
        Row: {
          id: string;
          case_id: string;
          checked_out_by: string | null;
          destination_office: string;
          purpose: string;
          expected_return_date: string;
          actual_return_date: string | null;
          status: Database["public"]["Enums"]["movement_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          checked_out_by?: string | null;
          destination_office: string;
          purpose: string;
          expected_return_date: string;
          actual_return_date?: string | null;
          status?: Database["public"]["Enums"]["movement_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          checked_out_by?: string | null;
          destination_office?: string;
          purpose?: string;
          expected_return_date?: string;
          actual_return_date?: string | null;
          status?: Database["public"]["Enums"]["movement_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "file_movements_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      memos: {
        Row: {
          id: string;
          title: string;
          reference: string;
          author_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          reference: string;
          author_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          reference?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          title: string;
          body: string;
          author_id: string | null;
          priority: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          author_id?: string | null;
          priority?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          author_id?: string | null;
          priority?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          pj_number: string | null;
          department: string | null;
          role: Database["public"]["Enums"]["court_user_role"];
          is_active: boolean;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          pj_number?: string | null;
          department?: string | null;
          role?: Database["public"]["Enums"]["court_user_role"];
          is_active?: boolean;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          pj_number?: string | null;
          department?: string | null;
          role?: Database["public"]["Enums"]["court_user_role"];
          is_active?: boolean;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      registry_requests: {
        Row: {
          id: string;
          case_id: string | null;
          request_type: string;
          requester: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          request_type: string;
          requester: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string | null;
          request_type?: string;
          requester?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registry_requests_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["court_user_role"];
          target_user_id: string;
        };
        Returns: undefined;
      };
      ensure_profile_for_current_user: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      get_user_role: { Args: Record<string, never>; Returns: string };
      fetch_dashboard_data: {
        Args: Record<string, never>;
        Returns: Json;
      };
      fetch_report_data: {
        Args: Record<string, never>;
        Returns: Json;
      };
      search_cases: {
        Args: {
          result_limit?: number;
          result_offset?: number;
          search_query: string;
        };
        Returns: Database["public"]["Tables"]["cases"]["Row"][];
      };
      search_cases_count: {
        Args: {
          search_query: string;
        };
        Returns: number;
      };
      list_archive_stored_cases: {
        Args: {
          result_limit?: number;
          result_offset?: number;
        };
        Returns: {
          case_id: string;
          case_number: string;
          title: string;
          case_type: string | null;
          court_station: string | null;
          court_division: string | null;
          year: number | null;
          plaintiff: string | null;
          defendant: string | null;
          judge: string | null;
          status: Database["public"]["Enums"]["case_status"];
          archive_code: string | null;
          shelf_location: string | null;
          filed_date: string | null;
          storage_path: string | null;
          matching_total: number;
        }[];
      };
      list_audit_logs_for_case: {
        Args: {
          p_case_id: string;
          p_case_number: string;
          result_limit?: number;
          result_offset?: number;
        };
        Returns: Database["public"]["Tables"]["audit_logs"]["Row"][];
      };
      list_documents_for_cases: {
        Args: {
          p_case_ids: string[];
          p_limit_per_case?: number;
        };
        Returns: Array<{
          case_id: string;
          doc_id: string;
          title: string;
          category: string | null;
          ocr_status: string | null;
          uploaded_by: string | null;
          file_size: number;
          mime_type: string;
          created_at: string;
        }>;
      };
      count_documents_for_cases: {
        Args: {
          p_case_ids: string[];
        };
        Returns: Array<{
          case_id: string;
          document_count: number;
        }>;
      };
    };
    Enums: {
      audit_action:
        | "login"
        | "case_created"
        | "case_updated"
        | "case_deleted"
        | "file_moved"
        | "file_archived"
        | "document_uploaded"
        | "document_deleted"
        | "file_missing"
        | "role_changed"
        | "file_checked_out"
        | "file_checked_in"
        | "user_email_updated"
        | "registry_request_created"
        | "registry_request_updated";
      case_status: "open" | "closed" | "archived" | "missing" | "pending_return";
      court_user_role:
        | "admin"
        | "ict_officer"
        | "registry_clerk"
        | "archivist"
        | "deputy_registrar"
        | "judge";
      document_category:
        | "Pleadings"
        | "Proceedings"
        | "Rulings"
        | "Orders"
        | "Correspondence"
        | "Exhibits";
      location_level: "room" | "bay" | "rack" | "shelf" | "box";
      movement_status: "checked_out" | "in_transit" | "returned" | "overdue";
      ocr_status: "pending" | "processing" | "complete" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type CaseRow = Tables<"cases">;
export type DocumentRow = Tables<"documents">;
export type ProfileRow = Tables<"profiles">;
export type FileMovementRow = Tables<"file_movements">;
export type AuditLogRow = Tables<"audit_logs">;
export type ArchiveLocationRow = Tables<"archive_locations">;
export type RegistryRequestRow = Tables<"registry_requests">;
export type NoticeRow = Tables<"notices">;
export type MemoRow = Tables<"memos">;
export type BroadcastRow = Tables<"broadcasts">;
export type CourtUserRole = Enums<"court_user_role">;
export type CaseStatus = Enums<"case_status">;

/** @deprecated Use CourtUserRole instead */
export type UserRole = CourtUserRole;
