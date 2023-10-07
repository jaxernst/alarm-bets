import { PublicClient, getAbiItem, parseAbiItem } from "viem";
import { viemClient } from ".";
import AlarmBetsHub from "@alarm-bets/contracts/lib/abi/AlarmBetsHub";
import PartnerAlarmClock from "@alarm-bets/contracts/lib/abi/PartnerAlarmClock";

export type EvmAddress = `0x${string}`;

type AlarmType = "PartnerAlarmClock";

export const alarmTypeVals: Record<AlarmType, number> = {
  PartnerAlarmClock: 0,
};

export const queryAlarmCreationEvents = async (
  hubAddress: EvmAddress,
  opts?: {
    fromBlock?: bigint;
    toBlock?: bigint;
    alarmType?: AlarmType;
    user?: EvmAddress;
  }
) => {
  return await viemClient.getLogs({
    address: hubAddress,
    event: getAbiItem({
      abi: AlarmBetsHub,
      name: "AlarmCreation",
    }),
    args: {
      alarmType: opts?.alarmType && alarmTypeVals[opts.alarmType],
      user: opts?.user,
    },
    fromBlock: opts?.fromBlock,
    toBlock: opts?.toBlock,
  });
};

export const alarmConstantsMulticallArgs = (alarmAddr: EvmAddress) => {
  const _multicallArgs = { address: alarmAddr, abi: PartnerAlarmClock };
  return {
    contracts: [
      { ..._multicallArgs, functionName: "alarmTime" },
      { ..._multicallArgs, functionName: "alarmDays" },
      { ..._multicallArgs, functionName: "status" },
      { ..._multicallArgs, functionName: "player1" },
      { ..._multicallArgs, functionName: "player2" },
      { ..._multicallArgs, functionName: "submissionWindow" },
    ],
  } as const;
};

export function formatAlarmConstants(
  alarmId: number,
  alarmAddr: EvmAddress,
  alarmTime: bigint,
  alarmDays: readonly number[],
  status: number,
  player1: EvmAddress,
  player2: EvmAddress,
  submissionWindow: bigint
) {
  return {
    alarm_id: alarmId,
    alarm_address: alarmAddr,
    status,
    player1,
    player2,
    alarm_time: Number(alarmTime),
    alarm_days: alarmDays.toString(),
    submission_window: Number(submissionWindow),
  };
}
