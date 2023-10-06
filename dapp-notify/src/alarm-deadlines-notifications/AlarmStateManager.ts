import { SupabaseClient } from "@supabase/supabase-js";
import { AlarmId, AlarmRow, EvmAddress } from "../types";
import { dbListener } from "./db-listener";
import { Database } from "../../../alarm-bets-db";
import { Publisher } from "../util/publisher";
import { NotificationSubscriptionManager } from "../NotificationSubscriptionManager";
import { formatAlarm, getActiveAlarms, parseAlarmDays } from "../util/util";
import { JSDocNonNullableType } from "typescript";

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

// Listen for alarm activations and deactiviations in the db
// When alarm state transitions are received, shoud call the
// NotificationSubscriptionManager to determine if the results should be cached
// Pushlish changes to cached alarm state
interface AlarmStateEvents {
  alarmActivated: Alarm;
  alarmDeactivated: Alarm;
}

export class ActiveAlarmStateManager extends Publisher<AlarmStateEvents> {
  db: SupabaseClient<Database>;
  usersListeningFor: Set<EvmAddress> = new Set();
  alarmState: Record<EvmAddress, Record<AlarmId, Alarm>> = {};

  notificationManager: NotificationSubscriptionManager;

  constructor(
    db: SupabaseClient<Database>,
    notificationManager: NotificationSubscriptionManager
  ) {
    super();
    this.db = db;
    this.notificationManager = notificationManager;
  }

  start() {
    this.notificationManager
      .getNotifiedUsers()
      .forEach(this.initUserAlarmState);

    this.notificationManager.subscribe("notificationRowAdded", (sub) => {
      if (!this.usersListeningFor.has(sub.user)) {
        this.initUserAlarmState(sub.user);
      }
    });

    this.notificationManager.subscribe("notificationRowDeleted", (sub) => {
      this.clearUserAlarmState(sub.user);
    });

    this.listenForUpdates();
  }

  // Gets active alarms then start listening for updates
  async initUserAlarmState(user: EvmAddress) {
    this.usersListeningFor.add(user);
    const activeAlarms = await getActiveAlarms(user);
    activeAlarms.forEach((alarm) => {
      this._addActiveAlarm(user, formatAlarm(alarm));
    });
  }

  async clearUserAlarmState(user: EvmAddress) {
    this.usersListeningFor.delete(user);
    delete this.alarmState[user];
  }

  getActiveAlarms(user: EvmAddress) {
    return Object.values(this.alarmState[user]);
  }

  listenForUpdates() {
    dbListener(this.db, {
      onAlarmActivated: (row) => {
        console.log("Alarm activated:", row); // Added log
        const alarm = formatAlarm(row, false);
        if (!this._hasListeneningUser(alarm)) return;
        console.log("User is listening, adding and publishing activated alarm"); // Added log
        this._addActiveAlarm(alarm.player1, alarm);
        this.publish("alarmActivated", alarm);
      },
      onAlarmDeactivated: (row) => {
        console.log("Alarm deactivated:", row); // Added log
        const alarm = formatAlarm(row);
        this._maybeRemoveActiveAlarm(alarm.player1, alarm.id);
        this._maybeRemoveActiveAlarm(alarm.player2, alarm.id);
        this.publish("alarmDeactivated", alarm);
      },
    });
  }

  _hasListeneningUser(alarm: Alarm) {
    return (
      this.usersListeningFor.has(alarm.player1) ||
      this.usersListeningFor.has(alarm.player2)
    );
  }

  _addActiveAlarm(user: EvmAddress, alarm: Alarm) {
    console.log(`Adding active alarm for user ${user}:`, alarm); // Added log
    if (!this.alarmState[user]) {
      this.alarmState[user] = {};
    }
    this.alarmState[user][alarm.id] = alarm;
  }

  _maybeRemoveActiveAlarm(user: EvmAddress, alarmId: AlarmId) {
    console.log(
      `Attempting to remove alarm with ID ${alarmId} for user ${user}`
    ); // Added log
    if (this.alarmState[user]) {
      delete this.alarmState[user][alarmId];
    }
    if (Object.keys(this.alarmState[user]).length === 0) {
      console.log(`No more alarms for user ${user}, removing user`); // Added log
      delete this.alarmState[user];
    }
  }

  _updateActiveAlarm(user: EvmAddress, alarm: Alarm) {
    console.log(`Updating active alarm for user ${user}:`, alarm); // Added log
    if (!this.alarmState[user]) this._addActiveAlarm(user, alarm);

    if (this.alarmState[user]) {
      this.alarmState[user][alarm.id] = alarm;
    }
  }
}
