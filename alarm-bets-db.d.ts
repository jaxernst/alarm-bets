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
          subscription: Json | null
          user_address: string
        }
        Insert: {
          device_id: string
          subscription?: Json | null
          user_address: string
        }
        Update: {
          device_id?: string
          subscription?: Json | null
          user_address?: string
        }
        Relationships: []
      }
      dapp_sync_status: {
        Row: {
          alarm_type: string
          last_block_queried: number | null
        }
        Insert: {
          alarm_type: string
          last_block_queried?: number | null
        }
        Update: {
          alarm_type?: string
          last_block_queried?: number | null
        }
        Relationships: []
      }
      partner_alarms: {
        Row: {
          alarm_address: string
          alarm_days: string
          alarm_id: number
          alarm_time: number
          block_last_updated_at: number | null
          player1: string
          player1_timezone: number | null
          player2: string
          player2_timezone: number | null
          status: number
          submission_window: number
        }
        Insert: {
          alarm_address: string
          alarm_days: string
          alarm_id: number
          alarm_time: number
          block_last_updated_at?: number | null
          player1: string
          player1_timezone?: number | null
          player2: string
          player2_timezone?: number | null
          status: number
          submission_window: number
        }
        Update: {
          alarm_address?: string
          alarm_days?: string
          alarm_id?: number
          alarm_time?: number
          block_last_updated_at?: number | null
          player1?: string
          player1_timezone?: number | null
          player2?: string
          player2_timezone?: number | null
          status?: number
          submission_window?: number
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
