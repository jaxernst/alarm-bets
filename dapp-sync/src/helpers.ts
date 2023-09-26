import { PublicClient, parseAbiItem } from "viem";
import PartnerAlarmClock from "./abi/PartnerAlarmClock";
import { viemClient } from ".";

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
    event: parseAbiItem(
      "event AlarmCreation(address indexed user, uint8 indexed _type, address alarmAddr, uint id)"
    ),
    args: {
      _type: opts?.alarmType && alarmTypeVals[opts.alarmType],
      user: opts?.user,
    },
    fromBlock: opts?.fromBlock,
    toBlock: opts?.toBlock,
  });
};
