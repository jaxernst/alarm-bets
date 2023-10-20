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

const addNotifiedUserAlarm: ScheduleEventHandler<{
  user: EvmAddress;
  alarm: Alarm;
}> = (state: State, { user, alarm }) => {
  const alarmState = state[user] ?? {};
  const notificationsOn = alarmState.notifications?.length;

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
    effects: notificationsOn ? [["RebuildAlarmTimers", { user, alarm }]] : [],
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
      throw new Error("Not implemented");
    //return updateNotificationDevice(event.data, state);
    case "alarmActivated":
      const player1Added = addNotifiedUserAlarm(state, {
        user: event.data.player1 as EvmAddress,
        alarm: compactAlarmFormat(event.data.player1 as EvmAddress, event.data),
      });

      const player2Added = addNotifiedUserAlarm(player1Added.newState, {
        user: event.data.player2 as EvmAddress,
        alarm: compactAlarmFormat(event.data.player1 as EvmAddress, event.data),
      });

      return {
        newState: player2Added.newState,
        effects: player1Added.effects.concat(player2Added.effects),
      };

    case "alarmDeactivated":
      throw new Error("Not implemented");
    //return cancelAlarm(event.data, state);
  }
};
