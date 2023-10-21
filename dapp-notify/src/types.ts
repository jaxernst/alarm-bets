import { Database } from "../../alarm-bets-db";

export type EvmAddress = `0x${string}`;

export type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

export type NotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

export type AlarmId = number;

export type Alarm = {
  alarmId: AlarmId;
  alarmTime: number; // seconds after midnight in local timezone
  alarmDays: number[]; // 1-7 (Sunday-Saturday)
  timezoneOffset: number; // seconds from UTC
  submissionWindow: number; // seconds
};
