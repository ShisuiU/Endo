// Types alignés à la main sur supabase/migrations/0001_init.sql.
// (Écrits manuellement plutôt que générés par `supabase gen types`, faute
// de projet Supabase relié à cette session — à régénérer une fois le
// projet créé : voir CLAUDE.md § Supabase.)

export type DailyEntry = {
  id: string;
  user_id: string;
  entry_date: string; // ISO date (YYYY-MM-DD)
  had_crisis: boolean;
  crisis_intensity: number | null;
  pain_score: number | null;
  sleep_score: number | null;
  mood_score: number | null;
  energy_score: number | null;
  medication_taken: boolean;
  medication_notes: string | null;
  foods: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyEntryInput = Partial<
  Omit<DailyEntry, "id" | "user_id" | "created_at" | "updated_at">
> & { entry_date: string };

export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      daily_entries: {
        Row: DailyEntry;
        Insert: Partial<DailyEntry> & { user_id: string; entry_date: string };
        Update: Partial<DailyEntry>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
