export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      alarm_notifications: {
        Row: {
          device_id: string;
          subscription: Json | null;
          user_address: string;
        };
        Insert: {
          device_id: string;
          subscription?: Json | null;
          user_address: string;
        };
        Update: {
          device_id?: string;
          subscription?: Json | null;
          user_address?: string;
        };
        Relationships: [];
      };
      dapp_sync_status: {
        Row: {
          alarm_type: string;
          last_block_queried: number | null;
        };
        Insert: {
          alarm_type: string;
          last_block_queried?: number | null;
        };
        Update: {
          alarm_type?: string;
          last_block_queried?: number | null;
        };
        Relationships: [];
      };
      partner_alarms: {
        Row: {
          alarm_address: string;
          alarm_days: string;
          alarm_id: number;
          alarm_time: number;
          player1: string;
          player2: string;
          status: number;
          submission_window: number;
          player1_timezone?: number;
          player2_timezone?: number;
        };
        Insert: {
          alarm_address: string;
          alarm_days: string;
          alarm_id: number;
          alarm_time: number;
          player1: string;
          player2: string;
          status: number;
          submission_window: number;
          player1_timezone?: number;
          player2_timezone?: number;
        };
        Update: {
          alarm_address?: string;
          alarm_days?: string;
          alarm_id?: number;
          alarm_time?: number;
          player1?: string;
          player2?: string;
          status?: number;
          submission_window?: number;
          player1_timezone?: number;
          player2_timezone?: number;
        };
        Relationships: [];
      };
      users: {
        Row: {
          address: string;
        };
        Insert: {
          address: string;
        };
        Update: {
          address?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
