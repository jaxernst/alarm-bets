import { getTimeUntilNextAlarm } from "../util/time";
import { sendNotification, type PushSubscription } from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { EvmAddress } from "../types";
import { getActiveAlarms, parseAlarmDays } from "../util/util";
import { supabaseClient } from "..";
import { dbListener } from "./db-listener";
import { clear } from "console";

type AlarmId = number;

type NotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
};

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
  if (deviceSubscriptions[p1] && !scheduleTimers[p1]?.[alarm.alarm_id]) {
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

  if (deviceSubscriptions[p2] && !scheduleTimers[p2]?.[alarm.alarm_id]) {
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

  console.log("Alarm", alarm.alarm_id, "deactivated");

  if (scheduleTimers[p1]?.[alarm.alarm_id]) {
    console.log("Clearing timer for player 1");
    clearTimeout(scheduleTimers[p1][alarm.alarm_id]);
    delete scheduleTimers[p1][alarm.alarm_id];
  }

  if (scheduleTimers[p2]?.[alarm.alarm_id]) {
    console.log("Clearing timer for player 2");
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
    console.log("Adding device to subscription list");
    deviceSubscriptions[user] = [
      ...deviceSubscriptions[user],
      {
        subscription: row.subscription as unknown as PushSubscription,
        deviceId: row.device_id,
      },
    ];
  }
}

async function removeDe(row: AlarmNotificationRow) {
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

function makeActiveAlarmGetter() {
  return () => {};
}

function makeDeviceSubscriptionGetter() {
  return () => {};
}

function clearTimers(timers: Record<any, NodeJS.Timeout>) {
  Object.values(timers).forEach((t) => clearTimeout(t));
}

// Any time there's a change to subscriptions rows or alarm state, tear down the schedules
// and revuild them instead of trying to update them. This is less efficient but more
// resistant to errors

// On any change to any db
// 1. Get active alarms (can be cached locally)
// 2. Get devices
// 3. Build push sender
// 4. Run schedules for alarms

function main(supabaseClient: SupabaseClient<Database>) {
  const notificationTimers: Record<
    EvmAddress,
    Record<AlarmId, NodeJS.Timeout>
  > = {};

  const updateTimerStateEffect = (
    user: EvmAddress,
    alarmId: AlarmId,
    timer: NodeJS.Timeout
  ) => {
    if (!notificationTimers[user]) {
      notificationTimers[user] = {};
    }
    notificationTimers[user][alarmId] = timer;
  };

  const getActiveAlarms = makeActiveAlarmGetter(supabaseClient);
  const getDevices = makeDeviceSubscriptionGetter(supabaseClient);

  const notificationResetSequence = async (user: EvmAddress) => {
    if (notificationTimers[user]) {
      clearTimers(notificationTimers[user]);
      delete notificationTimers[user];
    }

    const alarms = await getActiveAlarms(user);
    const notificationDestinations = await getDevices(user);

    scheduleNotificationsForAlarms({
      alarms,
      notificationDestinations,
      onTimerSet: updateTimerStateEffect,
    });
  };

  // Need logic to initialize scheudels for users with prexisting alarms and notifications

  dbListener(supabaseClient, {
    onNotificationRowAdded: ({ user_address }) =>
      notificationResetSequence(user_address as EvmAddress),

    onNotificationRowDeleted: ({ user_address }) =>
      notificationResetSequence(user_address as EvmAddress),

    onAlarmActivated: ({ player1, player2 }) => {
      notificationResetSequence(player1 as EvmAddress);
      notificationResetSequence(player2 as EvmAddress);
    },

    onAlarmDeactivated: ({ player1, player2 }) => {
      notificationResetSequence(player1 as EvmAddress);
      notificationResetSequence(player2 as EvmAddress);
    },
  });
}
