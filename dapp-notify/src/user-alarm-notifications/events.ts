import { add } from "winston";
import { Alarm, AlarmRow, EvmAddress, NotificationRow } from "../types";
import { compactAlarmFormat } from "../util/util";
import { Effect } from "./effects";
import { State } from "./main";

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

export type SchedulerEvent =
  | NotificationAddedEvent
  | NotificationDeletedEvent
  | NotificationUpdatedEvent
  | AlarmActivatedEvent
  | AlarmDeactivatedEvent;

type ScheduleEventHandler<T> = (
  state: State,
  args: T
) => {
  newState: State;
  effects: Effect[];
};

const addNotificationDevice: ScheduleEventHandler<NotificationRow> = (
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

const removeNotificationDevice: ScheduleEventHandler<NotificationRow> = (
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
        ? ["CancelAllAlarmTimers", { user }]
        : ["RebuildAlarmTimers", { user }],
    ],
  };
};

const updateNotificationDevice: ScheduleEventHandler<NotificationRow> = (
  state: State,
  notification: NotificationRow
) => {
  const user = notification.user_address as EvmAddress;
  const notificationState = state[user] ?? {};

  if (!notificationState.notifications) {
    return addNotificationDevice(state, notification);
  }

  const newNotifications = notificationState.notifications?.map((n) =>
    n.device_id === notification.device_id ? notification : n
  );

  const newState = {
    ...state,
    [user]: {
      ...notificationState,
      notifications: newNotifications,
    },
  };

  return {
    newState,
    effects: [["RebuildAlarmTimers", { user }]],
  };
};

// Add alarm to state if the user is notified
const maybeAddAlarm: ScheduleEventHandler<{
  user: EvmAddress;
  alarm: Alarm;
}> = (state, { user, alarm }) => {
  const alarmState = state[user] ?? {};
  const notificationsOn = alarmState.notifications?.length;
  if (!notificationsOn) return { newState: state, effects: [] };

  const newState = {
    ...state,
    [user]: {
      ...alarmState,
      alarmTimers: {
        ...alarmState.alarmTimers,
        [alarm.alarmId]: {
          timer: undefined,
          alarm,
        },
      },
    },
  };

  return {
    newState,
    effects: [["StartTimer", { user, alarm }]],
  };
};

const maybeRemoveAlarm: ScheduleEventHandler<{
  user: EvmAddress;
  alarmId: number;
}> = (state, { user, alarmId }) => {
  const alarmState = state[user] ?? {};
  const alarmTimers = alarmState.alarmTimers;
  const notificationsOn = alarmState.notifications?.length;

  if (!notificationsOn || !alarmTimers?.[alarmId]) {
    return { newState: state, effects: [] };
  }

  return {
    newState: state,
    effects: [["CancelTimer", { user, alarmId, timer: alarmTimers[alarmId] }]],
  };
};

export const handleSchedulerEvent: ScheduleEventHandler<SchedulerEvent> = (
  state: State,
  event: SchedulerEvent
) => {
  switch (event.name) {
    case "notificationAdded":
      return addNotificationDevice(state, event.data);
    case "notificationDeleted":
      return removeNotificationDevice(state, event.data);
    case "notificationUpdated":
      return updateNotificationDevice(state, event.data);
    //return updateNotificationDevice(event.data, state);
    case "alarmActivated": {
      const s1 = maybeAddAlarm(state, {
        user: event.data.player1 as EvmAddress,
        alarm: compactAlarmFormat(event.data.player1 as EvmAddress, event.data),
      });

      const s2 = maybeAddAlarm(s1.newState, {
        user: event.data.player2 as EvmAddress,
        alarm: compactAlarmFormat(event.data.player1 as EvmAddress, event.data),
      });

      return {
        newState: s2.newState,
        effects: s1.effects.concat(s2.effects),
      };
    }

    case "alarmDeactivated":
      const s1 = maybeRemoveAlarm(state, {
        user: event.data.player1 as EvmAddress,
        alarmId: event.data.alarm_id,
      });

      const s2 = maybeRemoveAlarm(s1.newState, {
        user: event.data.player2 as EvmAddress,
        alarmId: event.data.alarm_id,
      });

      return {
        newState: s2.newState,
        effects: s1.effects.concat(s2.effects),
      };
  }
};
