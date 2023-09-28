import { PublicClient, getAbiItem, parseAbiItem } from "viem";
import { viemClient } from ".";
import AlarmBetsHub from "@alarm-bets/contracts/lib/abi/AlarmBetsHub";

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
