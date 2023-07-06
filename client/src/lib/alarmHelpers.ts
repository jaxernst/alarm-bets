import {
  getAbiItem,
  encodeAbiParameters,
  parseAbiParameters,
  type GetFunctionArgs,
  type ReadContractParameters,
} from "viem";
import {
  getPublicClient,
  prepareWriteContract,
  writeContract,
  readContract,
  multicall,
} from "@wagmi/core";
import type { UserAlarm } from "./dappStores";
import {
  type AlarmType,
  type InitializationTypes,
  alarmTypeVals,
  solidityNamedInitTypes,
  AlarmStatus,
} from "@sac/contracts/lib/types";

import HubAbi from "./abi/SocialAlarmClockHub";
import PartnerAlarmClock from "./abi/PartnerAlarmClock";
import type { EvmAddress } from "../types";
import { get } from "svelte/store";

export const AlarmCreationEvent = getAbiItem({
  abi: HubAbi,
  name: "AlarmCreation",
});

export const AlarmJoinedEvent = getAbiItem({ abi: HubAbi, name: "UserJoined" });

export const getAlarmById = async (
  id: string | number,
  hubAddress: EvmAddress
) => {
  const alarmAddr = await readContract({
    address: hubAddress,
    abi: HubAbi,
    functionName: "alarms",
    args: [BigInt(id)],
  });

  return alarmAddr;
};

export const getAlarmConstants = async (alarmAddress: EvmAddress) => {
  const args = { address: alarmAddress, abi: PartnerAlarmClock };
  const res = await multicall({
    contracts: [
      { ...args, functionName: "alarmTime" },
      { ...args, functionName: "alarmDays" },
      { ...args, functionName: "betAmount" },
      { ...args, functionName: "player1" },
      { ...args, functionName: "player2" },
      { ...args, functionName: "missedAlarmPenalty" },
      { ...args, functionName: "submissionWindow" },
    ],
  });

  if (res.some((r) => r.status !== "success")) {
    throw new Error("Multicall error");
  }

  // Todo: Check for failures and maybe make fallback queries
  return {
    alarmTime: res[0].result,
    alarmDays: res[1].result,
    betAmount: res[2].result,
    player1: res[3].result,
    player2: res[4].result,
    missedAlarmPenalty: res[5].result,
    submissionWindow: res[6].result,
  };
};

export const getBetStanding = (
  alarmStore: UserAlarm,
  targetPlayer: EvmAddress
) => {
  const alarm = get(alarmStore);
  if (!alarm.missedAlarmPenalty) return 0;

  const zero = BigInt(0);
  let otherPlayer;
  let urMissedDeadlines: bigint = BigInt(0);
  let theirMissedDeadlines: bigint = BigInt(0);
  if (targetPlayer === alarm.player1) {
    otherPlayer = alarm.player2;
    urMissedDeadlines = alarm.player1MissedDeadlines ?? zero;
    theirMissedDeadlines = alarm.player2MissedDeadlines ?? zero;
  } else if (targetPlayer === alarm.player2) {
    otherPlayer = alarm.player1;
    urMissedDeadlines = alarm.player2MissedDeadlines ?? zero;
    theirMissedDeadlines = alarm.player1MissedDeadlines ?? zero;
  } else {
    throw new Error("Invariant error");
  }

  return alarm.missedAlarmPenalty * (theirMissedDeadlines - urMissedDeadlines);
};

export const getOtherPlayer = async (
  alarmAddress: EvmAddress,
  userAddress: EvmAddress
) => {
  const player1 = await getPlayer(alarmAddress, 1);
  if (player1 === userAddress) return player1;

  const player2 = await getPlayer(alarmAddress, 2);
  if (player2 === userAddress) return player2;

  throw new Error("Other player not found");
};

export const getPlayer = async (alarmAddress: EvmAddress, player: 1 | 2) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: player === 1 ? "player1" : "player2",
  });
};

export const getPlayerBalance = async (
  alarmAddress: EvmAddress,
  player: EvmAddress
) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "getPlayerBalance",
    args: [player],
  });
};

export const getMissedDeadlines = async (
  alarmAddress: EvmAddress,
  userAddress: EvmAddress
) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "missedDeadlines",
    args: [userAddress],
  });
};

export const getTimeToNextDeadline = async (
  alarmAddress: EvmAddress,
  player: EvmAddress
) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "timeToNextDeadline",
    args: [player],
  });
};

export const getNumConfirmations = async (
  alarmAddress: EvmAddress,
  player: EvmAddress
) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "numConfirmations",
    args: [player],
  });
};

export const getMissedAlarmPenalty = async (alarmAddress: EvmAddress) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "missedAlarmPenalty",
  });
};

export const getBetAmount = async (alarmAddress: EvmAddress) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "betAmount",
  });
};

export const getStatus = async (alarmAddress: EvmAddress) => {
  return await readContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "status",
  });
};

export async function createAlarm<T extends AlarmType>(
  hubAddress: EvmAddress,
  type: T,
  initData: InitializationTypes[T],
  value?: bigint
) {
  const byteData = encodeCreationParams(type, initData);
  const { request } = await prepareWriteContract({
    address: hubAddress,
    abi: HubAbi,
    functionName: "createAlarm",
    args: [alarmTypeVals[type], byteData],
    value: value ? value : BigInt(0),
  });

  return (await writeContract(request)).hash;
}

export async function startAlarm(alarmAddress: EvmAddress) {
  const betAmount = await getBetAmount(alarmAddress);
  const { request } = await prepareWriteContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "start",
    value: betAmount,
  });

  return (await writeContract(request)).hash;
}

export async function endAlarm(alarmAddress: EvmAddress) {
  const { request } = await prepareWriteContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "withdraw",
  });

  return (await writeContract(request)).hash;
}

export async function submitConfirmation(alarmAddress: EvmAddress) {
  const { request } = await prepareWriteContract({
    address: alarmAddress,
    abi: PartnerAlarmClock,
    functionName: "submitConfirmation",
  });

  return (await writeContract(request)).hash;
}

export function encodeCreationParams<T extends AlarmType>(
  alarmType: T,
  initData: InitializationTypes[T]
) {
  const parsedParameters = parseAbiParameters(
    solidityNamedInitTypes[alarmType].join(", ")
  );

  return encodeAbiParameters(parsedParameters, Object.values(initData));
}

export type AlarmBaseInfo = {
  id: number;
  contractAddress: EvmAddress;
  creationBlock: number;
  status: AlarmStatus;
};

export async function getUserAlarmsByType<T extends AlarmType>(
  hubAddress: EvmAddress,
  userAddress: EvmAddress,
  type: T
) {
  const creationEvents = await queryAlarmCreationEvents(
    hubAddress,
    userAddress,
    type
  );

  const joinEvents = await queryUserJoinedEvents(hubAddress, userAddress, type);

  if (!creationEvents) return;

  const out: Record<number, AlarmBaseInfo> = {};
  for (const { args, blockNumber } of [...creationEvents, ...joinEvents]) {
    if (!args.id || !args.alarmAddr || !args.user || !blockNumber)
      throw new Error("Bad event query");

    // TODO: Use a multicall to query for all alarm status at once)
    const id = Number(args.id);
    out[id] = {
      id,
      contractAddress: args.alarmAddr,
      creationBlock: Number(blockNumber),
      status: await getStatus(args.alarmAddr),
    };
  }

  return out;
}

export async function queryAlarmCreationEvents(
  hubAddress: EvmAddress,
  userAddress: EvmAddress,
  alarmType?: AlarmType
) {
  const client = getPublicClient();
  return await client.getLogs({
    address: hubAddress,
    event: AlarmCreationEvent,
    args: {
      _type: alarmType ? alarmTypeVals[alarmType] : 0,
      user: userAddress,
    },
    fromBlock: 0n,
  });
}

export async function queryUserJoinedEvents(
  hubAddress: EvmAddress,
  userAddress: EvmAddress,
  alarmType?: AlarmType
) {
  const client = getPublicClient();
  return await client.getLogs({
    address: hubAddress,
    event: AlarmJoinedEvent,
    args: {
      user: userAddress,
      _type: alarmType ? alarmTypeVals[alarmType] : 0,
    },
    fromBlock: 0n,
  });
}
