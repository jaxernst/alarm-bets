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
          device_id: string
          subscription: Json
          user_address: string
        }
        Insert: {
          device_id: string
          subscription: Json
          user_address: string
        }
        Update: {
          device_id?: string
          subscription?: Json
          user_address?: string
        }
        Relationships: []
      }
      partner_alarms: {
        Row: {
          alarm_address: string
          alarm_days: string
          alarm_id: string
          alarm_time: number
          other_player: string
          submission_window: number
          timezone_offset: number
          user_address: string
        }
        Insert: {
          alarm_address: string
          alarm_days: string
          alarm_id: string
          alarm_time: number
          other_player: string
          submission_window: number
          timezone_offset: number
          user_address: string
        }
        Update: {
          alarm_address?: string
          alarm_days?: string
          alarm_id?: string
          alarm_time?: number
          other_player?: string
          submission_window?: number
          timezone_offset?: number
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
