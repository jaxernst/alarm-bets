import { account, network, supportedChains } from "./chainConfig";
import { derived, writable, type Readable, get } from "svelte/store";
import {
  getUserAlarmsByType,
  type AlarmBaseInfo,
  getAlarmConstants,
  getStatus,
  getTimeToNextDeadline,
  getAlarmState,
  endAlarm,
  addToBalance,
} from "./alarmHelpers";
import { transactions } from "./transactions";
import type { EvmAddress } from "../types";
import { AlarmStatus } from "@sac/contracts/lib/types";
import { watchContractEvent } from "@wagmi/core";
import PartnerAlarmClock from "./abi/PartnerAlarmClock";
import SocialAlarmClockHub from "./abi/SocialAlarmClockHub";
import { deploymentChainIds, hubDeployments } from "./deployments";
import { parseEther } from "viem";

export type UserAlarm = Awaited<ReturnType<typeof UserAlarmStore>>;
export type AlarmState = {
  status: AlarmStatus;
  timeToNextDeadline: bigint;
  player1MissedDeadlines: bigint | undefined;
  player2MissedDeadlines: bigint | undefined;
  player1Balance: bigint | undefined;
  player2Balance: bigint | undefined;
  player1Confirmations: bigint | undefined;
  player2Confirmations: bigint | undefined;
  player1Timezone: bigint | undefined;
  player2Timezone: bigint | undefined;
};

type NetworkError = "UNSUPPORTED_NETWORK" | "NO_CHAIN";

export const networkError = writable<NetworkError | undefined>();

export const hub = derived(network, ($network) => {
  const chainId = $network?.chain?.id;
  if (!chainId) {
    networkError.set("NO_CHAIN");
    return undefined;
  } else if (
    !(chainId in hubDeployments) ||
    !supportedChains.map((c) => c.id).includes(chainId as any)
  ) {
    networkError.set("UNSUPPORTED_NETWORK");
    return undefined;
  } else {
    networkError.set(undefined);
  }

  return hubDeployments[chainId as (typeof deploymentChainIds)[number]];
});

/*
 * Callback to get a non-nullable Hub for contexts and pages where the hub is assumed to always be defined
 */
export const getRequiredHub = derived(hub, ($hub) => {
  return () => {
    if (!$hub) throw new Error("No account connected");
    return $hub;
  };
}) as Readable<() => EvmAddress>;

const alarmQueryDeps = derived([account, hub], ([$user, $hub]) => {
  return {
    user: $user?.address,
    hub: $hub,
  };
});

// Get alarm info for all non-cancelled alarms
function MakeUserAlarmsRecord() {
  const userAlarms = writable<Record<number, UserAlarm>>({});

  const addAlarm = async (
    user: EvmAddress,
    alarmAddr: EvmAddress,
    id: number,
    creationBlock: number,
    initialStatus: AlarmStatus
  ) => {
    const alarm = await UserAlarmStore(user, {
      contractAddress: alarmAddr,
      id,
      creationBlock,
      status: initialStatus,
    });

    userAlarms.update((s) => ({ ...s, [Number(id)]: alarm }));
  };

  // Auto fetch user alarms and create stores for them
  alarmQueryDeps.subscribe(async ({ hub: $hub, user: $user }) => {
    if (!$user || !$hub) return {};
    const alarms = await getUserAlarmsByType($hub, $user, "PartnerAlarmClock");
    if (!alarms) return {};

    const currentAlarms = get(userAlarms);
    for (const [id, alarm] of Object.entries(alarms)) {
      if (
        get(userAlarms)[Number(id)] ||
        alarm.status === AlarmStatus.CANCELLED
      ) {
        continue;
      }
      currentAlarms[Number(id)] = await UserAlarmStore($user, alarm);
      userAlarms.set(currentAlarms);
    }
  });

  // Event listener stores
  const newAlarmListener = writable<(() => void) | undefined>();
  const joinedAlarmListener = writable<(() => void) | undefined>();

  // Create new alarm event listeners
  alarmQueryDeps.subscribe(({ hub: $hub, user: $user }) => {
    const _newAlarmListener = get(newAlarmListener);
    if (_newAlarmListener) {
      console.log("Removed new alarm listener");
      _newAlarmListener(); // Unsub function
      newAlarmListener.set(undefined);
    }

    const _joinedAlarmListener = get(joinedAlarmListener);
    if (_joinedAlarmListener) {
      console.log("Removed joined alarm listener");
      _joinedAlarmListener(); // Unsub funciton
      joinedAlarmListener.set(undefined);
    }

    // Do not set a new listener without a hub and user
    if (!$hub || !$user) return;

    if (!get(newAlarmListener)) {
      console.log("set new alarm listener for ", $user);
      newAlarmListener.set(
        watchContractEvent(
          {
            address: $hub,
            abi: SocialAlarmClockHub,
            eventName: "AlarmCreation",
          },
          ([log]) => {
            if (log.args.user !== $user) return;
            if (!log.args.alarmAddr || !log.args.id)
              throw Error("Creation event invalid");
            addAlarm(
              $user,
              log.args.alarmAddr,
              Number(log.args.id),
              Number(log.blockNumber),
              AlarmStatus.INACTIVE
            );
          }
        )
      );
    }

    if (!get(joinedAlarmListener)) {
      console.log("set joined alarm listener for ", $user);
      joinedAlarmListener.set(
        watchContractEvent(
          {
            address: $hub,
            abi: SocialAlarmClockHub,
            eventName: "UserJoined",
          },
          ([log]) => {
            if (log.args.user !== $user) return;
            if (!log.args.alarmAddr || !log.args.id)
              throw Error("Creation event invalid");
            addAlarm(
              $user,
              log.args.alarmAddr,
              Number(log.args.id),
              Number(log.blockNumber),
              AlarmStatus.ACTIVE
            );
          }
        )
      );
    }
  });

  // Clear state when user or hub changes
  let lastAccount: EvmAddress | undefined;
  let lastHub: EvmAddress | undefined;
  alarmQueryDeps.subscribe(({ user: $user, hub: $hub }) => {
    if (
      (lastAccount && $user !== lastAccount) ||
      (lastHub && $hub !== lastHub)
    ) {
      userAlarms.set({});
    }
    lastAccount = $user;
    lastHub = $hub;
  });

  return {
    subscribe: userAlarms.subscribe,
    getByStatus: (statusArr: AlarmStatus[]) => {
      return Object.values(get(userAlarms)).filter((alarm) =>
        statusArr.includes(get(alarm).status)
      );
    },
    removeAlarm: (id: number) => {
      userAlarms.update((alarms) => {
        const { [id]: _, ...updatedAlarms } = alarms;
        return updatedAlarms;
      });
    },
  };
}

export const userAlarms = MakeUserAlarmsRecord();

/**
 * Store that exposes alarm actions, sets listeners to re-query when deadlines are passed,
 * and caches alarm data
 */
async function UserAlarmStore(user: EvmAddress, alarm: AlarmBaseInfo) {
  const addr = alarm.contractAddress;

  const constants = writable({
    id: alarm.id,
    address: addr,
    ...(await getAlarmConstants(addr)),
  });

  const alarmState = writable<Partial<AlarmState> & { status: AlarmStatus }>({
    status: alarm.status,
  });

  let stateInitialized = false;
  const initAlarmState = derived(constants, ($constants) => {
    return async () => {
      const [p1, p2] = [$constants.player1, $constants.player2];
      if (!p1 || !p2) throw new Error("Constants not available");

      let _alarmState: Partial<AlarmState> = {
        // Don't query for status on first state initializaiton (already passed in with 'alarm')
        status: stateInitialized ? await getStatus(addr) : alarm.status,
      };

      if (_alarmState.status === AlarmStatus.ACTIVE) {
        _alarmState = {
          ..._alarmState,
          ...(await getAlarmState(addr, user, p1, p2)),
        };
      }

      stateInitialized = true;

      alarmState.update((s) => ({
        ...s,
        ..._alarmState,
      }));
    };
  }) as Readable<() => Promise<void>>;

  // Function to run at an interval for decrementing the time to next alarm
  const timeToDeadlineUpdater = (timeDeltaSeconds: number) => {
    alarmState.update((s) => {
      if (!s || !s.timeToNextDeadline) return s;
      return {
        ...s,
        timeToNextDeadline: s.timeToNextDeadline - BigInt(timeDeltaSeconds),
      };
    });
  };

  // Manage count down timers on alarm state
  const countdownInterval = 1; // Update countdown every second

  let interval: ReturnType<typeof setInterval>;
  let reinitializingState = false;

  alarmState.subscribe((state) => {
    if (!state) {
      console.error("Invariant error: alarm state should never be undefined");
      return;
    }
    // Set interval when there's no interval set, alarm is active, and there's a time value to decrement
    if (
      !interval &&
      state.status === AlarmStatus.ACTIVE &&
      state.timeToNextDeadline
    ) {
      interval = setInterval(
        () => timeToDeadlineUpdater(countdownInterval),
        countdownInterval * 1000
      );
    }
    // Re-query for alarm state once deadline has passed
    if (
      state.timeToNextDeadline !== undefined &&
      state.timeToNextDeadline <= 0 &&
      !reinitializingState
    ) {
      console.log("getting new alarm state");
      reinitializingState = true;
      get(initAlarmState)().finally(() => (reinitializingState = false));
    }
    // Clear interval for inactive alarms
    if (state.status !== AlarmStatus.ACTIVE) clearInterval(interval);
  });

  // Add status change listener
  watchContractEvent(
    {
      address: addr,
      abi: PartnerAlarmClock,
      eventName: "StatusChanged",
    },
    ([log]) => {
      console.log("Status changed", log);
      const newStatus = log.args.to! as AlarmStatus;
      alarmState.update((s) => ({ ...s, status: newStatus }));
      if (newStatus === AlarmStatus.CANCELLED) {
        userAlarms.removeAlarm(get(constants).id);
      }
    }
  );

  // Listen for confirmation events and update alarm state
  watchContractEvent(
    {
      address: addr,
      abi: PartnerAlarmClock,
      eventName: "ConfirmationSubmitted",
    },
    ([log]) => {
      let newConfirmationCount: Partial<AlarmState>;
      alarmState.update((s) => {
        if (log.args.from === get(constants).player1) {
          newConfirmationCount = {
            player1Confirmations: (s.player1Confirmations ?? 0n) + 1n,
          };
        } else {
          newConfirmationCount = {
            player2Confirmations: (s.player2Confirmations ?? 0n) + 1n,
          };
        }
        return { ...s, ...newConfirmationCount };
      });
    }
  );

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
    addToBalance: async (player: EvmAddress, ethAmount: number) => {
      const parsedAmount = parseEther(ethAmount.toString() as `${number}`);
      const res = await transactions.addTransaction(
        addToBalance(addr, player, parsedAmount)
      );

      if (!res.error) {
        alarmState.update((s) => ({
          ...s,
          ...(player === get(constants).player1
            ? { player1Balance: (s.player1Balance ?? 0n) + parsedAmount }
            : { player2Balance: (s.player2Balance ?? 0n) + parsedAmount }),
        }));
      }

      return res;
    },
    endAlarm: async () => {
      const res = await transactions.addTransaction(endAlarm(addr));
      return res;
    },
    syncTimeToDeadline: async () => {
      const [p1, p2] = [get(constants).player1, get(constants).player2];
      const timeToNextDeadline = await getTimeToNextDeadline(
        addr,
        p1 === user ? p1 : p2
      );
      alarmState.update((s) => ({ ...s, timeToNextDeadline }));
    },
  };
}
