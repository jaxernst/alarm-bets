import { SupabaseClient } from "@supabase/supabase-js";
import { Alarm, AlarmId, EvmAddress, NotificationRow } from "../types";
import { alarmRescheduleQueue, processEffects } from "./effects";
import { SchedulerEvent, handleSchedulerEvent } from "./events";
import { Database } from "../../../alarm-bets-db";

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
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Main loop", new Date().toUTCString());

  const event = getNextEvent();
  const alarmRescheduleEffect = alarmRescheduleQueue.next() ?? [];

  if (!event && !alarmRescheduleEffect.length) {
    return mainLoop(getNextEvent, state);
  }

  event ? console.log("\nNew event:", event) : null;
  console.log("\nCurrent state:", state);

  const { newState, effects } = event
    ? handleSchedulerEvent(state, event)
    : { newState: state, effects: [] };

  const combinedEffects = [...effects, alarmRescheduleEffect];
  console.log("Effects:", combinedEffects);

  const finalState = combinedEffects.length
    ? await processEffects(newState, effects)
    : newState;

  console.log("\nFinal state:", finalState);
  mainLoop(getNextEvent, finalState);
}
