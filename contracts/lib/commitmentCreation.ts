import { BigNumberish, Contract, ethers } from "ethers";
import { deploy } from "../test/helpers/deploy";
import { SocialAlarmClockHub } from "../typechain-types";
import {
  CommitmentType,
  CommitmentContractTypes,
  commitmentTypeVals,
  InitializationTypes,
  alarmFactories,
  solidityInitializationTypes,
} from "./types";

export async function createAlarm<T extends CommitmentType>(
  hub: SocialAlarmClockHub,
  name: T,
  initData: InitializationTypes[T],
  value?: BigNumberish
): Promise<CommitmentContractTypes[T]> {
  if (
    (await hub.alarmTypeRegistry(commitmentTypeVals[name])) ===
    ethers.constants.AddressZero
  ) {
    await registerNewType(hub, name);
  }

  const byteData = encodeCreationParams(name, initData);
  const rc = await (
    await hub.createAlarm(commitmentTypeVals[name], byteData, {
      value: value ? value : 0,
    })
  ).wait();

  if (!rc.events) throw Error("No events found in tx");

  let alarmAddr: string;
  for (const event of rc.events) {
    if (event.event && event.event == "AlarmCreation") {
      alarmAddr = event.args!.alarmAddr;
    }
  }

  return (alarmFactories[name] as any).connect(alarmAddr!, hub.signer);
}

export function encodeCreationParams<T extends CommitmentType>(
  name: T,
  initData: InitializationTypes[T]
): string {
  return ethers.utils.defaultAbiCoder.encode(
    solidityInitializationTypes[name],
    Object.values(initData)
  );
}

export async function registerNewType<
  Hub extends SocialAlarmClockHub,
  Name extends CommitmentType
>(hub: Hub, contractName: Name) {
  const commit = await deploy(contractName);
  await (
    await hub.registerAlarmType(
      commitmentTypeVals[contractName],
      commit.address
    )
  ).wait();
}
