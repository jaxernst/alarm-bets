import { BigNumberish } from "ethers";
import {
  PartnerAlarmClock,
  PartnerAlarmClock__factory,
} from "../typechain-types";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const commitmentTypeVals: Record<CommitmentType, number> = {
  PartnerAlarmClock: 0,
};

export const commitmentValToType: Record<number, CommitmentType> = {
  0: "PartnerAlarmClock",
};

export type CommitmentType = "PartnerAlarmClock";

export type CommitmentContractTypes = {
  PartnerAlarmClock: PartnerAlarmClock;
};

export const alarmFactories = {
  PartnerAlarmClock: PartnerAlarmClock__factory,
};

export type InitializationTypes = {
  BaseCommitment: { name: string; description: string };
  TimelockingDeadlineTask: {
    deadline: BigNumberish;
    submissionWindow: BigNumberish;
    timelockDuration: BigNumberish;
    taskDescription: BigNumberish;
  };
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

export enum CommitmentStatus {
  INACTIVE,
  ACTIVE,
  PAUSED,
  COMPLETE,
  CANCELLED,
}
