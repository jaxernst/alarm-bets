import { sendNotification } from "web-push";
import { Alarm, AlarmId, EvmAddress } from "../types";
import {
  getActiveAlarms,
  sendNotifications,
  timeToNextAlarm,
} from "../util/util";
import { State } from "./main";

type ScheduleActiveEffect = ["ScheduleActiveAlarms", { user: EvmAddress }];

type RebuildAlarmTimersEffect = ["RebuildAlarmTimers", { user: EvmAddress }];

type CancelAlarmTimersEffect = ["CancelAllAlarmTimers", { user: EvmAddress }];

type StartAlarmTimerEffect = ["StartTimer", { user: EvmAddress; alarm: Alarm }];

type CancelAlarmTimerEffect = [
  "CancelTimer",
  { user: EvmAddress; alarmId: AlarmId }
];

export type Effect =
  | ScheduleActiveEffect
  | RebuildAlarmTimersEffect
  | CancelAlarmTimersEffect
  | StartAlarmTimerEffect
  | CancelAlarmTimerEffect;

export const alarmRescheduleQueue = (() => {
  const queue: StartAlarmTimerEffect[] = [];
  return {
    push: (user: EvmAddress, alarm: Alarm) => {
      queue.push(["StartTimer", { user, alarm }]);
    },
    next: () => queue.shift(),
  };
})();

function scheduleTimer(state: State, user: EvmAddress, alarm: Alarm) {
  const timeoutSeconds = timeToNextAlarm(alarm) - alarm.submissionWindow;
  const userDevices = state[user]?.notifications;
  if (!userDevices) throw new Error("scheduleAlarm: No devices found for user");

  console.log("Scheduling alarm", {
    dueIn: timeoutSeconds / 60,
    alarmId: alarm.alarmId,
    devices: userDevices,
  });

  const onDue = async () => {
    await sendNotifications(userDevices, alarm);
    alarmRescheduleQueue.push(user, alarm);
  };

  return {
    ...state,
    [user]: {
      ...state[user],
      alarmTimers: {
        ...state[user]?.alarmTimers,
        [alarm.alarmId]: {
          ...state[user]?.alarmTimers?.[alarm.alarmId],
          timer: setTimeout(onDue, timeoutSeconds * 1000),
          alarm,
        },
      },
    },
  };
}

function scheduleTimers(
  state: State,
  user: EvmAddress,
  alarms: Alarm[]
): State {
  if (!alarms.length) return state;
  console.log("Scheduling all timers", alarms.length, "left...");
  const newState = scheduleTimer(state, user, alarms[0]);
  return scheduleTimers(newState, user, alarms.slice(1));
}

async function fetchAndScheduleAlarms(state: State, user: EvmAddress) {
  const alarms = await getActiveAlarms(user);
  console.log(
    "Scheduling alarm IDS:",
    alarms.map((a) => a.alarmId)
  );
  return scheduleTimers(state, user, alarms);
}

function cancelTimer(state: State, user: EvmAddress, alarmId: AlarmId) {
  const userTimers = state[user]?.alarmTimers;
  if (!userTimers) return state;

  const { timer } = userTimers[alarmId];
  clearTimeout(timer);

  return {
    ...state,
    [user]: {
      ...state[user],
      alarmTimers: {
        ...userTimers,
        [alarmId]: undefined,
      },
    },
  };
}

function cancelTimers(state: State, user: EvmAddress) {
  const userTimers = state[user]?.alarmTimers;
  if (!userTimers) return state;

  // Recurse through the timers record calling clearTimeout for each AlarmId
  const cancel = (state: State, alarmId: AlarmId[]): State => {
    if (!alarmId.length) return state;

    const { timer } = userTimers[alarmId[0]];
    clearTimeout(timer);

    const newState = cancel(state, alarmId.slice(1));
    return {
      ...newState,
      [user]: {
        ...newState[user],
        alarmTimers: {
          ...newState[user]?.alarmTimers,
          [alarmId[0]]: undefined,
        },
      },
    };
  };

  return cancel(state, Object.keys(userTimers).map(Number));
}

function restartTimers(state: State, user: EvmAddress) {
  const userTimers = state[user]?.alarmTimers;
  if (!userTimers) return state;

  // Recurse through the timers record calling clearTimeout for each AlarmId and starting a new timer
  const restart = (state: State, alarmId: AlarmId[]): State => {
    if (!alarmId.length) return state;

    const { timer, alarm } = userTimers[alarmId[0]];
    clearTimeout(timer);

    const newState = scheduleTimer(state, user, alarm);
    return restart(newState, alarmId.slice(1));
  };

  return restart(state, Object.keys(userTimers).map(Number));
}

export async function processEffects(state: State, effects: Effect[]) {
  if (!effects[0]) return state;

  const [name, data] = effects[0];
  try {
    switch (name) {
      case "ScheduleActiveAlarms":
        console.log("Scheduling alarm notifs for user", data.user);
        return processEffects(
          await fetchAndScheduleAlarms(state, data.user),
          effects.slice(1)
        );
      case "RebuildAlarmTimers":
        console.log("Update notification timers");
        return restartTimers(state, data.user);
      case "StartTimer":
        console.log("Scheduling notification");
        return scheduleTimer(state, data.user, data.alarm);
      case "CancelTimer":
        console.log("Canceling timer");
        return cancelTimer(state, data.user, data.alarmId);
      case "CancelAllAlarmTimers":
        console.log("Canceling timers");
        return cancelTimers(state, data.user);
      default:
        throw new Error(`Unknown effect: ${name}`);
    }
  } catch (e) {
    console.error(e);
    return state;
  }
}
