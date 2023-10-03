import { getTimeUntilNextAlarm } from "../time";
import { sendNotification, type PushSubscription } from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { supabaseClient } from "../setup";

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

type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
};

type AlarmNotificationState = {
  scheduleTimers: Record<AlarmId, NodeJS.Timeout>;
  deviceSubscriptions: DeviceSubscription[];
};

const notificationState = new Map<EvmAddress, AlarmNotificationState>();

function parseAlarmDays(alarmDays: string) {
  return alarmDays.split(",").map((day) => parseInt(day));
}

async function onNotificationDue(user: EvmAddress) {
  const devices = notificationState.get(user)?.deviceSubscriptions;
  if (!devices) {
    console.error("No ddevices found to notify", user);
    return new Error("No devices found");
  }

  for (const device of devices) {
    const res = await sendNotification(
      device.subscription,
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
}

async function scheduleNext(
  user: EvmAddress,
  alarm: {
    alarmTime: number;
    alarmDays: number[];
    timezoneOffset: number;
    submissionWindow: number;
  },
  onTimerSet: (timer: NodeJS.Timeout) => void
) {
  const timeTillNextAlarm = getTimeUntilNextAlarm(
    alarm.alarmTime,
    alarm.timezoneOffset,
    alarm.alarmDays
  );

  if (timeTillNextAlarm <= alarm.submissionWindow) {
    // If time untill next alarm is less then the submission window, reschedule after the
    // alarm time has passed to get the next alarm time
    console.log(
      "WARNING: Waiting for submission window to close before scheduling next notification"
    );
    setTimeout(
      () => scheduleNext(user, alarm, onTimerSet),
      (timeTillNextAlarm + 1) * 1000
    );
    return;
  }

  const notifyTimeout = timeTillNextAlarm - alarm.submissionWindow;
  console.log("Alarm notification due in ", notifyTimeout / 60, "minutes");

  const timer = setTimeout(async () => {
    onNotificationDue(user);

    // After sending the notification, wait for the submission window to close
    // (when alarm is due) and then schedule the next notification
    // - Add a buffer to correct for any chain clock latency
    setTimeout(
      () => scheduleNext(user, alarm, onTimerSet),
      (alarm.submissionWindow + 10) * 1000
    );
  }, notifyTimeout * 1000);

  onTimerSet(timer);
}

async function getActiveAlarms(user: EvmAddress) {
  const { data, error } = await supabaseClient
    .from("partner_alarms")
    .select("*")
    .eq("status", AlarmStatus.ACTIVE)
    .or(`player1.eq.${user}, player2.eq.${user}`);

  if (error) {
    throw new Error(
      "Error fetching alarm notifications from Supabase: " + error.details
    );
  }

  return data;
}

async function startAlarmScheduler(user: EvmAddress) {
  const timers: Record<AlarmId, NodeJS.Timeout> = {};
  const activeAlarms = await getActiveAlarms(user);
  console.log("Starting scehdules for", activeAlarms.length, "alarm/s");

  for (const alarm of activeAlarms) {
    if (alarm.player1_timezone === null || alarm.player2_timezone === null) {
      throw new Error("missing timezone for stored active alarm");
    }

    const isPlayer1 = user.toLowerCase() === alarm.player1.toLowerCase();

    scheduleNext(
      user,
      {
        alarmTime: alarm.alarm_time,
        submissionWindow: alarm.submission_window,
        alarmDays: parseAlarmDays(alarm.alarm_days),
        timezoneOffset: isPlayer1
          ? alarm.player1_timezone
          : alarm.player2_timezone,
      },
      (timer: NodeJS.Timeout) => {
        timers[alarm.alarm_id] = timer;
      }
    );
  }

  /* Listen to the db for changing alarm status */

  if (activeAlarms.length >= 100) {
    throw new Error(
      "Too many alarms for supabase realtime subscriptions using the in.() filter"
    );
  }

  supabaseClient
    .channel("alarm-state-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "partner_alarms",
      },
      (payload) => {
        // -> On status changed to anything but active: stop the schedule for that alarm
        // -> On status changed to active: start a schedule for that alarm
        console.log("Partner_alarms table updated", payload);
      }
    )
    .subscribe();
}

/**
 * When new notification subscriptions are added, check if the user already has
 * a notification scheduler running.
 * If already running -> add the new device/subscription pair to notification state
 * If not already running -> start scheduler for that user
 */
async function onNotificationsRowAdded(row: AlarmNotificationRow) {
  console.log("notification subscription row added");
  const user = row.user_address as EvmAddress;

  // If user already has an alarm scheduler active, add the new device to the list
  const userState = notificationState.get(user);

  if (userState) {
    const userDevices = userState.deviceSubscriptions;
    // If device is already in the device/subscription list, do nothing
    if (userDevices?.some((device) => device.deviceId === row.device_id)) {
      console.log("Device already subscribed");
      return;
    }

    console.log("Adding device to subscirptions");
    // If device is not already stored in the device/subscription list, add it
    return notificationState.set(user, {
      ...userState,
      deviceSubscriptions: [
        ...userDevices,
        {
          deviceId: row.device_id,
          subscription: row.subscription as unknown as PushSubscription,
        },
      ],
    });
  }

  console.log("No alarm schedule started. Starting schedule for", user);
  startAlarmScheduler(user);
}

async function onNotificationsRowDeleted(row: AlarmNotificationRow) {
  console.log("Notification row deleted");
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
    onNotificationsRowAdded(row);
  }

  supabaseClient
    .channel("notification-state-update")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        onNotificationsRowAdded(payload.new as AlarmNotificationRow);
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
        onNotificationsRowDeleted(payload.old as AlarmNotificationRow);
      }
    )
    .subscribe();
}
