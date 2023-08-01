import { derived, get, writable, type Readable } from "svelte/store";
import { account } from "../lib/chainClient";
import { createAlarm as _createAlarm } from "../lib/alarmHelpers";
import { hub } from "../lib/dappStores";
import { parseEther, type Hash } from "viem";

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
export const timezoneOffsetConfirmed = writable(false);
export const timezoneOffset = writable<number>(
  -new Date().getTimezoneOffset() / 60
);

export const playerInputErrorMsg = writable<string | undefined>(undefined);
export const penaltyInputErrorMsg = writable<string | undefined>(undefined);
export const creationErrorMsg = derived(
  [playerInputErrorMsg, penaltyInputErrorMsg],
  ([$playerError, $penaltyError]) => $playerError || $penaltyError
);

const bundledParams = derived(
  [
    account,
    otherPlayer,
    alarmDays,
    alarmTime,
    deposit,
    missedAlarmPenalty,
    submissionWindow,
    timezoneOffset,
    timezoneOffsetConfirmed,
  ],
  (p) => ({
    account: p[0],
    otherPlayer: p[1],
    alarmDays: p[2],
    alarmTime: p[3],
    deposit: p[4],
    missedAlarmPenalty: p[5],
    submissionWindow: p[6],
    timezoneOffset: p[7],
    timezoneOffsetConfirmed: p[8],
  })
);

// Add check to make sure missed alarm penalty is less than or equal to buy in
export const isReady = derived(bundledParams, (p) => {
  return (
    p.account?.address &&
    p.submissionWindow > 0 &&
    p.otherPlayer !== p.account.address &&
    p.alarmDays.length > 0 &&
    p.alarmDays.every((day) => day >= 1 && day <= 7) &&
    p.alarmTime.length > 0 &&
    p.deposit > 0 &&
    p.missedAlarmPenalty > 0 &&
    p.timezoneOffsetConfirmed &&
    p.timezoneOffset >= -12 &&
    p.timezoneOffset <= 12
  );
});

export const createAlarm = derived(
  [bundledParams, isReady, hub],
  ([p, $isReady, $hub]) => {
    return () => {
      if (!$isReady || !$hub || !p.account?.address) {
        return console.error("Cannot create alarm: Params invalid");
      }

      return _createAlarm(
        $hub,
        "PartnerAlarmClock",
        {
          alarmTime: timeStringToSeconds(p.alarmTime),
          alarmDays: p.alarmDays.sort(),
          missedAlarmPenalty: parseEther(`${p.missedAlarmPenalty}`),
          submissionWindow: p.submissionWindow,
          player1TimezoneOffset: p.timezoneOffset * 60 * 60,
          player1: p.account.address,
          player2: p.otherPlayer,
        },
        parseEther(`${p.deposit}`)
      );
    };
  }
) as Readable<() => Promise<Hash> | undefined>;

function timeStringToSeconds(timeString: string) {
  const [hours, minutes] = timeString.split(":");

  let totalSeconds = 0;

  // Calculate total seconds
  totalSeconds += parseInt(hours, 10) * 3600; // 1 hour = 3600 seconds
  totalSeconds += parseInt(minutes, 10) * 60; // 1 minute = 60 seconds

  return totalSeconds;
}
