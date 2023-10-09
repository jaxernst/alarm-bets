import { getTimeUntilNextAlarm } from "../util/time";
import {
  sendNotification,
  type PushSubscription,
  WebPushError,
  SendResult,
} from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { EvmAddress } from "../types";
import { getActiveAlarms, parseAlarmDays } from "../util/util";
import { dbListener } from "../db-listener";
import { createLogger, transports } from "winston";

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: "dapp-sync.log" }),
    new transports.File({ filename: "dapp-sync-error.log", level: "error" }),
  ],
});

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
const scheduleTimers: Record<
  EvmAddress,
  Record<AlarmId, { due: Date; timer: NodeJS.Timeout }>
> = {};

const logTimerState = () => {
  if (Object.keys(scheduleTimers).length === 0) return;
  // Log time until each timeout
  console.log("\n");
  console.log("Current timer state");
  console.log("-------------------");
  Object.entries(scheduleTimers).forEach(([user, timers]) => {
    console.log("User", user);
    Object.entries(timers).forEach(([alarmId, timer]) => {
      // Log out time until due
      console.log(
        "Alarm",
        alarmId,
        "due in",
        Math.floor((timer.due.getTime() - Date.now()) / (1000 * 60)),
        "minutes"
      );
    });
  });
};

async function sendPushNotification(user: EvmAddress) {
  const devices = deviceSubscriptions[user];
  if (!devices) {
    console.error("No devices found to notify", user);
    return new Error("No devices found");
  }

  for (const device of devices) {
    console.log("Sending notification to device", device.deviceId, "for", user);
    let res: SendResult | undefined;
    try {
      res = await sendNotification(
        device.subscription,
        JSON.stringify({
          title: "Upcoming Alarm",
          body: "Your alarm submission window is open. Wake up and submit your alarm!",
        })
      );
      logger.log("info", "Notification sent");
    } catch (e) {
      if (e instanceof WebPushError && e.statusCode === 410) {
        logger.log("error", `Subscription expired for ${user} with device ${device.deviceId} (${e.statusCode} - ${e.message})`);`)`);
        deviceSubscriptions[user] = deviceSubscriptions[user].filter(
          (d) => d.deviceId !== device.deviceId
        );
        console.log("Subscription expired, removing from list");
      } else {
        throw e;
      }
    }

    if (res && res.statusCode === 201) {
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

  scheduleTimers[user][alarm.id] = {
    timer: setTimeout(async () => {
      sendPushNotification(user);

      // After sending the notification, wait for the submission window to close
      // (when alarm is due) and then schedule the next notification
      // - Add a buffer to correct for any chain clock latency
      setTimeout(
        () => scheduleNext(user, alarm),
        (alarm.submissionWindow + 10) * 1000
      );
    }, notifyTimeout * 1000),
    due: new Date(Date.now() + notifyTimeout * 1000),
  };
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
  if (deviceSubscriptions[p1] && !scheduleTimers[p1]?.[alarm.alarm_id]) {
    if (!alarm.player1_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    console.log("Scheduling this alarm notification for player 1");
    scheduleNext(p1, {
      id: alarm.alarm_time,
      time: alarm.alarm_time,
      days: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player1_timezone,
      submissionWindow: alarm.submission_window,
    });
  }

  if (deviceSubscriptions[p2] && !scheduleTimers[p2]?.[alarm.alarm_id]) {
    if (!alarm.player2_timezone) {
      throw new Error("Missing p1 timezone for active alarm");
    }

    console.log("Scheduling this alarm notification for player 2");
    scheduleNext(p2, {
      id: alarm.alarm_id,
      time: alarm.alarm_time,
      days: parseAlarmDays(alarm.alarm_days),
      timezoneOffset: alarm.player2_timezone,
      submissionWindow: alarm.submission_window,
    });
  }
  logTimerState();
}

async function onAlarmDeactivated(alarm: AlarmRow) {
  const p1 = alarm.player1 as EvmAddress;
  const p2 = alarm.player2 as EvmAddress;

  console.log("Alarm", alarm.alarm_id, "deactivated");

  if (scheduleTimers[p1]?.[alarm.alarm_id]) {
    console.log("Clearing timer for player 1");
    clearTimeout(scheduleTimers[p1][alarm.alarm_id].timer);
    delete scheduleTimers[p1][alarm.alarm_id];
  }

  if (scheduleTimers[p2]?.[alarm.alarm_id]) {
    console.log("Clearing timer for player 2");
    clearTimeout(scheduleTimers[p2][alarm.alarm_id].timer);
    delete scheduleTimers[p2][alarm.alarm_id];
  }
  logTimerState();
}

async function onNotificationRowAdded(row: AlarmNotificationRow) {
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
    console.log("Adding device to subscription list");
    deviceSubscriptions[user] = [
      ...deviceSubscriptions[user],
      {
        subscription: row.subscription as unknown as PushSubscription,
        deviceId: row.device_id,
      },
    ];
  }

  logTimerState();
}

async function onNotificationRowDeleted(row: AlarmNotificationRow) {
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
    Object.values(scheduleTimers[user]).forEach((t) => clearTimeout(t.timer));
  }

  logTimerState();
}

async function onNotificationRowUpdated(row: AlarmNotificationRow) {
  console.log("\n Notification row updated");

  const user = row.user_address as EvmAddress;
  const userDevices = deviceSubscriptions[user];

  // If no devices active add the first one and start the active alarm schedules
  if (!userDevices) {
    throw new Error("No devices found for updated notification row");
  }

  // Update the device in the list
  const newDevices = userDevices.map((device) => {
    if (device.deviceId === row.device_id) {
      return {
        subscription: row.subscription as unknown as PushSubscription,
        deviceId: row.device_id,
      };
    }

    return device;
  });

  deviceSubscriptions[user] = newDevices;

  logTimerState();
}

async function startActiveAlarmSchedules(user: EvmAddress) {
  const activeAlarms = await getActiveAlarms(user);
  console.log("Starting schedules for", activeAlarms.length, "alarm/s");

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

export async function run(supabaseClient: SupabaseClient<Database>) {
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
    onNotificationRowAdded(row);
  }

  dbListener(supabaseClient, {
    onNotificationRowAdded,
    onNotificationRowDeleted,
    onNotificationRowUpdated,
    onAlarmActivated,
    onAlarmDeactivated,
  });
}
