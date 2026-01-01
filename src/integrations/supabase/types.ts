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
      entries: {
        Row: {
          id: string
          user_id: string
          date: string      // La fameuse date unique
          content: string | null
          mood_score: number | null
          hashtags: string[] | null
        }
        Insert: {
          id?: string
          user_id?: string
          date: string
          content?: string | null
          mood_score?: number | null
          hashtags?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          content?: string | null
          mood_score?: number | null
          hashtags?: string[] | null
        }
      }
      profiles: {
        Row: {
          id: string        // L'ID correspond à l'Auth User ID
          username: string | null
          avatar_url: string | null
          display_name: string | null
          background_color: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          display_name?: string | null
          background_color?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          display_name?: string | null
          background_color?: string | null
        }
      }
    }
  }
}