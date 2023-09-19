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
      alarm_notifications: {
        Row: {
          alarm_days: string | null
          alarm_id: number
          alarm_time: number
          submission_window: number
          subscription: Json | null
          timezone_offset: number | null
          user_address: string
        }
        Insert: {
          alarm_days?: string | null
          alarm_id?: number
          alarm_time: number
          submission_window?: number
          subscription?: Json | null
          timezone_offset?: number | null
          user_address: string
        }
        Update: {
          alarm_days?: string | null
          alarm_id?: number
          alarm_time?: number
          submission_window?: number
          subscription?: Json | null
          timezone_offset?: number | null
          user_address?: string
        }
        Relationships: []
      }
      user_alarms: {
        Row: {
          alarm_address: string | null
          alarm_time: number | null
          id: number
          user_address: string
        }
        Insert: {
          alarm_address?: string | null
          alarm_time?: number | null
          id?: number
          user_address: string
        }
        Update: {
          alarm_address?: string | null
          alarm_time?: number | null
          id?: number
          user_address?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string
        }
        Insert: {
          address: string
        }
        Update: {
          address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
