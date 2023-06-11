import { derived, get, writable, type Readable } from "svelte/store";
import { account } from "../lib/chainClient";
import { createAlarm as _createAlarm } from "../lib/alarmHelpers";
import { hub } from "../lib/contractStores";
import type { Hash } from "viem";

type Days = "M" | "T" | "W" | "Th" | "F" | "Sa" | "Su";

export enum TimezoneMode {
  SAME_ABSOLUTE_TIME,
  SAME_TIME_OF_DAY,
}

type CreationParams = {
  buyIn: bigint;
  submissionWindow: number;
  timezoneMode: TimezoneMode;
  alarmTime: number;
  alarmDays: number[];
  otherPlayer: string;
  missedAlarmPenalty: bigint;
};

export const otherPlayer = writable<string>("");
export const alarmDays = writable<number[]>([]);
export const alarmTime = writable<string>("");
export const deposit = writable<number>(0);
export const missedAlarmPenalty = writable(0);
export const submissionWindow = writable<number>(0);
export const timezoneOffset = writable<number>(
  -new Date().getTimezoneOffset() / 60
);

export const creationParams = writable<CreationParams>({
  buyIn: BigInt(0),
  submissionWindow: 60 * 30,
  timezoneMode: TimezoneMode.SAME_TIME_OF_DAY,
  alarmTime: 0, // 6:30 AM
  alarmDays: [],
  otherPlayer: "",
  missedAlarmPenalty: BigInt(0),
});

// Add check to make sure missed alarm penalty is less than or equal to buy in
export const isReady = derived(
  [creationParams, account],
  ([
    { submissionWindow, otherPlayer, buyIn, timezoneMode, alarmTime },
    $account,
  ]) => {
    return (
      submissionWindow > 0 &&
      otherPlayer !== $account?.address &&
      buyIn &&
      timezoneMode !== null &&
      alarmTime !== null &&
      Object.values(alarmDays).some((v) => v)
    );
  }
);

export const createAlarm = derived(
  [creationParams, isReady, hub],
  ([c, $isReady, $hub]) => {
    return () => {
      if (!$isReady) return;

      return _createAlarm(
        $hub,
        "PartnerAlarmClock",
        {
          alarmTime: c.alarmTime,
          alarmdays: c.alarmDays.sort(),
          missedAlarmPenalty: c.missedAlarmPenalty,
          submissionWindow: c.submissionWindow,
          timezoneOffset: new Date().getTimezoneOffset() * -60,
          otherPlayer: c.otherPlayer,
        },
        c.buyIn
      );
    };
  }
) as Readable<() => Promise<Hash> | undefined>;
