import { derived, get, writable, type Readable } from "svelte/store";
import { account } from "../lib/chainClient";
import { createAlarm as _createAlarm } from "../lib/alarmHelpers";
import { hub } from "../lib/contractStores";
import { parseEther, type Hash, type TransactionReceipt } from "viem";

export const SelectionWheel = (numItems: number) => {
  const i = writable(0); // Selected index
  return {
    subscribe: derived(i, ($i) => ({
      selected: $i,
      atEnd: $i === numItems - 1,
      atStart: $i === 0,
    })).subscribe,

    next: () => {
      if (get(i) === numItems - 1) return;
      i.set(get(i) + 1);
    },
    prev: () => {
      if (get(i) === 0) return;
      i.set(get(i) - 1);
    },
  };
};

type Days = "M" | "T" | "W" | "Th" | "F" | "Sa" | "Su";

type ActiveDays = {
  [key in Days]: boolean;
};

export enum TimezoneMode {
  SAME_ABSOLUTE_TIME,
  SAME_TIME_OF_DAY,
}

export const alarmDays = writable({
  Su: false,
  M: false,
  T: false,
  W: false,
  Th: false,
  F: false,
  Sa: false,
});

type CreationParams = {
  buyIn: bigint;
  submissionWindow: number;
  timezoneMode: TimezoneMode;
  alarmTime: number;
  alarmDays: number[];
  otherPlayer: string;
  missedAlarmPenalty: bigint;
};

export const buyIn = writable<number>(0.001);
export const timezoneMode = writable<TimezoneMode>(
  TimezoneMode.SAME_TIME_OF_DAY
);
export const alarmTime = writable<string>("06:30");
export const submissionWindow = writable<number>(60 * 30);
export const missedAlarmPenalty = writable(parseEther(".01"));
export const otherPlayer = writable<string>(
  "0x9B8DB9bffcCd1F2Cc5044d67a1b9C68dD6Deff6a"
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
