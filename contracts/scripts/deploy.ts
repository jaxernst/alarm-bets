import { ethers } from "hardhat";
import { AlarmBetsHub } from "../typechain-types";
import { AlarmType, alarmTypeVals } from "../lib/types";
import { parseUnits } from "ethers/lib/utils";

let gasPrice = parseUnits("1", "gwei");

/**
 * Deploy protocol hub and register commitment types
 */
async function main() {
  const factory = await ethers.getContractFactory("AlarmBetsHub");
  gasPrice = (await ethers.provider.getGasPrice()).add(parseUnits("1", "gwei"));
  const hub = await factory.deploy({ gasPrice });
  console.log("Deployed protocol hub to", hub.address);

  await registerType(hub, "PartnerAlarmClock");
}

async function registerType(hub: AlarmBetsHub, type: AlarmType) {
  const contract = await (await ethers.getContractFactory(type)).deploy();
  await (
    await hub.registerAlarmType(alarmTypeVals[type], contract.address, {
      gasPrice,
    })
  ).wait();
  console.log("Registered", type, "at", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
