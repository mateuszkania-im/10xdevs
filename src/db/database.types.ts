export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      config_data: {
        Row: {
          arrival_date: string;
          departure_date: string;
          id: string;
          note_id: string;
          num_days: number;
          num_people: number;
          destination?: string;
          travel_style?: string;
          budget?: string;
          interests?: string[];
        };
        Insert: {
          arrival_date: string;
          departure_date: string;
          id?: string;
          note_id: string;
          num_days: number;
          num_people: number;
          destination?: string;
          travel_style?: string;
          budget?: string;
          interests?: string[];
        };
        Update: {
          arrival_date?: string;
          departure_date?: string;
          id?: string;
          note_id?: string;
          num_days?: number;
          num_people?: number;
          destination?: string;
          travel_style?: string;
          budget?: string;
          interests?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "config_data_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: true;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      note_tags: {
        Row: {
          created_at: string;
          id: string;
          note_id: string;
          tag_name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          note_id: string;
          tag_name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note_id?: string;
          tag_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          is_config_note: boolean;
          position: number;
          priority: number;
          project_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          is_config_note?: boolean;
          position: number;
          priority?: number;
          project_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          is_config_note?: boolean;
          position?: number;
          priority?: number;
          project_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "travel_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      travel_plans: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          is_outdated: boolean;
          project_id: string;
          updated_at: string;
          version_name: string;
        };
        Insert: {
          content: Json;
          created_at?: string;
          id?: string;
          is_outdated?: boolean;
          project_id: string;
          updated_at?: string;
          version_name: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          is_outdated?: boolean;
          project_id?: string;
          updated_at?: string;
          version_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "travel_plans_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "travel_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      travel_projects: {
        Row: {
          created_at: string;
          id: string;
          last_notes_update_at: string;
          name: string;
          updated_at: string;
          user_id: string;
          has_config_note: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_notes_update_at?: string;
          name: string;
          updated_at?: string;
          user_id: string;
          has_config_note?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_notes_update_at?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
          has_config_note?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_note_with_tags: {
        Args: {
          p_project_id: string;
          p_title: string;
          p_content: string | null;
          p_position: number;
          p_priority: number;
          p_is_config_note: boolean;
          p_tags: string[];
        };
        Returns: { id: string };
      };
      create_config_note: {
        Args: {
          p_project_id: string;
          p_title: string;
          p_content: string | null;
          p_priority: number;
          p_arrival_date: string;
          p_departure_date: string;
          p_num_days: number;
          p_num_people: number;
          p_tags: string[];
          p_destination?: string;
          p_travel_style?: string;
          p_budget?: string;
          p_interests?: string[];
          p_accommodation_address?: string;
        };
        Returns: string;
      };
      update_config_note: {
        Args: {
          p_note_id: string;
          p_title?: string;
          p_content?: string | null;
          p_priority?: number;
          p_arrival_date?: string;
          p_departure_date?: string;
          p_num_days?: number;
          p_num_people?: number;
          p_tags?: string[];
          p_destination?: string;
          p_travel_style?: string;
          p_budget?: string;
          p_interests?: string[];
          p_accommodation_address?: string;
        };
        Returns: Record<string, unknown>;
      };
      reorder_notes: {
        Args: {
          p_note_positions: { id: string; position: number }[];
        };
        Returns: Record<string, unknown>;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
