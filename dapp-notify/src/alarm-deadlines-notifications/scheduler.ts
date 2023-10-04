import { getTimeUntilNextAlarm } from "../time";
import { sendNotification, type PushSubscription } from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { supabaseClient } from "../setup";
import { getActiveAlarms, parseAlarmDays } from "./util";

/**
 * -> New row added to alarm_notifications table
 *  -> If user does not have an alarm scheduler, start one
 *  -> If user does have an alarm scheduler active, add the new device to the list
 */

type EvmAddress = `0x${string}`;
type AlarmId = number;
type AlarmNotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
};

type ScheduleKey = `${EvmAddress}-${AlarmId}`;

const deviceSubscriptions: Record<EvmAddress, DeviceSubscription[]> = {};
const scheduleTimers: Record<EvmAddress, Record<AlarmId, NodeJS.Timeout>> = {};

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
  }
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
    setTimeout(() => scheduleNext(user, alarm), (timeTillNextAlarm + 1) * 1000);
    return;
  }

  const notifyTimeout = timeTillNextAlarm - alarm.submissionWindow;
  console.log("Alarm notification due in ", notifyTimeout / 60, "minutes");

  setTimeout(async () => {
    onNotificationDue(user);

    // After sending the notification, wait for the submission window to close
    // (when alarm is due) and then schedule the next notification
    // - Add a buffer to correct for any chain clock latency
    setTimeout(
      () => scheduleNext(user, alarm),
      (alarm.submissionWindow + 10) * 1000
    );
  }, notifyTimeout * 1000);
}

async function startAlarmScheduler(user: EvmAddress) {
  const activeAlarms = await getActiveAlarms(user);
  console.log("Starting scehdules for", activeAlarms.length, "alarm/s");

  for (const alarm of activeAlarms) {
    if (alarm.player1_timezone === null || alarm.player2_timezone === null) {
      throw new Error("missing timezone for stored active alarm");
    }

    const isPlayer1 = user.toLowerCase() === alarm.player1.toLowerCase();

    scheduleNext(user, {
      alarmTime: alarm.alarm_time,
      submissionWindow: alarm.submission_window,
      alarmDays: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: isPlayer1
        ? alarm.player1_timezone
        : alarm.player2_timezone,
    });
  }
}

async function onAlarmActiveActivated(alarm: AlarmRow) {
  if (alarm.status !== AlarmStatus.ACTIVE) {
    throw new Error("Alarm not activated");
  }

  const p1 = alarm.player1 as EvmAddress;
  const p2 = alarm.player2 as EvmAddress;

  // If the alarm status becomes active and either player has notifications subscriptions,
  // start the schedule for that player1-alarmId pair
  if (deviceSubscriptions[p1] && !scheduleTimers[p1][alarm.alarm_id]) {
    if (!alarm.player1_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    return scheduleNext(p1, {
      alarmTime: alarm.alarm_time,
      alarmDays: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player1_timezone,
      submissionWindow: alarm.submission_window,
    });
  }

  if (deviceSubscriptions[p2] && !scheduleTimers[p2][alarm.alarm_id]) {
    if (!alarm.player2_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    return scheduleNext(p2, {
      alarmTime: alarm.alarm_time,
      alarmDays: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player2_timezone,
      submissionWindow: alarm.submission_window,
    });
  }
}

async function onAlarmDeactivated(alarm: AlarmRow) {
  const p1 = alarm.player1 as EvmAddress;
  const p2 = alarm.player2 as EvmAddress;
  if (scheduleTimers[p1][alarm.alarm_id]) {
    clearTimeout(scheduleTimers[p1][alarm.alarm_id]);
    delete scheduleTimers[p1][alarm.alarm_id];
  }
  if (scheduleTimers[p2][alarm.alarm_id]) {
    clearTimeout(scheduleTimers[p2][alarm.alarm_id]);
    delete scheduleTimers[p2][alarm.alarm_id];
  }
}

async function onAlarmStatusUpdated(alarm: AlarmRow) {}

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
        const newRow = payload.new as AlarmRow;
        const oldRow = payload.old as AlarmRow;
        if (newRow.status !== oldRow.status) {
          onAlarmStatusChanged(
            newRow.alarm_id,
            newRow.player1,
            newRow.player2,
            newRow.status
          );
        }
      }
    )
    .subscribe();
}
