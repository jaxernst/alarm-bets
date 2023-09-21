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
          alarm_days: string
          alarm_id: number
          alarm_time: number
          device_id: string
          submission_window: number
          subscription: Json
          timezone_offset: number
          user_address: string
        }
        Insert: {
          alarm_days?: string
          alarm_id?: number
          alarm_time: number
          device_id: string
          submission_window?: number
          subscription: Json
          timezone_offset: number
          user_address: string
        }
        Update: {
          alarm_days?: string
          alarm_id?: number
          alarm_time?: number
          device_id?: string
          submission_window?: number
          subscription?: Json
          timezone_offset?: number
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
