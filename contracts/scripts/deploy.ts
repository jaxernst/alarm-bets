import { ethers } from "hardhat";
import { SocialAlarmClockHub } from "../typechain-types";
import { AlarmType, alarmTypeVals } from "../lib/types";

/**
 * Deploy protocol hub and register commitment types
 */
async function main() {
  const factory = await ethers.getContractFactory("SocialAlarmClockHub");
  const CPH = await factory.deploy();
  console.log("Deployed protocol hub to", CPH.address);

  await registerType(CPH, "PartnerAlarmClock");
}

async function registerType(hub: SocialAlarmClockHub, type: AlarmType) {
  const contract = await (await ethers.getContractFactory(type)).deploy();
  await (
    await hub.registerAlarmType(alarmTypeVals[type], contract.address)
  ).wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
