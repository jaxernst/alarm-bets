import { SupabaseClient, createClient } from "@supabase/supabase-js";
import webpush, { sendNotification, PushSubscription } from "web-push";
import type { Database } from "../../alarm-bets-db";
import { run } from "./user-alarm-notifications/scheduler";
import { AlarmRow, EvmAddress, NotificationRow } from "./types";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { dbListener } from "./db-listener";
import { getTimeUntilNextAlarm } from "./util/time";
import { parseAlarmDays } from "./util/util";

require("dotenv").config({ path: "../.env" });

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PRIVATE_SUPA_SERVICE_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<Database>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PRIVATE_SUPA_SERVICE_KEY
);

if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  throw new Error("Missing VAPID env variables for notifcation server");
}

webpush.setVapidDetails(
  "mailto:jaxernst@gmail.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

run(supabaseClient);

// Reactions
// -> users alarm changes -> Cancel or start new nofitication schedules
// -> notification change -> Cancel or start new notification schedules

// Flow
// 1. Get mapping of user notifications
// 2. Build notification fetch function (built with current state of notifications)
// 3. For each user, get their alarms
// 4. For each alarm:
//      - build function to get the next due date
//      - build function to reschedule on delivery

// 5. Set that schedule with the time to next deadline, when the notification fires,
// the n

// Return functions to get or fetch notification state, with listeners to update the cached state
/* function notificationsFetcher(supabase: SupabaseClient<Database>) {
  // Update notifcation state on db changes
  let notificationState = {};
  dbListener(supabase, {
    onNotificationRowAdded: () => {},
    onNotificationRowDeleted: () => {},
  });

  // Need some cache invalidation logic

  const getOrFetchNotifications = (user: EvmAddress) => {};

  return {
    allNotifications: async () => {
      const { data } = await supabase.from("alarm_notifications").select("*");

      data?.reduce((record, row) => {
        record[row.user_address as EvmAddress] = row;
        return record;
      }, {} as Record<EvmAddress, NotificationRow>);

      return data;
    },
    userNotifications: getOrFetchNotifications,
  };
} */

function activeAlarmsFetcher(supabase: SupabaseClient<Database>) {
  return async (user: EvmAddress) => {
    const { data, error } = await supabase
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
  };
}

type AlarmId = number;
type Alarm = {
  alarmId: AlarmId;
  alarmTime: number; // seconds after midnight in local timezone
  alarmDays: number[]; // 1-7 (Sunday-Saturday)
  timezoneOffset: number; // seconds from UTC
};

const compactAlarmFormat = (a: AlarmRow): Alarm => ({
  alarmId: a.alarm_id,
  alarmTime: a.alarm_time,
  alarmDays: parseAlarmDays(a.alarm_days),
  timezoneOffset: a.timezone_offset,
});

const formattedFetchResult = <T extends any>(
  fetcher: (user: EvmAddress) => Promise<AlarmRow[]>,
  transformOutput: (a: AlarmRow) => T
) => {
  return async (user: EvmAddress) => {
    const alarms = await fetcher(user);
    return alarms.map(transformOutput);
  };
};

const sendPushNotification = async (subscription: PushSubscription) => {
  await sendNotification(
    subscription,
    JSON.stringify({
      title: "Upcoming Alarm",
      body: "Your alarm submission window is open. Wake up and submit your alarm!",
    })
  );
};

const pushNotification = (toDevices: () => Promise<NotificationRow[]>) => {
  return async () => {
    const devices = await toDevices();
    devices.forEach((d) =>
      sendPushNotification(d.subscription as unknown as PushSubscription)
    );
  };
};

const timeToNextAlarm = ({ alarmTime, timezoneOffset, alarmDays }: Alarm) => {
  return getTimeUntilNextAlarm(alarmTime, timezoneOffset, alarmDays);
};

type NotificationAddedEvent = {
  name: "notificationAdded";
  data: NotificationRow;
};

type NotificationDeletedEvent = {
  name: "notificationDeleted";
  data: NotificationRow;
};

type NotificationUpdatedEvent = {
  name: "notificationUpdated";
  data: NotificationRow;
};

type AlarmActivatedEvent = {
  name: "alarmActivated";
  data: AlarmRow;
};

type AlarmDeactivatedEvent = {
  name: "alarmDeactivated";
  data: AlarmRow;
};

type SchedulerEvent =
  | NotificationAddedEvent
  | NotificationDeletedEvent
  | NotificationUpdatedEvent
  | AlarmActivatedEvent
  | AlarmDeactivatedEvent;

function MakeDbEventSource(supabase: SupabaseClient<Database>) {
  const queue: SchedulerEvent[] = [];

  dbListener(supabase, {
    onNotificationRowAdded: (row) =>
      queue.push({ name: "notificationAdded", data: row }),
    onNotificationRowDeleted: (row) =>
      queue.push({ name: "notificationDeleted", data: row }),
    onNotificationRowUpdated: (row) =>
      queue.push({ name: "notificationUpdated", data: row }),
    onAlarmActivated: (row) =>
      queue.push({ name: "alarmActivated", data: row }),
    onAlarmDeactivated: (row) =>
      queue.push({ name: "alarmDeactivated", data: row }),
  });

  return () => queue.shift();
}

const getActiveAlarms = formattedFetchResult(
  activeAlarmsFetcher(supabaseClient),
  compactAlarmFormat
);

type State = Record<
  EvmAddress,
  {
    alarmTimers?: Record<
      AlarmId,
      {
        timer: NodeJS.Timeout;
        onDue: () => void;
      }
    >;
    notifications?: NotificationRow[];
  }
>;

// Having problems figure out how to do this
const scheduleAlarmEffect = (state: State, user: EvmAddress, alarm: Alarm) => {
  return () => {
    const timeout = timeToNextAlarm(alarm);
    const timer = setTimeout(() => {
      // Send push notification to devices
      // Problem: State devices change change betweeen when the timer is set and fired
    }, timeout);

    return {
      ...state,
      [user]: {
        alarmTimers: {
          [alarm.alarmId]: {
            timer,
            onDue: () => {
              // Send push notification to devices
              // Problem: State devices change change betweeen when the timer is set and fired
            },
          },
        },
      },
    };
  };
};

const scheduleAlarmsEffect = (
  state: State,
  user: EvmAddress,
  alarms: Alarm[]
): State => {
  if (!alarms.length) return state;
  const newState = scheduleAlarmEffect(state, user, alarms[0])();
  return scheduleAlarmsEffect(newState, user, alarms.slice(1));
};

const scheduleActiveAlarmsEffect = (user: EvmAddress) => {
  return async (state: State) => {
    const alarms = await getActiveAlarms(user);
    return scheduleAlarmsEffect(state, user, alarms);
  };
};

type ScheduleActiveEffect = ["ScheduleActiveAlarms", { user: EvmAddress }];
type RebuildAlarmTimersEffect = ["RebuildAlarmTimers", { user: EvmAddress }];
type CancelAlarmTimersEffect = ["CancelAlarmTimers", { user: EvmAddress }];
type Effect =
  | ScheduleActiveEffect
  | RebuildAlarmTimersEffect
  | CancelAlarmTimersEffect;

type ScheduleEventHandler<T extends any[]> = (
  state: State,
  ...args: T
) => {
  newState: State;
  effects: Effect[];
};

const addNotificationDevice: ScheduleEventHandler<[NotificationRow]> = (
  state: State,
  notification: NotificationRow
) => {
  const user = notification.user_address as EvmAddress;
  const notificationState = state[user] ?? {};
  const newState = {
    ...state,
    [notification.user_address as EvmAddress]: {
      ...notificationState,
      notifications: [...(notificationState.notifications ?? []), notification],
    },
  };

  const firstNotification = !notificationState.notifications;

  return {
    newState,
    effects: [
      firstNotification
        ? ["ScheduleActiveAlarms", { user }]
        : ["RebuildAlarmTimers", { user }],
    ],
  };
};

const removeNotificationDevice: ScheduleEventHandler<[NotificationRow]> = (
  state: State,
  notification: NotificationRow
) => {
  const user = notification.user_address as EvmAddress;
  const notificationState = state[user] ?? {};
  const newNotifications = notificationState.notifications?.filter(
    (n) => n.device_id !== notification.device_id
  );

  const newState = {
    ...state,
    [user]: {
      ...notificationState,
      notifications: notificationState.notifications?.filter(
        (n) => n.device_id !== notification.device_id
      ),
    },
  };

  const shouldCancelTimers = !newNotifications?.length;

  return {
    newState,
    effects: [
      shouldCancelTimers
        ? ["CancelAlarmTimers", { user }]
        : ["RebuildAlarmTimers", { user }],
    ],
  };
};

const handleSchedulerEvent: ScheduleEventHandler<[SchedulerEvent]> = (
  state: State,
  event: SchedulerEvent
) => {
  switch (event.name) {
    case "notificationAdded":
      return addNotificationDevice(state, event.data);
    case "notificationDeleted":
      return removeNotificationDevice(state, event.data);
    case "notificationUpdated":
      return updateNotificationDevice(event.data, state);
    case "alarmActivated":
      return scheduleAlarm(event.data, state);
    case "alarmDeactivated":
      return cancelAlarm(event.data, state);
  }
};

async function processEffects(
  state: State,
  effects: ((state: State) => Promise<State> | State)[]
) {
  if (!effects.length) return state;
  try {
    const newState = await effects[0](state);
    return processEffects(newState, effects.slice(1));
  } catch (e) {
    console.error(e);
    return processEffects(state, effects.slice(1));
  }
}

async function mainLoop(
  getNextEvent: () => SchedulerEvent | undefined,
  state: State
) {
  const event = getNextEvent();

  if (!event) return mainLoop(getNextEvent, state);

  const { newState, effects } = handleSchedulerEvent(state, event);
  const finalState = await processEffects(newState, effects);

  mainLoop(getNextEvent, finalState);
}

mainLoop(MakeDbEventSource(supabaseClient), {});
