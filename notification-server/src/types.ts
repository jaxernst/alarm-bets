import { PushSubscription } from "web-push";
import { Database } from "../../database";

export type ScheduleKey = `0x${string}-${string}`;

export type RowSchema =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];
