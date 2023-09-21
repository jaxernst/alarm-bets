import { getTimeUntilNextAlarm, systemTimestamp, timeOfDay } from "./time";
import { supabaseClient } from "./server";
import { RowSchema, ScheduleKey } from "./types";
import { sendNotification, type PushSubscription } from "web-push";

const schedules: Record<ScheduleKey, NodeJS.Timeout> = {};

const scheduleKey = (row: RowSchema): ScheduleKey =>
  `0x${row.user_address}-${row.alarm_id}-${row.device_id}` as const;

function parseAlarmDays(alarmDays: string) {
  return alarmDays.split(",").map((day) => parseInt(day));
}

function cancelNotificationSchedule(key: ScheduleKey) {
  if (key in schedules) {
    clearTimeout(schedules[key]);
    delete schedules[key];
    console.log("Notification schedule canceled for", key);
  }
}

async function runNotificationSchedule(row: RowSchema) {
  const timeTillNext = getTimeUntilNextAlarm(
    row.alarm_time,
    row.timezone_offset,
    parseAlarmDays(row.alarm_days)
  );

  const notifyTimeout = timeTillNext - row.submission_window;

  console.log("Next notification in ", notifyTimeout / 60, "minutes");

  schedules[scheduleKey(row)] = setTimeout(async () => {
    const res = await sendNotification(
      row.subscription as unknown as PushSubscription,
      JSON.stringify({
        title: "Upcoming Alarm",
        body: "Your alarm submission window is open. Wake up and submit your alarm!",
      })
    );

    if (res.statusCode === 201) {
      console.log("Notification sent successfully");
    } else {
      console.error("Failed to send notification", res);
    }

    runNotificationSchedule(row);
  }, notifyTimeout * 1000);
}

export async function runScheduler() {
  // Fetch initial notification subscription data
  const { data, error } = await supabaseClient
    .from("alarm_notifications")
    .select("*");

  if (error) {
    throw new Error(
      "Error fetching alarm notifications from Supabase: " + error
    );
  }

  // Populate schedules set with initial notification subscriptions
  for (let row of data) {
    const key = scheduleKey(row);
    // If the schedule is not already set, add it to the schedules set and schedule the alarm notification
    console.log("Starting alarm notification schedule for", key);
    runNotificationSchedule(row);
  }

  const insertNotifChannel = supabaseClient
    .channel("schema-db-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        const key = scheduleKey(payload.new as RowSchema);
        // If the schedule is not already set, add it to the schedules set and schedule the alarm notification
        if (key in schedules) {
          console.warn("Attempted to add duplicate schedule", key);
          return;
        }

        console.log("Starting alarm notification schedule for", key);
        runNotificationSchedule(payload.new as RowSchema);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        console.log(payload);
        const key = scheduleKey(payload.old as RowSchema);
        if (!(key in schedules)) {
          console.warn("Attempted to delete non-existent schedule", key);
          return;
        }

        cancelNotificationSchedule(key);
      }
    )
    .subscribe();
}
