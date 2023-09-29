import { getTimeUntilNextAlarm } from "../time";
import { sendNotification, type PushSubscription } from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { supabaseClient } from "../setup";

// A user has a schedule for each alarm.

/**
 * -> New row added to alarm_notifications table
 *  -> If user does not have an alarm scheduler, start one
 *  -> If user does have an alarm scheduler active, add the new device to the list
 */

type EvmAddress = `0x${string}`;
type AlarmId = number;
type ScheduleKey = `${EvmAddress}-${AlarmId}`;
type AlarmNotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

type Alarm = Database["public"]["Tables"]["partner_alarms"]["Row"];

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
};

type AlarmNotificationState = {
  scheduleTimers: Record<AlarmId, NodeJS.Timeout>;
  deviceSubscriptions: DeviceSubscription[];
};

const notificationState = new Map<EvmAddress, AlarmNotificationState>();

const scheduleKey = (user: EvmAddress, alarmId: number): ScheduleKey =>
  `${user}-${alarmId}` as const;

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

async function onNotificationDue(subscription: PushSubscription) {
  const res = await sendNotification(
    subscription,
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
}

async function scheduleNext(
  {
    alarmTime,
    alarmDays,
    submissionWindow,
    timezoneOffset,
    subscription,
  }: AlarmNotificationRow,
  onTimerSet: (timer: NodeJS.Timeout) => void
) {
  const timeTillNextAlarm = getTimeUntilNextAlarm(
    al,
    row.timezone_offset,
    parseAlarmDays(row.alarm_days)
  );

  if (timeTillNextAlarm <= row.submission_window) {
    // If time untill next alarm is less then the submission window, reschedule after the
    // alarm time has passed to get the next alarm time
    console.log(
      "WARNING: Waiting for submission window to close before scheduling next notification"
    );
    setTimeout(() => scheduleNext(row), (timeTillNextAlarm + 1) * 1000);
    return;
  }

  const notifyTimeout = timeTillNextAlarm - row.submission_window;
  console.log("Next notification in ", notifyTimeout / 60, "minutes");

  const timer = setTimeout(async () => {
    onNotificationDue(row.subscription as unknown as PushSubscription);

    // After sending the notification, wait for the submission window to close
    // (when alarm is due) and then schedule the next notification
    // - Add a buffer to correct for any chain clock latency
    setTimeout(() => scheduleNext(row), (row.submission_window + 10) * 1000);
  }, notifyTimeout * 1000);

  onTimerSet(timer);
}

async function getActiveAlarms(user: EvmAddress) {
  /*const { data, error } = await supabaseClient
    .from("partner_alarms")
    .select("*")
    .eq("user_address", user)
    .eq("status", AlarmStatus.ACTIVE);

  if (error) {
    throw new Error(
      "Error fetching alarm notifications from Supabase: " + error
    );
  } */

  return [] as any[];
}

async function MakeAlarmScheduler(user: EvmAddress) {
  const timers: Record<AlarmId, NodeJS.Timeout> = {};
  const activeAlarms = await getActiveAlarms(user);

  for (const alarm of activeAlarms) {
    scheduleNext(alarm as any, (timer: NodeJS.Timeout) => {
      timers[alarm.id] = timer;
    });
  }

  // Listen to the db for changing alarm status
  // -> On status changed to active: start a schedule for that alarm
  // -> On status changed to anything but active: stop the schedule for that alarm

  return timers;
}

async function onNotificationsRowAdded(
  supabaseClient: SupabaseClient<Database>,
  row: AlarmNotificationRow
) {
  const user = row.user_address as EvmAddress;

  // If user has an alarm scheduler active, add the new device to the list
  const notificatio = userSubscriptions.get(user);
  if (!devices) {
    // If device is already in the device/subscription list, do nothing
    if (devices?.some((device) => device.deviceId === row.device_id)) return;

    // If device is not already in the device/subscription list, add it
    return userSubscriptions.set(user, [
      ...devices,
      {
        deviceId: row.device_id,
        subscription: row.subscription as unknown as PushSubscription,
      },
    ]);
  }

  const alarmScheduler = MakeAlarmScheduler(user, supabaseClient);
}

export async function runAlarmDeadlineNotificationSchedule(
  supabaseClient: SupabaseClient<Database>
) {
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
    // If notifications for this user are not already active, start them
    if (row.user_address in userSubscriptions) continue;
    console.log("Starting alarm notification schedule for", row.user_address);
    onNotificationsRowAdded(supabaseClient, row);
  }

  supabaseClient
    .channel("schema-db-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        const key = scheduleKey(payload.new as AlarmNotificationRow);
        // If the schedule is not already set, add it to the schedules set and schedule the alarm notification
        if (key in schedules) {
          console.warn("Attempted to add duplicate schedule", key);
          return;
        }

        console.log("Starting alarm notification schedule for", key);
        scheduleNext(payload.new as AlarmNotificationRow);
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
        const key = scheduleKey(payload.old as AlarmNotificationRow);
        if (!(key in schedules)) {
          console.warn("Attempted to delete non-existent schedule", key);
          return;
        }

        cancelNotificationSchedule(key);
      }
    )
    .subscribe();
}
