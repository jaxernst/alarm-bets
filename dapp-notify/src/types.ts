import { Database } from "../../alarm-bets-db";

export type EvmAddress = `0x${string}`;

export type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

export type NotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];
