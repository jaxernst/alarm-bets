import { getTimeUntilNextAlarm } from "../util/time";
import { sendNotification, type PushSubscription } from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { EvmAddress } from "../types";
import { getActiveAlarms, parseAlarmDays } from "../util/util";

type AlarmId = number;

type AlarmNotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
};

// Global state to manage notification scehdules
const deviceSubscriptions: Record<EvmAddress, DeviceSubscription[]> = {};
const scheduleTimers: Record<EvmAddress, Record<AlarmId, NodeJS.Timeout>> = {};

async function sendPushNotification(user: EvmAddress) {
  const devices = deviceSubscriptions[user];
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
    id: number;
    time: number;
    days: number[];
    timezoneOffset: number;
    submissionWindow: number;
  }
) {
  const timeTillNextAlarm = getTimeUntilNextAlarm(
    alarm.time,
    alarm.timezoneOffset,
    alarm.days
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

  if (!scheduleTimers[user]) {
    scheduleTimers[user] = {};
  }

  scheduleTimers[user][alarm.id] = setTimeout(async () => {
    sendPushNotification(user);

    // After sending the notification, wait for the submission window to close
    // (when alarm is due) and then schedule the next notification
    // - Add a buffer to correct for any chain clock latency
    setTimeout(
      () => scheduleNext(user, alarm),
      (alarm.submissionWindow + 10) * 1000
    );
  }, notifyTimeout * 1000);
}

async function onAlarmActivated(alarm: AlarmRow) {
  if (alarm.status !== AlarmStatus.ACTIVE) {
    throw new Error("Alarm not activated");
  }

  console.log("Alarm", alarm.alarm_id, "activated");

  const p1 = alarm.player1 as EvmAddress;
  const p2 = alarm.player2 as EvmAddress;

  // If either player has notifications subscriptions, start the schedule
  // for that player1-alarmId key
  if (deviceSubscriptions[p1] && !scheduleTimers[p1][alarm.alarm_id]) {
    if (!alarm.player1_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    console.log("Scheduling this alarm notification for player 1");
    return scheduleNext(p1, {
      id: alarm.alarm_time,
      time: alarm.alarm_time,
      days: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player1_timezone,
      submissionWindow: alarm.submission_window,
    });
  }

  if (deviceSubscriptions[p2] && !scheduleTimers[p2][alarm.alarm_id]) {
    if (!alarm.player2_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    console.log("Scheduling this alarm notification for player 2");
    return scheduleNext(p2, {
      id: alarm.alarm_id,
      time: alarm.alarm_time,
      days: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player2_timezone,
      submissionWindow: alarm.submission_window,
    });
  }
}

async function onAlarmDeactivated(alarm: AlarmRow) {
  const p1 = alarm.player1 as EvmAddress;
  const p2 = alarm.player2 as EvmAddress;

  if (scheduleTimers[p1]?.[alarm.alarm_id]) {
    clearTimeout(scheduleTimers[p1][alarm.alarm_id]);
    delete scheduleTimers[p1][alarm.alarm_id];
  }

  if (scheduleTimers[p2]?.[alarm.alarm_id]) {
    clearTimeout(scheduleTimers[p2][alarm.alarm_id]);
    delete scheduleTimers[p2][alarm.alarm_id];
  }
}

async function onNotificationsRowAdded(row: AlarmNotificationRow) {
  console.log("\n Notification subscription row added");

  const user = row.user_address as EvmAddress;
  const userDevices = deviceSubscriptions[user];

  // If no devices active add the first one and start the active alarm schedules
  if (!userDevices) {
    deviceSubscriptions[user] = [];
    startActiveAlarmSchedules(user);
  }

  // Add the device to the list
  if (
    !deviceSubscriptions[user].some(
      (device) => device.deviceId === row.device_id
    )
  ) {
    deviceSubscriptions[user] = [
      ...deviceSubscriptions[user],
      {
        subscription: row.subscription as unknown as PushSubscription,
        deviceId: row.device_id,
      },
    ];
  }
}

async function onNotificationsRowDeleted(row: AlarmNotificationRow) {
  console.log("\n Notification row deleted");

  const user = row.user_address as EvmAddress;
  const userDevices = deviceSubscriptions[user];

  // Remove device id from the array
  const newDevices = userDevices.filter((d) => d.deviceId !== row.device_id);
  console.log("User has", newDevices.length, "subscriptions active");

  // If there are no more devices, delete user from subscirption record and cancel
  // all pending notification timers
  if (newDevices.length === 0) {
    console.log("No subscriptions left, canceling timers");
    delete deviceSubscriptions[user];
    Object.values(scheduleTimers[user]).forEach(clearTimeout);
  }
}

async function startActiveAlarmSchedules(user: EvmAddress) {
  const activeAlarms = await getActiveAlarms(user);
  console.log("Starting scehdules for", activeAlarms.length, "alarm/s");

  for (const alarm of activeAlarms) {
    if (alarm.player1_timezone === null || alarm.player2_timezone === null) {
      throw new Error("missing timezone for stored active alarm");
    }

    const isPlayer1 = user.toLowerCase() === alarm.player1.toLowerCase();

    scheduleNext(user, {
      id: alarm.alarm_id,
      time: alarm.alarm_time,
      days: parseAlarmDays(alarm.alarm_days),
      submissionWindow: alarm.submission_window,
      timezoneOffset: isPlayer1
        ? alarm.player1_timezone
        : alarm.player2_timezone,
    });
  }
}

export async function runAlarmDeadlineNotificationScheduler(
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

  // Listen for changes to user notification subscriptions
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

  // Listen for changes to user alarm state
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
        const newRow = payload.new as AlarmRow;
        const oldRow = payload.old as AlarmRow;

        if (newRow.status === oldRow.status) return; // Only care about changes to status

        if (newRow.status === AlarmStatus.ACTIVE) {
          onAlarmActivated(newRow);
        } else if (oldRow.status === AlarmStatus.ACTIVE) {
          onAlarmDeactivated(newRow);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "partner_alarms",
      },
      (payload) => {
        const newRow = payload.new as AlarmRow;
        if (newRow.status === AlarmStatus.ACTIVE) {
          console.log("Active alarm row created");
          onAlarmActivated(newRow);
        }
      }
    )
    .subscribe();
}
