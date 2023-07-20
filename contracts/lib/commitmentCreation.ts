import { BigNumberish, Contract, ethers } from "ethers";
import { deploy } from "../test/helpers/deploy";
import { SocialAlarmClockHub } from "../typechain-types";
import {
  AlarmType,
  AlarmContractTypes,
  alarmTypeVals,
  InitializationTypes,
  alarmFactories,
  solidityInitializationTypes,
  InitializationKeyOrder,
} from "./types";

export async function createAlarm<T extends AlarmType>(
  hub: SocialAlarmClockHub,
  name: T,
  initData: InitializationTypes[T],
  value?: BigNumberish
): Promise<AlarmContractTypes[T]> {
  if (
    (await hub.alarmTypeRegistry(alarmTypeVals[name])) ===
    ethers.constants.AddressZero
  ) {
    await registerNewType(hub, name);
  }

  if (!creationParamsOrderValid(name, initData)) {
    throw new Error("Invalid creations param key order");
  }

  const byteData = encodeCreationParams(name, initData);
  const rc = await (
    await hub.createAlarm(alarmTypeVals[name], byteData, {
      value: value ? value : 0,
    })
  ).wait();

  console.log();

  if (!rc.events) throw Error("No events found in tx");

  let alarmAddr: string;
  for (const event of rc.events) {
    if (event.event && event.event == "AlarmCreation") {
      alarmAddr = event.args!.alarmAddr;
    }
  }

  return (alarmFactories[name] as any).connect(alarmAddr!, hub.signer);
}

function creationParamsOrderValid<T extends AlarmType>(
  name: T,
  initData: InitializationTypes[T]
) {
  return InitializationKeyOrder[name].every(
    (expectedKey, i) => Object.keys(initData)[i] === expectedKey
  );
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

export async function registerNewType<
  Hub extends SocialAlarmClockHub,
  Name extends AlarmType
>(hub: Hub, contractName: Name) {
  const commit = await deploy(contractName);
  await (
    await hub.registerAlarmType(alarmTypeVals[contractName], commit.address)
  ).wait();
}
