import type { BigNumberish } from "ethers";
import {
  type PartnerAlarmClock,
  PartnerAlarmClock__factory,
} from "../typechain-types";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const alarmTypeVals: Record<AlarmType, number> = {
  PartnerAlarmClock: 0,
};

export const alarmValToType: Record<number, AlarmType> = {
  0: "PartnerAlarmClock",
};

export type AlarmType = "PartnerAlarmClock";

export type AlarmContractTypes = {
  PartnerAlarmClock: PartnerAlarmClock;
};

export const alarmFactories = {
  PartnerAlarmClock: PartnerAlarmClock__factory,
};

export type InitializationTypes = {
  PartnerAlarmClock: {
    alarmTime: BigNumberish;
    alarmdays: BigNumberish;
    submissionWindow: BigNumberish;
    missedAlarmPenalty: BigNumberish;
    timezoneOffset: BigNumberish;
    otherPlayer: string;
  };
};

export const solidityInitializationTypes = {
  PartnerAlarmClock: [
    "uint256",
    "uint8[]",
    "uint256",
    "uint256",
    "int256",
    "address",
  ],
};

export enum AlarmStatus {
  INACTIVE,
  ACTIVE,
  PAUSED,
  COMPLETE,
  CANCELLED,
}
