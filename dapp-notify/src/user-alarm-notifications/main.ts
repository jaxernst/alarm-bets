import { Alarm, AlarmId, EvmAddress, NotificationRow } from "../types";
import { alarmRescheduleQueue, processEffects } from "./effects";
import { SchedulerEvent, handleSchedulerEvent } from "./events";

export type State = Record<
  EvmAddress,
  {
    alarmTimers?: Record<
      AlarmId,
      {
        timer: NodeJS.Timeout;
        alarm: Alarm;
      }
    >;
    notifications?: NotificationRow[];
  }
>;

/**
 * Main execution loop for alarm notification scheduling.
 * - Process listens for updates to the user_alarms and
 *   notificaions table to manage timers for push notification
 *   delivery
 */
export async function mainLoop(
  getNextEvent: () => SchedulerEvent | undefined,
  state: State
) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Main loop", new Date().toUTCString());

  const event = getNextEvent();
  const alarmRescheduleEffect = alarmRescheduleQueue.next() ?? [];

  if (!event && !alarmRescheduleEffect.length) {
    return mainLoop(getNextEvent, state);
  }

  console.log("\nNew event:", event);
  console.log("\nCurrent state:", state);

  const { newState, effects } = event
    ? handleSchedulerEvent(state, event)
    : { newState: state, effects: [] };

  console.log("Effects:", effects);

  const combinedEffects = [...effects, alarmRescheduleEffect];

  const finalState = combinedEffects.length
    ? await processEffects(newState, effects)
    : newState;

  console.log("\nFinal state:", finalState);
  mainLoop(getNextEvent, finalState);
}
