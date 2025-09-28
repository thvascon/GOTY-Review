export type Database = {
  public: {
    Tables: {
      sections: {
        Row: {
          id: number;
          title: string;
        };
        Insert: {
          id?: number;
          title: string;
        };
        Update: {
          id?: number;
          title?: string;
        };
      };
    };
    Views: {};
    Functions: {};
  };
};