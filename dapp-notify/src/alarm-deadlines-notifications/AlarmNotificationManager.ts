import { SupabaseClient } from "@supabase/supabase-js";
import { AlarmId, AlarmRow, EvmAddress } from "../types";
import { dbListener } from "./db-listener";
import { Database } from "../../../alarm-bets-db";
import { Publisher } from "../util/publisher";
import { NotificationSubscriptionManager } from "../NotificationSubscriptionManager";
import { getActiveAlarms, parseAlarmDays } from "../util/util";
import { ActiveAlarmStateManager } from "./AlarmStateManager";
import { clear } from "console";
import { getTimeUntilNextAlarm } from "../util/time";
import { sendNotification } from "web-push";

type Alarm = {
  id: number;
  player1: EvmAddress;
  player2: EvmAddress;
  time: number;
  days: number[];
  p1Timezone: number | null;
  p2Timezone: number | null;
  submissionWindow: number;
};

// Classes should follow a pub-sub model

// Manages the timers that send push notifications for alarm deadlines
// AlarmNotificationManager subs to NotificationSubscriptionManager and AlarmStateManager
// to start/stop alarm notification timers
// Flow:
// Starting timers: Receives a new user notification subscription, querys AlarmStateManager
// for active alarms, starts timers for those alarms
// Stopping timers:
//   -Receive alarm deactivation event, stop timers for that alarm id,
//   -Receive notification deletion event, sto ptimers for all of that users' alarm ids
export class AlarmNotificationManager {
  notificationTimers: Record<EvmAddress, Record<AlarmId, NodeJS.Timeout>> = {};
  alarmStateManager: ActiveAlarmStateManager;
  notificationManager: NotificationSubscriptionManager;
  constructor(
    _alarmStateManager: ActiveAlarmStateManager,
    _notificationManager: NotificationSubscriptionManager
  ) {
    this.alarmStateManager = _alarmStateManager;
    this.notificationManager = _notificationManager;
  }

  async run() {
    console.log("Running AlarmNotificationManager...");

    this.alarmStateManager.subscribe("alarmActivated", (alarm) => {
      console.log(
        `[Scheduler] Alarm ${alarm.id} activated for players: ${alarm.player1} and ${alarm.player2}`
      );
      this.notificationManager.getNotifiedUsers().forEach((user) => {
        if (user === alarm.player1 || user === alarm.player2) {
          this.startAlarmNotificationTimer(user, alarm);
        }
      });
    });

    this.alarmStateManager.subscribe("alarmDeactivated", (alarm) => {
      console.log(
        `[Scheduler] Alarm ${alarm.id} deactivated for players: ${alarm.player1} and ${alarm.player2}`
      );

      const { player1, player2, id: alarmId } = alarm;
      this.stopAlarmNotificationTimer(player1, alarmId);
      this.stopAlarmNotificationTimer(player2, alarmId);
    });

    this.notificationManager.subscribe("notificationRowDeleted", (sub) => {
      console.log(`[Scheduler] Notification deleted for user: ${sub.user}`);
      this.stopAllNotificationTimersForUser(sub.user);
    });

    this.notificationManager.subscribe("notificationRowAdded", (sub) => {
      console.log(`[Scheduler] Notification added for user: ${sub.user}`);
      // Delay this so that the alarm state manager has time to initialize
      // users state. (This is a bad design and should be refactored)
      setTimeout(() => this.startAllNotificationTimers(sub.user), 1000);
    });

    this.alarmStateManager.start();
    await this.notificationManager.start();

    console.log(
      "AlarmNotificationManager is now monitoring and managing alarms."
    );
  }

  startAlarmNotificationTimer(user: EvmAddress, alarm: Alarm) {
    console.log(
      `Starting notification timer for alarm ${alarm.id}, user ${user}`
    );

    const isPlayer1 = user.toLowerCase() === alarm.player1.toLowerCase();
    const playerTimezone = isPlayer1 ? alarm.p1Timezone : alarm.p2Timezone;
    if (!playerTimezone) {
      throw new Error("missing timezone for stored active alarm");
    }

    if (this.notificationTimers[user]?.[alarm.id]) {
      console.warn("Timer already exists for alarm", alarm.id);
      clearTimeout(this.notificationTimers[user][alarm.id]);
    }

    this._scheduleNext(user, { ...alarm, timezoneOffset: playerTimezone });
  }

  stopAlarmNotificationTimer(user: EvmAddress, alarmId: AlarmId) {
    console.log(
      `Stopping notification timer for alarm ${alarmId}, user ${user}`
    );
    if (!this.notificationTimers[user]?.[alarmId]) {
      console.warn("No timer exists for alarm", alarmId);
      return;
    }

    clearTimeout(this.notificationTimers[user][alarmId]);
    delete this.notificationTimers[user][alarmId];
  }

  stopAllNotificationTimersForUser(user: EvmAddress) {
    console.log(`Stopping all notification timers for user ${user}`);
    if (!this.notificationTimers[user]) {
      console.warn("No timers exist for user", user);
      return;
    }

    Object.keys(this.notificationTimers[user]).forEach((alarmId) => {
      this.stopAlarmNotificationTimer(user, parseInt(alarmId));
    });
  }

  startAllNotificationTimers(user: EvmAddress) {
    this.alarmStateManager.getActiveAlarms(user).forEach((alarm) => {
      this.startAlarmNotificationTimer(user, alarm);
    });
  }

  private async _scheduleNext(
    user: EvmAddress,
    alarm: {
      id: number;
      time: number;
      days: number[];
      timezoneOffset: number;
      submissionWindow: number;
    }
  ) {
    console.log(
      `Scheduling next notification for user ${user}, alarm ${alarm.id}`
    );
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
      setTimeout(
        () => this._scheduleNext(user, alarm),
        (timeTillNextAlarm + 1) * 1000
      );
      return;
    }

    const notifyTimeout = timeTillNextAlarm - alarm.submissionWindow;
    console.log("Alarm notification due in ", notifyTimeout / 60, "minutes");

    if (!this.notificationTimers[user]) {
      this.notificationTimers[user] = {};
    }

    this.notificationTimers[user][alarm.id] = setTimeout(async () => {
      this._sendPushNotification(user);

      // After sending the notification, wait for the submission window to close
      // (when alarm is due) and then schedule the next notification
      // - Add a buffer to correct for any chain clock latency
      setTimeout(
        () => this._scheduleNext(user, alarm),
        (alarm.submissionWindow + 10) * 1000
      );
    }, notifyTimeout * 1000);
  }

  private async _sendPushNotification(user: EvmAddress) {
    const devices = this.notificationManager.userSubscriptions[user];
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
}
