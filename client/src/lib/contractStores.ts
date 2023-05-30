import { account } from "./chainClient";
import { derived, writable, type Readable, get } from "svelte/store";
import {
  getUserAlarmsByType,
  type AlarmBaseInfo,
  getAlarmConstants,
  getStatus,
  getMissedDeadlines,
  getTimeToNextDeadline,
  getPlayerBalance,
  getNumConfirmations,
} from "./alarmHelpers";
import { transactions } from "./transactions";
import type { EvmAddress } from "../types";
import { AlarmStatus } from "@sac/contracts/lib/types";

export const hub = writable<EvmAddress>(
  "0x5fbdb2315678afecb367f032d93f642f64180aa3"
);

// Will add listeners to update alarm state and alarm fields after transactions
let lastAccount: string;
export const userAlarms = derived(
  [account, hub, transactions],
  ([$user, $hub, _], set) => {
    if (!$user?.address) return set({});

    let alarmStores: Record<string, UserAlarm> = get(userAlarms);
    if (lastAccount && lastAccount !== $user.address) {
      alarmStores = {};
      console.log("Notice: resetting alarm stores");
      set(alarmStores);
    }
    lastAccount = $user.address;

    const queryAndMakeAlarmStores = async (
      hub: EvmAddress,
      user: EvmAddress
    ) => {
      const alarms = await getUserAlarmsByType(hub, user, "PartnerAlarmClock");
      if (!alarms) return {};

      for (const [id, alarm] of Object.entries(alarms)) {
        if (alarmStores[Number(id)]) {
          console.log("Alarm store already made", id);
          continue;
        }
        alarmStores[Number(id)] = await UserAlarmStore(alarm);
      }

      return alarmStores;
    };

    queryAndMakeAlarmStores($hub, $user.address)
      .then((res) => set(res))
      .catch((e) => console.log("Could not fetch alarms", e));
  },
  {}
) as Readable<Record<number, UserAlarm>>;

export type UserAlarm = Awaited<ReturnType<typeof UserAlarmStore>>;
export type AlarmState = {
  status: AlarmStatus;
  timeToNextDeadline: bigint;
  player1MissedDeadlines: bigint;
  player2MissedDeadlines: bigint;
  player1Balance: bigint;
  player2Balance: bigint;
  player1Confirmations: bigint;
  player2Confirmations: bigint;
};

/**
 * Store that exposes alarm actions, sets listeners to re-query when deadlines are passed,
 * and caches alarm data
 */
async function UserAlarmStore(alarm: AlarmBaseInfo) {
  const addr = alarm.contractAddress;
  const constantsResult = await getAlarmConstants(addr);
  const constants = writable({
    id: alarm.id,
    address: addr,
    ...constantsResult,
  });

  const alarmState = writable<AlarmState>();

  const initAlarmState = derived(constants, ($constants) => {
    return async () => {
      const [p1, p2] = [$constants.player1, $constants.player2];
      if (!p1 || !p2) throw new Error("Constants not available");

      let _alarmState: Partial<AlarmState> = {
        status: await getStatus(addr),
      };

      if (_alarmState.status === AlarmStatus.ACTIVE) {
        _alarmState = {
          ..._alarmState,
          timeToNextDeadline: await getTimeToNextDeadline(addr, p1),
          player1MissedDeadlines: await getMissedDeadlines(addr, p1),
          player2MissedDeadlines: await getMissedDeadlines(addr, p2),
          player1Confirmations: await getNumConfirmations(addr, p1),
          player2Confirmations: await getNumConfirmations(addr, p2),
          player1Balance: await getPlayerBalance(addr, p1),
          player2Balance: await getPlayerBalance(addr, p2),
        };
      }

      alarmState.update((s) => ({
        ...s,
        ..._alarmState,
      }));
    };
  }) as Readable<() => Promise<void>>;

  const syncTimeToDeadline = derived(constants, ({ player1 }) => {
    return async () => {
      const timeToNextDeadline = await getTimeToNextDeadline(addr, player1);
      alarmState.update((s) => ({ ...s, timeToNextDeadline }));
    };
  }) as Readable<() => Promise<void>>;

  // Decrement time to next deadline counter
  const timeToDeadlineUpdater = () => {
    alarmState.update((s) => {
      if (!s || !s.timeToNextDeadline) return s;
      return {
        ...s,
        timeToNextDeadline: s.timeToNextDeadline - BigInt(1),
      };
    });
  };

  let interval: ReturnType<typeof setInterval>;
  alarmState.subscribe((s) => {
    if (!s) return;
    // Set interval when there's no interval set, alarm is active, and there's a time value to decrement
    if (!interval && s.status === AlarmStatus.ACTIVE && s.timeToNextDeadline) {
      interval = setInterval(timeToDeadlineUpdater, 1000);
    }
    // Re-query for time to deadline once 0 is hit
    if (s.timeToNextDeadline <= 0) get(syncTimeToDeadline)();
    // Clear interval for inactive alarms
    if (s.status !== AlarmStatus.ACTIVE) clearInterval(interval);
  });

  // Consolidate params into single store
  const { subscribe } = derived(
    [constants, alarmState],
    ([$constants, $state]) => {
      return {
        ...$constants,
        ...$state,
      };
    }
  );

  // Initialize alarm state automatically when created
  get(initAlarmState)();

  return {
    subscribe,
    initAlarmState: get(initAlarmState),
    submitConfirmation: async () => {},
    startAlarm: async () => {},
    syncTimeToDeadline: async () => {
      const p1 = get(constants).player1;
      const timeToNextDeadline = await getTimeToNextDeadline(addr, p1);
      alarmState.update((s) => ({ ...s, timeToNextDeadline }));
    },
  };
}
