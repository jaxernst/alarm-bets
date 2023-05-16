import {
  solidityInitializationTypes,
  alarmFactories,
  type AlarmContractTypes,
  type AlarmType,
  type InitializationTypes,
  alarmTypeVals,
  AlarmStatus,
} from "@sac/contracts/lib/types";
import type {
  PartnerAlarmClock,
  SocialAlarmClockHub,
} from "@sac/contracts/typechain-types";
import type { EvmAddress } from "../types";
import { ethers, Signer, type BigNumberish } from "ethers";

/**
 * Get the alarm most recentely created or joined by the user
 */
export const getAlarms = async (
  hub: SocialAlarmClockHub,
  userAddress: string
) => {
  return getUserAlarmsByType(hub, "PartnerAlarmClock");
};

export const getAlarmById = async (
  id: string,
  commitmentHub: SocialAlarmClockHub
) => {
  const commitmentAddr = await commitmentHub.alarms(id);
  if (!commitmentAddr) return;
  return getAlarm("PartnerAlarmClock", commitmentAddr, commitmentHub.signer);
};

export const getBetStanding = async (
  targetPlayer: EvmAddress,
  alarm: PartnerAlarmClock
) => {
  const otherPlayer = await getOtherPlayer(alarm, targetPlayer);
  const urMissedDeadlines = await alarm.missedDeadlines(targetPlayer);
  const theirMissedDeadlines = await alarm.missedDeadlines(otherPlayer);
  const alarmPenalty = await alarm.missedAlarmPenalty();
  return alarmPenalty.mul(theirMissedDeadlines.sub(urMissedDeadlines));
};

export const getOtherPlayer = async (
  alarm: PartnerAlarmClock,
  user: string
) => {
  const player1 = await alarm.player1();
  const player2 = await alarm.player2();
  return player1 === user ? player2 : player1;
};

export async function createAlarm<T extends AlarmType>(
  hub: SocialAlarmClockHub,
  type: T,
  initData: InitializationTypes[T],
  value?: BigNumberish
) {
  const byteData = encodeCreationParams(type, initData);
  return hub.createAlarm(alarmTypeVals[type], byteData, {
    value: value ? value : 0,
  });
}

export function encodeCreationParams<T extends AlarmType>(
  name: T,
  initData: InitializationTypes[T]
): string {
  return ethers.utils.defaultAbiCoder.encode(
    solidityInitializationTypes[name],
    Object.values(initData)
  );
}

export function getAlarm<T extends keyof AlarmContractTypes>(
  type: T,
  address: string,
  signer: Signer
): AlarmContractTypes[T] {
  const factory = alarmFactories[type];
  return factory.connect(address, signer) as AlarmContractTypes[T];
}

type AlarmId = number;
export type AlarmInfo<T extends AlarmType> = {
  id: number;
  contract: AlarmContractTypes[T];
  creationBlock: number;
  status: AlarmStatus;
};

export async function getUserAlarmsByType<T extends AlarmType>(
  hub: SocialAlarmClockHub,
  type: T
): Promise<Record<AlarmId, AlarmInfo<T>> | undefined> {
  if (!hub.signer) throw new Error("Hub contract must include signer");

  const account = await hub.signer.getAddress();
  const creationEvents = await queryAlarmCreationEvents(hub, account, type);

  if (!creationEvents) return;

  const out: Record<AlarmId, AlarmInfo<T>> = {};
  for (const { args, blockNumber } of creationEvents) {
    const contract = getAlarm(
      type,
      args.alarmAddr,
      hub.signer
    ) as AlarmContractTypes[T];

    const id = args.id.toNumber();
    out[id] = {
      id,
      contract,
      creationBlock: blockNumber,
      status: await contract.status(),
    };
  }

  return out;
}

export async function queryAlarmCreationEvents(
  hub: SocialAlarmClockHub,
  address: string,
  alarmType?: AlarmType
) {
  return await hub.queryFilter(
    hub.filters.AlarmCreation(
      address,
      alarmType ? alarmTypeVals[alarmType] : undefined
    )
  );
}

export async function queryUserJoinedEvents(
  hub: SocialAlarmClockHub,
  address: string,
  alarmType: AlarmType
) {
  return await hub.queryFilter(
    hub.filters.UserJoined(alarmTypeVals[alarmType], address)
  );
}
