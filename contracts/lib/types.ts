import type { BigNumberish } from "ethers";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const alarmTypeVals: Record<AlarmType, number> = {
  PartnerAlarmClock: 0,
};

export const alarmValToType: Record<number, AlarmType> = {
  0: "PartnerAlarmClock",
};

export type AlarmType = "PartnerAlarmClock";

export type InitializationTypes = {
  PartnerAlarmClock: {
    alarmTime: BigNumberish;
    alarmDays: BigNumberish;
    missedAlarmPenalty: BigNumberish;
    submissionWindow: BigNumberish;
    player1TimezoneOffset: BigNumberish;
    player1: string;
    player2: string;
  };
};

export const InitializationKeyOrder = {
  PartnerAlarmClock: [
    "alarmTime",
    "alarmDays",
    "missedAlarmPenalty",
    "submissionWindow",
    "player1TimezoneOffset",
    "player1",
    "player2",
  ],
};

export const solidityInitializationTypes = {
  PartnerAlarmClock: [
    "uint256",
    "uint8[]",
    "uint256",
    "uint256",
    "int256",
    "address",
    "address",
  ],
};

export const solidityNamedInitTypes = {
  PartnerAlarmClock: [
    "uint256 alarmTime",
    "uint8[] alarmDays",
    "uint256 missedAlarmPenalty",
    "uint256 submissionWindow",
    "int256 player1TimezoneOffset",
    "address player1",
    "address player2",
  ] as const,
};

export enum AlarmStatus {
  INACTIVE,
  ACTIVE,
  PAUSED,
  COMPLETE,
  CANCELLED,
}
