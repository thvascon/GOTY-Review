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
      games: {
        Row: {
          cover_image: string | null;
          created_at: string;
          id: string;
          name: string;
          section_id: string | null;
          group_id: string | null;
          genres: string[] | null;
        };
        Insert: {
          cover_image?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          section_id?: string | null;
          group_id?: string | null;
          genres?: string[] | null;
        };
        Update: {
          cover_image?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          section_id?: string | null;
          group_id?: string | null;
          genres?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      };
      people: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string | null;
          avatar_url?: string | null;
          group_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string | null;
          group_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string | null;
          group_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "people_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "people_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          game_id: string | null;
          id: number;
          person_id: string | null;
          played: boolean | null;
          rating: number;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: number;
          person_id?: string | null;
          played?: boolean | null;
          rating: number;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: number;
          person_id?: string | null;
          played?: boolean | null;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          }
        ];
      };
      sections: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          group_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title: string;
          group_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          group_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sections_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      };
      activities: {
        Row: {
          id: string;
          created_at: string;
          person_id: string;
          activity_type: string;
          game_id: string | null;
          rating: number | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          person_id: string;
          activity_type: string;
          game_id?: string | null;
          rating?: number | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          person_id?: string;
          activity_type?: string;
          game_id?: string | null;
          rating?: number | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "activities_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;
