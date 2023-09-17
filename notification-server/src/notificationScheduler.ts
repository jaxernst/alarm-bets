import { systemTimestamp, timeOfDay } from "./time";
import { supabaseClient } from "./server";
import { RowSchema, ScheduleKey } from "./types";
import { sendNotification } from "web-push";

const schedules = new Set<ScheduleKey>();

function getTimeUntilNextAlarm(
  alarmTimeSeconds: number,
  timezoneOffsetHours: number,
  alarmDays: number[]
) {
  const now = timeOfDay(systemTimestamp());
  if (now > alarmTimeSeconds) {
    console.warn("Alarm time is in the past, skipping");
    return;
  }

  return alarmTimeSeconds - now;
}

async function startAlarmNotificationSchedule(row: RowSchema) {
  // Temp for testing: timeout until the next alarm time for a one-off notification

  const timeout = getTimeUntilNextAlarm(
    row.alarm_time,
    row.timezone_offset,
    row.alarm_days
  );

  if (!timeout) {
    return;
  }

  setTimeout(async () => {
    // Send the notification

    // Delete db entry (temp)
    const { data, error } = await supabaseClient
      .from("alarm_notifications")
      .delete()
      .match({ user_address: row.user_address, alarm_id: row.alarm_id });

    if (error) {
      console.warn("Error deleting alarm notification: ", error);
    }

    console.log(
      "Send result:",
      await sendNotification(
        row.subscription,
        JSON.stringify({
          title: "Upcoming Alarm",
          body: "Your alarm is due in 15 minutes!",
        })
      )
    );
  }, timeout * 1000);
}

export function runScheduler(
  getNotificationSubscriptions: () => Promise<RowSchema[]>
) {
  // TODO: Instead of running and interval, the server should listen for db updates
  // to start and stop notification schedules
  setInterval(async () => {
    const subscriptions = await getNotificationSubscriptions();

    for (let row of subscriptions) {
      const scheduleKey =
        `0x${row.user_address}-${row.alarm_id}-${row.alarm_time}` as const;

      // If the schedule is not already set, add it to the schedules set and schedule the alarm notification
      if (!schedules.has(scheduleKey)) {
        schedules.add(scheduleKey);
        startAlarmNotificationSchedule(row);
        console.log("New notification schedule created:", row);
      }
    }

    // If there are new entries, add them to the schedules set and scehdule the alarm notification
  }, 5000);
}
