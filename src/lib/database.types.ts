// Generated Supabase types (simplified for this project)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      logs: {
        Row: {
          id: string
          created_at: string
          logged_at: string
          logged_by: string
          log_type: string
          side: string | null
          duration_minutes: number | null
          amount_ml: number | null
          nappy_type: string | null
          weight_grams: number | null
          note: string | null
          needs_review: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          logged_at?: string
          logged_by: string
          log_type: string
          side?: string | null
          duration_minutes?: number | null
          amount_ml?: number | null
          nappy_type?: string | null
          weight_grams?: number | null
          note?: string | null
          needs_review?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          logged_at?: string
          logged_by?: string
          log_type?: string
          side?: string | null
          duration_minutes?: number | null
          amount_ml?: number | null
          nappy_type?: string | null
          weight_grams?: number | null
          note?: string | null
          needs_review?: boolean
        }
      }
    }
  }
}
