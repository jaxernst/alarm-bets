import { PushSubscription } from "web-push";

export type ScheduleKey = `0x${string}-${string}`;

export type RowSchema = {
  alarm_time: number;
  timezone_offset: number;
  alarm_id: number;
  user_address: `0x${string}`;
  alarm_days: number[];
  subscription: PushSubscription;
};
