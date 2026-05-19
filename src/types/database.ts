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
      cases: {
        Row: {
          case_number: string;
          closed_date: string | null;
          court: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          filed_date: string | null;
          id: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          case_number: string;
          closed_date?: string | null;
          court?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          filed_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["case_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          case_number?: string;
          closed_date?: string | null;
          court?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          filed_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["case_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          case_id: string;
          created_at: string;
          file_size: number;
          id: string;
          mime_type: string;
          storage_path: string;
          title: string;
          uploaded_by: string | null;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          file_size: number;
          id?: string;
          mime_type: string;
          storage_path: string;
          title: string;
          uploaded_by?: string | null;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          storage_path?: string;
          title?: string;
          uploaded_by?: string | null;
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
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"];
          target_user_id: string;
        };
        Returns: undefined;
      };
      get_user_role: { Args: Record<string, never>; Returns: string };
      search_cases: {
        Args: { search_query: string };
        Returns: Database["public"]["Tables"]["cases"]["Row"][];
      };
    };
    Enums: {
      case_status: "open" | "closed" | "archived";
      user_role: "admin" | "staff" | "readonly";
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
export type UserRole = Enums<"user_role">;
export type CaseStatus = Enums<"case_status">;
